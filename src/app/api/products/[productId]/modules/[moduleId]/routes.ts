// src/app/api/modules/[moduleId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateModuleSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  position: z.number().min(1).optional()
});

// GET /api/modules/[moduleId] - Get single module with lessons
export async function GET(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { position: 'asc' }
        },
        product: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

// PUT /api/modules/[moduleId] - Update module
export async function PUT(
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
    const existingModule = await prisma.module.findFirst({
      where: {
        id: moduleId,
        product: {
          creatorId: dbUser.id
        }
      },
      include: {
        product: {
          select: {
            id: true,
            creatorId: true
          }
        }
      }
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateModuleSchema.parse(body);

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: validatedData,
      include: {
        lessons: {
          orderBy: { position: 'asc' }
        },
        product: {
          select: {
            id: true,
            title: true,
            creatorId: true
          }
        }
      }
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE /api/modules/[moduleId] - Delete module and all lessons
export async function DELETE(
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

    // Verify user owns the module and get lesson count
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        product: {
          creatorId: dbUser.id
        }
      },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            uploadStatus: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 403 }
      );
    }

    // Check if there are any lessons with active video processing
    const processingLessons = module.lessons.filter(
      lesson => lesson.uploadStatus === 'processing' || lesson.uploadStatus === 'uploading'
    );

    if (processingLessons.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete module with lessons currently being processed",
          processingLessons: processingLessons.map(l => l.title)
        },
        { status: 400 }
      );
    }

    // Perform the deletion (this will cascade to lessons due to Prisma schema)
    await prisma.module.delete({
      where: { id: moduleId }
    });

    return NextResponse.json({ 
      message: "Module and all lessons deleted successfully",
      deletedLessons: module.lessons.length
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}

// src/app/api/modules/[moduleId]/lessons/route.ts
const lessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  contentType: z.enum(['VIDEO', 'PDF', 'TEXT', 'QUIZ']),
  position: z.number().min(1),
  isPreview: z.boolean().default(false)
});

