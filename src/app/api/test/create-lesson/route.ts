// src/app/api/test/create-lesson/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a test product and module if they don't exist
    let testProduct = await prisma.product.findFirst({
      where: {
        title: 'Test Product',
        creatorId: dbUser.id
      }
    });

    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          title: 'Test Product',
          slug: `test-product-${Date.now()}`,
          description: 'Test product for video uploads',
          price: 0,
          creatorId: dbUser.id,
        }
      });
    }

    let testModule = await prisma.module.findFirst({
      where: {
        title: 'Test Module',
        productId: testProduct.id
      }
    });

    if (!testModule) {
      testModule = await prisma.module.create({
        data: {
          title: 'Test Module',
          description: 'Test module for video uploads',
          position: 1,
          productId: testProduct.id,
        }
      });
    }

    // Create test lesson
    const testLesson = await prisma.lesson.create({
      data: {
        title: `Test Lesson ${Date.now()}`,
        description: 'Test lesson for video upload',
        contentType: 'VIDEO',
        position: 1,
        moduleId: testModule.id,
        uploadStatus: 'pending',
        processingProgress: 0,
      }
    });

    return NextResponse.json({
      lessonId: testLesson.id,
      productId: testProduct.id,
      moduleId: testModule.id,
    });

  } catch (error) {
    console.error("Error creating test lesson:", error);
    return NextResponse.json({ error: "Failed to create test lesson" }, { status: 500 });
  }
}