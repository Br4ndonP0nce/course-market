
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

  // src/app/api/lessons/[lessonId]/task-id/route.ts
  export async function GET(
    request: Request,
    { params }: { params: { lessonId: string } }
  ) {
    try {
      const { lessonId } = params;
      
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
          id: true,
          processingJobId: true,
          uploadStatus: true
        }
      });
  
      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({
        lessonId: lesson.id,
        taskId: lesson.processingJobId,
        status: lesson.uploadStatus
      });
    } catch (error) {
      console.error("Error fetching lesson task ID:", error);
      return NextResponse.json(
        { error: "Failed to fetch task ID" },
        { status: 500 }
      );
    }
  }