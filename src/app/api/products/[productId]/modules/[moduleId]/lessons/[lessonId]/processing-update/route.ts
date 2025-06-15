import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const processingUpdateSchema = z.object({
    status: z.enum(['pending', 'uploading', 'uploaded', 'processing', 'completed', 'failed']).optional(),
    progress: z.number().min(0).max(100).optional(),
    error: z.string().optional(),
    videoQualities: z.record(z.any()).optional(),
    thumbnailUrl: z.string().optional(),
    contentUrl: z.string().optional(),
    duration: z.number().positive().optional(),
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
      const validatedData = processingUpdateSchema.parse(body);
  
      // Build update object
      const updateData: any = {};
      
      if (validatedData.status) {
        updateData.uploadStatus = validatedData.status;
      }
      
      if (validatedData.progress !== undefined) {
        updateData.processingProgress = validatedData.progress;
      }
      
      if (validatedData.error !== undefined) {
        updateData.processingError = validatedData.error;
      }
      
      if (validatedData.videoQualities) {
        updateData.videoQualities = validatedData.videoQualities;
      }
      
      if (validatedData.thumbnailUrl) {
        updateData.thumbnailUrl = validatedData.thumbnailUrl;
      }
      
      if (validatedData.contentUrl) {
        updateData.contentUrl = validatedData.contentUrl;
      }
      
      if (validatedData.duration) {
        updateData.duration = validatedData.duration;
      }
      
      if (validatedData.jobId) {
        updateData.processingJobId = validatedData.jobId;
      }
      
      // Set processedAt timestamp if status is completed
      if (validatedData.status === 'completed') {
        updateData.processedAt = new Date();
      }
  
      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
        select: {
          id: true,
          title: true,
          uploadStatus: true,
          processingProgress: true,
          processingError: true,
          videoQualities: true,
          thumbnailUrl: true,
          contentUrl: true,
          duration: true,
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
  
      return NextResponse.json({ 
        success: true, 
        lesson,
        message: `Processing status updated to: ${validatedData.status || 'in progress'}`
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
        { error: "Failed to update processing status" },
        { status: 500 }
      );
    }
  }
  