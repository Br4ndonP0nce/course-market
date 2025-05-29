// src/app/api/lessons/[lessonId]/complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/lessons/[lessonId]/complete - Mark lesson as complete
export async function POST(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = await auth();
    const { lessonId } = params;
    
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
    
    // Get lesson with module and product info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }
    
    // Check if user has access to this lesson
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: dbUser.id,
        productId: lesson.module.product.id,
        paymentStatus: "COMPLETED"
      }
    });
    
    if (!purchase) {
      return NextResponse.json(
        { error: "You don't have access to this lesson" },
        { status: 403 }
      );
    }
    
    // Update progress
    const updatedProgress = await prisma.progress.upsert({
      where: {
        purchaseId_lessonId: {
          purchaseId: purchase.id,
          lessonId: lesson.id
        }
      },
      update: {
        completed: true,
        completedAt: new Date()
      },
      create: {
        purchaseId: purchase.id,
        lessonId: lesson.id,
        completed: true,
        completedAt: new Date()
      }
    });
    
    // Get updated progress statistics
    const allProgress = await prisma.progress.findMany({
      where: { purchaseId: purchase.id }
    });
    
    const totalLessons = allProgress.length;
    const completedLessons = allProgress.filter(p => p.completed).length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    return NextResponse.json({
      progress: updatedProgress,
      statistics: {
        totalLessons,
        completedLessons,
        progressPercentage
      }
    });
    
  } catch (error) {
    console.error("Error completing lesson:", error);
    return NextResponse.json(
      { error: "Failed to complete lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[lessonId]/complete - Mark lesson as incomplete
export async function DELETE(
    request: Request,
    { params }: { params: { lessonId: string } }
) {
    try {
        const { userId } = await auth();
        const { lessonId } = params;
    
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
    
        // Get lesson with module and product info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        product: true
                    }
                }
            }
        });
    
        if (!lesson) {
            return NextResponse.json(
                { error: "Lesson not found" },
                { status: 404 }
            );
        }
    
        // Check if user has access to this lesson
        const purchase = await prisma.purchase.findFirst({
            where: {
                userId: dbUser.id,
                productId: lesson.module.product.id,
                paymentStatus: "COMPLETED"
            }
        });
    
        if (!purchase) {
            return NextResponse.json(
                { error: "You don't have access to this lesson" },
                { status: 403 }
            );
        }
    
        // Update progress
        const updatedProgress = await prisma.progress.update({
            where: {
                purchaseId_lessonId: {
                    purchaseId: purchase.id,
                    lessonId: lesson.id
                }
            },
            data: {
                completed: false,
                completedAt: null
            }
        });
    
        // Get updated progress statistics
        const allProgress = await prisma.progress.findMany({
            where: { purchaseId: purchase.id }
        });
    
        const totalLessons = allProgress.length;
        const completedLessons = allProgress.filter(p => p.completed).length;
        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
        return NextResponse.json({
            progress: updatedProgress,
            statistics: {
                totalLessons,
                completedLessons,
                progressPercentage
            }
        });
    
    } catch (error) {
        console.error("Error uncompleting lesson:", error);
        return NextResponse.json(
            { error: "Failed to uncomplete lesson" },
            { status: 500 }
        );
    }
}