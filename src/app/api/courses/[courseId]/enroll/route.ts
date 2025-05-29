import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/courses/[courseId]/enroll - Enroll in course (free courses)
export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    const { courseId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
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
    
    // Get course
    const course = await prisma.product.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true
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
        { error: "Course is not available" },
        { status: 400 }
      );
    }
    
    // Check if course is free or user is admin
    if (course.price.toNumber() > 0 && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "This course requires payment" },
        { status: 400 }
      );
    }
    
    // Check if already enrolled
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
    
    // Create purchase and progress records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          userId: dbUser.id,
          productId: course.id,
          amount: course.price,
          paymentStatus: "COMPLETED",
          stripePaymentId: course.price.toNumber() === 0 ? "free_enrollment" : null
        }
      });
      
      // Create progress records for all lessons
      const progressRecords = [];
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          progressRecords.push({
            purchaseId: purchase.id,
            lessonId: lesson.id,
            completed: false
          });
        }
      }
      
      if (progressRecords.length > 0) {
        await tx.progress.createMany({
          data: progressRecords
        });
      }
      
      return purchase;
    });
    
    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      purchaseId: result.id,
      enrolledAt: result.createdAt
    });
    
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}