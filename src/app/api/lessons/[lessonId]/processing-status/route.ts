import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/lessons/[lessonId]/processing-status - Get processing status
export async function GET(
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
    
    // Get lesson with creator verification
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          product: {
            creatorId: dbUser.id // Only creator can check processing status
          }
        }
      },
      select: {
        id: true,
        uploadStatus: true,
        processingProgress: true,
        processingError: true,
        videoQualities: true,
        thumbnailUrl: true,
        duration: true,
        processingJobId: true,
        uploadedAt: true,
        processedAt: true,
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      lessonId: lesson.id,
      uploadStatus: lesson.uploadStatus,
      processingProgress: lesson.processingProgress,
      processingError: lesson.processingError,
      videoQualities: lesson.videoQualities,
      thumbnailUrl: lesson.thumbnailUrl,
      duration: lesson.duration,
      processingJobId: lesson.processingJobId,
      uploadedAt: lesson.uploadedAt,
      processedAt: lesson.processedAt,
    });
    
  } catch (error) {
    console.error("Error fetching processing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing status" },
      { status: 500 }
    );
  }
}