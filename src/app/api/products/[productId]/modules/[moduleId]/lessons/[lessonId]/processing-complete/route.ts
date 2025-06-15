// src/app/api/lessons/[lessonId]/processing-complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const processingCompleteSchema = z.object({
    videoQualities: z.record(z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
      bitrate: z.number().optional(),
      fileSize: z.number().optional()
    })),
    thumbnailUrl: z.string(),
    contentUrl: z.string(), // Primary/highest quality URL
    duration: z.number().positive(),
    jobId: z.string().optional()
  });
  
  export async function POST(
    request: Request,
    { params }: { params: { lessonId: string } }
  ) {
    try {
      const { lessonId } = params;
      
      // Validate the request comes from your processing infrastructure
      const authHeader = request.headers.get('authorization');
      const expectedToken = `Bearer ${process.env.PROCESSING_API_SECRET}`;
      
      if (!authHeader || authHeader !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await request.json();
      const validatedData = processingCompleteSchema.parse(body);
  
      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          uploadStatus: 'completed',
          processingProgress: 100,
          processingError: null,
          videoQualities: validatedData.videoQualities,
          thumbnailUrl: validatedData.thumbnailUrl,
          contentUrl: validatedData.contentUrl,
          duration: validatedData.duration,
          processedAt: new Date(),
          ...(validatedData.jobId && { processingJobId: validatedData.jobId })
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  creatorId: true
                }
              }
            }
          }
        }
      });
  
      return NextResponse.json({ 
        success: true, 
        lesson,
        message: "Video processing completed successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
  
      console.error("Error completing lesson processing:", error);
      return NextResponse.json(
        { error: "Failed to complete processing" },
        { status: 500 }
      );
    }
  }
  