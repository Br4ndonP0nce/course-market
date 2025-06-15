// scripts/create-test-lesson.ts
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

async function createTestLesson() {
  try {
    // First, let's check if we have any modules to attach the lesson to
    const modules = await prisma.module.findMany({
      take: 1,
    });

    if (modules.length === 0) {
      console.log('No modules found. Creating test data first...');
      
      // Check if we have any products
      const products = await prisma.product.findMany({
        take: 1,
      });

      let productId;
      if (products.length === 0) {
        console.log('Creating test product...');
        // Create test product
        const product = await prisma.product.create({
          data: {
            title: 'Test Course',
            slug: 'test-course',
            description: 'Test course for video processing',
            price: 99.99,
            creatorId: 'test-creator-id', // You'll need a real user ID
          },
        });
        productId = product.id;
      } else {
        productId = products[0].id;
      }

      // Create test module
      const module = await prisma.module.create({
        data: {
          title: 'Test Module',
          description: 'Test module for video processing',
          position: 1,
          productId: productId,
        },
      });

      console.log('Test module created:', module.id);
    }

    // Now create the test lesson
    const availableModule = await prisma.module.findFirst();
    
    if (!availableModule) {
      throw new Error('No module available for lesson');
    }

    const lesson = await prisma.lesson.create({
      data: {
        id: 'lesson-test-123', // Use the same ID from your test
        title: 'Test Video Lesson',
        description: 'Test lesson for video processing pipeline',
        contentType: 'VIDEO',
        position: 1,
        moduleId: availableModule.id,
        uploadStatus: 'pending',
        processingProgress: 0,
      },
    });

    console.log('✅ Test lesson created successfully:', lesson.id);
    console.log('Now you can run your video processing test again!');

  } catch (error) {
    console.error('Error creating test lesson:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLesson();