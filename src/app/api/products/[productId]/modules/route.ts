// src/app/api/products/[productId]/modules/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  position: z.number().min(1)
});

const bulkModulesSchema = z.object({
  modules: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    position: z.number(),
    lessons: z.array(z.any()).optional()
  }))
});

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    
    const modules = await prisma.module.findMany({
      where: { productId },
      include: {
        lessons: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    });
    
    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await auth();
    const { productId } = params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user owns the product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        creatorId: dbUser.id
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a bulk update
    if (body.modules) {
      const validatedData = bulkModulesSchema.parse(body);
      
      // Handle bulk module updates
      const updatedModules = [];
      
      for (const moduleData of validatedData.modules) {
        if (moduleData.id && !moduleData.id.startsWith('temp-')) {
          // Update existing module
          const updated = await prisma.module.update({
            where: { id: moduleData.id },
            data: {
              title: moduleData.title,
              description: moduleData.description,
              position: moduleData.position
            },
            include: {
              lessons: {
                orderBy: { position: 'asc' }
              }
            }
          });
          updatedModules.push(updated);
        } else {
          // Create new module
          const created = await prisma.module.create({
            data: {
              title: moduleData.title,
              description: moduleData.description,
              position: moduleData.position,
              productId
            },
            include: {
              lessons: {
                orderBy: { position: 'asc' }
              }
            }
          });
          updatedModules.push(created);
        }
      }
      
      return NextResponse.json({ modules: updatedModules });
    } else {
      // Single module creation
      const validatedData = moduleSchema.parse(body);
      
      const module = await prisma.module.create({
        data: {
          ...validatedData,
          productId
        },
        include: {
          lessons: {
            orderBy: { position: 'asc' }
          }
        }
      });

      return NextResponse.json(module);
    }
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

// src/app/api/lessons/[lessonId]/route.ts
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
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or access denied" },
        { status: 403 }
      );
    }

    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}

// src/app/api/lessons/[lessonId]/processing-status/route.ts
