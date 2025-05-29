// src/app/api/courses/[courseId]/progress/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/courses/[courseId]/progress - Get user's progress in course
export async function GET(
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
    
    // Check if user has purchased this course
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: dbUser.id,
        productId: courseId,
        paymentStatus: "COMPLETED"
      }
    });
    
    if (!purchase) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }
    
    // Get all progress for this course
    const progress = await prisma.progress.findMany({
      where: { purchaseId: purchase.id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            position: true,
            duration: true,
            contentType: true,
            module: {
              select: {
                id: true,
                title: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        lesson: {
          position: 'asc'
        }
      }
    });
    
    // Calculate statistics
    const totalLessons = progress.length;
    const completedLessons = progress.filter(p => p.completed).length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Calculate time spent (sum of completed lesson durations)
    const timeSpent = progress
      .filter(p => p.completed && p.lesson.duration)
      .reduce((sum, p) => sum + (p.lesson.duration || 0), 0);
    
    // Group progress by modules
    const moduleProgress = progress.reduce((acc: any, p) => {
      const moduleId = p.lesson.module.id;
      if (!acc[moduleId]) {
        acc[moduleId] = {
          module: p.lesson.module,
          lessons: [],
          completedCount: 0,
          totalCount: 0
        };
      }
      
      acc[moduleId].lessons.push({
        id: p.lesson.id,
        title: p.lesson.title,
        position: p.lesson.position,
        contentType: p.lesson.contentType,
        duration: p.lesson.duration,
        completed: p.completed,
        completedAt: p.completedAt
      });
      
      acc[moduleId].totalCount++;
      if (p.completed) {
        acc[moduleId].completedCount++;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by module position
    const modules = Object.values(moduleProgress).sort((a: any, b: any) => 
      a.module.position - b.module.position
    );
    
    return NextResponse.json({
      courseId,
      purchaseId: purchase.id,
      enrolledAt: purchase.createdAt,
      statistics: {
        totalLessons,
        completedLessons,
        progressPercentage,
        timeSpent, // in seconds
        totalModules: modules.length
      },
      modules
    });
    
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch course progress" },
      { status: 500 }
    );
  }
}