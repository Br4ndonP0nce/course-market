// src/app/api/courses/[courseId]/route.ts - Complete Fixed Version
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/courses/[courseId] - Flexible course data loading
export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include"); // 'structure' | 'content'
    const lessonId = searchParams.get("lesson"); // specific lesson ID
    
    // Get user if authenticated
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: userId }
      });
    }
    
    // Check if user has access to this course
    let userPurchase = null;
    if (dbUser) {
      userPurchase = await prisma.purchase.findFirst({
        where: {
          userId: dbUser.id,
          productId: courseId,
          paymentStatus: "COMPLETED"
        }
      });
    }
    
    // If requesting specific lesson content
    if (lessonId && include === 'content') {
      if (!userPurchase) {
        return NextResponse.json(
          { error: "Access denied. Please purchase this course." },
          { status: 403 }
        );
      }
      
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          module: {
            productId: courseId
          }
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              position: true
            }
          },
          progress: {
            where: {
              purchaseId: userPurchase.id
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
      
      // TODO: Generate signed URL for video content with GCP
      const videoUrl = lesson.contentUrl;
      
      return NextResponse.json({
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          contentType: lesson.contentType,
          contentUrl: videoUrl,
          duration: lesson.duration,
          completed: lesson.progress[0]?.completed || false,
          completedAt: lesson.progress[0]?.completedAt
        },
        module: lesson.module,
        courseId: courseId
      });
    }
    
    // Build the main course query
    const courseQuery: any = {
      where: { id: courseId },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            purchases: true,
            modules: true
          }
        }
      }
    };
    
    // Add modules and lessons if requested
    if (include === 'structure' || include === 'content') {
      if (!userPurchase && include === 'content') {
        return NextResponse.json(
          { error: "Access denied. Please purchase this course." },
          { status: 403 }
        );
      }
      
      courseQuery.include.modules = {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              contentType: true,
              position: true,
              isPreview: true,
              duration: true,
              ...(include === 'content' && userPurchase ? {
                contentUrl: true,
                progress: {
                  where: {
                    purchaseId: userPurchase.id
                  }
                }
              } : {})
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      };
    }
    
    const course = await prisma.product.findUnique(courseQuery);
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    // Check if course is published (unless user owns it)
    if (!course.published && (!dbUser || course.creatorId !== dbUser.id)) {
      return NextResponse.json(
        { error: "Course not available" },
        { status: 404 }
      );
    }
    
    // Transform the response for frontend consumption
    const response: any = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      price: course.price.toNumber(), // Convert Decimal to number
      published: course.published,
      featuredImage: course.featuredImage,
      categories: course.categories ? course.categories.split(',') : [],
      language: course.language,
      primaryCountry: course.primaryCountry,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      creator: (course as any).creator || { id: course.creatorId, name: 'Unknown' },
      studentCount: (course as any)._count?.purchases || 0,
      moduleCount: (course as any)._count?.modules || 0,
      userHasAccess: !!userPurchase,
      enrolledAt: userPurchase?.createdAt || null
    };
    
    // Process modules and lessons if they were included
    if ((course as any).modules) {
      response.modules = (course as any).modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        position: module.position,
        lessons: module.lessons.map((lesson: any) => {
          const lessonData: any = {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            contentType: lesson.contentType,
            position: lesson.position,
            isPreview: lesson.isPreview,
            duration: lesson.duration
          };
          
          // Add progress data if user has access
          if (userPurchase && lesson.progress) {
            lessonData.completed = lesson.progress[0]?.completed || false;
            lessonData.completedAt = lesson.progress[0]?.completedAt;
          }
          
          // Add content URL if requesting full content
          if (include === 'content' && lesson.contentUrl) {
            // TODO: Generate signed GCP URL here
            lessonData.contentUrl = lesson.contentUrl;
          }
          
          return lessonData;
        })
      }));
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}