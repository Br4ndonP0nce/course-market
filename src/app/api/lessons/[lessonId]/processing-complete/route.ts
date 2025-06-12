// src/app/api/lessons/[lessonId]/processing-complete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const processingCompleteSchema = z.object({
  uploadStatus: z.enum(['completed', 'failed']),
  processingProgress: z.number().min(0).max(100).optional(),
  processedAt: z.string().optional(),
  videoQualities: z.record(z.any()).optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  processingJobId: z.string().optional(),
  processingError: z.string().optional(),
});

// POST /api/lessons/[lessonId]/processing-complete - Internal API for Lambda
export async function POST(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    
    // Verify internal API key for security
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.INTERNAL_API_KEY}`;
    
    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid internal API key" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const updateData = processingCompleteSchema.parse(body);
    
    // Find the lesson
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            product: {
              include: {
                creator: true
              }
            }
          }
        }
      }
    });
    
    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateFields: any = {
      uploadStatus: updateData.uploadStatus,
    };
    
    if (updateData.processingProgress !== undefined) {
      updateFields.processingProgress = updateData.processingProgress;
    }
    
    if (updateData.processedAt) {
      updateFields.processedAt = new Date(updateData.processedAt);
    }
    
    if (updateData.videoQualities) {
      updateFields.videoQualities = updateData.videoQualities;
      // Set contentUrl to the highest quality available, or 720p as default
      const qualities = updateData.videoQualities;
      if (qualities['1080p']) {
        updateFields.contentUrl = qualities['1080p'].url;
      } else if (qualities['720p']) {
        updateFields.contentUrl = qualities['720p'].url;
      } else if (qualities['360p']) {
        updateFields.contentUrl = qualities['360p'].url;
      }
    }
    
    if (updateData.thumbnailUrl) {
      updateFields.thumbnailUrl = updateData.thumbnailUrl;
    }
    
    if (updateData.duration !== undefined) {
      updateFields.duration = updateData.duration;
    }
    
    if (updateData.processingJobId) {
      updateFields.processingJobId = updateData.processingJobId;
    }
    
    if (updateData.processingError) {
      updateFields.processingError = updateData.processingError;
    }
    
    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateFields,
    });
    
    console.log(`Lesson ${lessonId} processing status updated to ${updateData.uploadStatus}`);
    
    return NextResponse.json({
      success: true,
      lesson: {
        id: updatedLesson.id,
        uploadStatus: updatedLesson.uploadStatus,
        processingProgress: updatedLesson.processingProgress,
        videoQualities: updatedLesson.videoQualities,
        contentUrl: updatedLesson.contentUrl,
        thumbnailUrl: updatedLesson.thumbnailUrl,
        duration: updatedLesson.duration,
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating lesson processing status:", error);
    return NextResponse.json(
      { error: "Failed to update lesson processing status" },
      { status: 500 }
    );
  }
}

