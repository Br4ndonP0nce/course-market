// src/app/api/courses/[courseId]/complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const completeSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  completed: z.boolean().default(true)
});

// POST /api/courses/[courseId]/complete - Mark lesson as complete/incomplete
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
    
    const body = await request.json();
    const { lessonId, completed } = completeSchema.parse(body);
    
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
    
    // Check if user has access to this course
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: dbUser.id,
        productId: courseId,
        paymentStatus: "COMPLETED"
      }
    });
    
    if (!purchase) {
      return NextResponse.json(
        { error: "You don't have access to this course" },
        { status: 403 }
      );
    }
    
    // Verify lesson belongs to this course
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          productId: courseId
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found in this course" },
        { status: 404 }
      );
    }
    
    // Update or create progress record
    const updatedProgress = await prisma.progress.upsert({
      where: {
        purchaseId_lessonId: {
          purchaseId: purchase.id,
          lessonId: lesson.id
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null
      },
      create: {
        purchaseId: purchase.id,
        lessonId: lesson.id,
        completed,
        completedAt: completed ? new Date() : null
      }
    });
    
    // Get updated course progress statistics
    const allProgress = await prisma.progress.findMany({
      where: { purchaseId: purchase.id }
    });
    
    const totalLessons = allProgress.length;
    const completedLessons = allProgress.filter(p => p.completed).length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    // Check if course is now complete
    const courseCompleted = progressPercentage === 100;
    
    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        completed,
        completedAt: updatedProgress.completedAt
      },
      courseProgress: {
        totalLessons,
        completedLessons,
        progressPercentage,
        courseCompleted
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to update lesson progress" },
      { status: 500 }
    );
  }
}
