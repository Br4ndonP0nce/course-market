
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
  
// src/app/api/modules/[moduleId]/reorder/route.ts
  const reorderSchema = z.object({
    lessons: z.array(z.object({
      id: z.string(),
      position: z.number().min(1)
    }))
  });
  
  // POST /api/modules/[moduleId]/reorder - Reorder lessons in module
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
        }
      });
  
      if (!module) {
        return NextResponse.json(
          { error: "Module not found or access denied" },
          { status: 403 }
        );
      }
  
      const body = await request.json();
      const validatedData = reorderSchema.parse(body);
  
      // Update lesson positions in a transaction
      const updatePromises = validatedData.lessons.map(({ id, position }) =>
        prisma.lesson.update({
          where: { 
            id,
            moduleId // Ensure lesson belongs to this module
          },
          data: { position }
        })
      );
  
      await prisma.$transaction(updatePromises);
  
      // Return updated lessons
      const updatedLessons = await prisma.lesson.findMany({
        where: { moduleId },
        orderBy: { position: 'asc' }
      });
  
      return NextResponse.json({ 
        message: "Lessons reordered successfully",
        lessons: updatedLessons
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
  
      console.error("Error reordering lessons:", error);
      return NextResponse.json(
        { error: "Failed to reorder lessons" },
        { status: 500 }
      );
    }
  }