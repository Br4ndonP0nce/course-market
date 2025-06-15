
// src/app/api/lessons/[lessonId]/processing-status/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
          title: true,
          uploadStatus: true,
          processingProgress: true,
          processingError: true,
          processingJobId: true,
          videoQualities: true,
          thumbnailUrl: true,
          contentUrl: true,
          duration: true,
          processedAt: true,
          uploadedAt: true,
          rawVideoUrl: true
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
      console.error("Error fetching lesson processing status:", error);
      return NextResponse.json(
        { error: "Failed to fetch processing status" },
        { status: 500 }
      );
    }
  }
  
