// src/app/api/lessons/[lessonId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateLessonSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  position: z.number().min(1).optional(),
  isPreview: z.boolean().optional(),
  contentType: z.enum(['VIDEO', 'PDF', 'TEXT', 'QUIZ']).optional()
});

// GET /api/lessons/[lessonId] - Get single lesson
export async function GET(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            position: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                creatorId: true
              }
            }
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

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[lessonId] - Update lesson
export async function PUT(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = await auth();
    const { lessonId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user owns the lesson
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          product: {
            creatorId: dbUser.id
          }
        }
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            product: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateLessonSchema.parse(body);

    // If changing content type to VIDEO, reset upload status
    const updateData: any = { ...validatedData };
    if (validatedData.contentType === 'VIDEO' && existingLesson.contentType !== 'VIDEO') {
      updateData.uploadStatus = 'pending';
      updateData.processingProgress = 0;
      updateData.contentUrl = null;
      updateData.videoQualities = null;
      updateData.thumbnailUrl = null;
      updateData.duration = null;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            position: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = await auth();
    const { lessonId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user owns the lesson
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          product: {
            creatorId: dbUser.id
          }
        }
      },
      include: {
        module: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 403 }
      );
    }

    // Check if lesson is currently being processed
    if (lesson.uploadStatus === 'processing' || lesson.uploadStatus === 'uploading') {
      return NextResponse.json(
        { error: "Cannot delete lesson while video is being processed or uploaded" },
        { status: 400 }
      );
    }

    // TODO: In production, you might want to also delete associated S3 files here
    // if (lesson.rawVideoUrl || lesson.contentUrl) {
    //   await deleteS3Files(lesson);
    // }

    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json({ 
      message: "Lesson deleted successfully",
      deletedLesson: {
        id: lesson.id,
        title: lesson.title,
        module: lesson.module.title
      }
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
