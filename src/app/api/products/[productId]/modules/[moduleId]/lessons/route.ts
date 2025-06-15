
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// src/app/api/modules/[moduleId]/lessons/route.ts
const lessonSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    contentType: z.enum(['VIDEO', 'PDF', 'TEXT', 'QUIZ']),
    position: z.number().min(1),
    isPreview: z.boolean().default(false)
  });
  
  // GET /api/modules/[moduleId]/lessons - Get all lessons in module
  export async function GET(
    request: Request,
    { params }: { params: { moduleId: string } }
  ) {
    try {
      const { moduleId } = params;
      
      // Verify module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true, title: true }
      });
  
      if (!module) {
        return NextResponse.json(
          { error: "Module not found" },
          { status: 404 }
        );
      }
  
      const lessons = await prisma.lesson.findMany({
        where: { moduleId },
        orderBy: { position: 'asc' }
      });
  
      return NextResponse.json({ 
        module,
        lessons,
        count: lessons.length
      });
    } catch (error) {
      console.error("Error fetching lessons:", error);
      return NextResponse.json(
        { error: "Failed to fetch lessons" },
        { status: 500 }
      );
    }
  }
  
  // POST /api/modules/[moduleId]/lessons - Create new lesson
  export async function POST(
    request: Request,
    { params }: { params: { moduleId: string } }
  ) {
    try {
      const { userId } = await auth();
      const { moduleId } = params;
      
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId }
      });
  
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      // Verify user owns the module
      const module = await prisma.module.findFirst({
        where: {
          id: moduleId,
          product: {
            creatorId: dbUser.id
          }
        },
        include: {
          lessons: {
            select: { position: true }
          }
        }
      });
  
      if (!module) {
        return NextResponse.json(
          { error: "Module not found or access denied" },
          { status: 403 }
        );
      }
  
      const body = await request.json();
      const validatedData = lessonSchema.parse(body);
      
      // Auto-calculate position if not provided or invalid
      const maxPosition = module.lessons.length > 0 
        ? Math.max(...module.lessons.map(l => l.position))
        : 0;
      
      const finalPosition = validatedData.position || (maxPosition + 1);
      
      const lesson = await prisma.lesson.create({
        data: {
          ...validatedData,
          position: finalPosition,
          moduleId,
          uploadStatus: validatedData.contentType === 'VIDEO' ? 'pending' : 'completed',
          processingProgress: 0
        }
      });
  
      return NextResponse.json(lesson, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
  
      console.error("Error creating lesson:", error);
      return NextResponse.json(
        { error: "Failed to create lesson" },
        { status: 500 }
      );
    }
  }
  