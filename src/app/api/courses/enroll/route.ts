// src/app/api/courses/enroll/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const enrollSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

// POST /api/courses/enroll - Enroll in a course (free courses or magic link access)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { courseId } = enrollSchema.parse(body);
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get course details
    const course = await prisma.product.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    if (!course.published) {
      return NextResponse.json(
        { error: "Course is not available for enrollment" },
        { status: 400 }
      );
    }
    
    // Check if course is free
    if (course.price.toNumber() > 0) {
      return NextResponse.json(
        { error: "This course requires payment. Please use the purchase flow." },
        { status: 400 }
      );
    }
    
    // Check if user is already enrolled
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: dbUser.id,
        productId: course.id,
        paymentStatus: "COMPLETED"
      }
    });
    
    if (existingPurchase) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 400 }
      );
    }
    
    // Create enrollment and progress tracking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create purchase record for free enrollment
      const purchase = await tx.purchase.create({
        data: {
          userId: dbUser.id,
          productId: course.id,
          amount: course.price, // $0 for free courses
          paymentStatus: "COMPLETED",
          stripePaymentId: "free_enrollment", // Mark as free enrollment
        }
      });
      
      // Create progress records for all lessons
      const progressRecords = [];
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          progressRecords.push({
            purchaseId: purchase.id,
            lessonId: lesson.id,
            completed: false,
          });
        }
      }
      
      if (progressRecords.length > 0) {
        await tx.progress.createMany({
          data: progressRecords,
          skipDuplicates: true, // In case of any race conditions
        });
      }
      
      return purchase;
    });
    
    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment: {
        id: result.id,
        courseId: course.id,
        courseTitle: course.title,
        enrolledAt: result.createdAt,
        totalLessons: course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}