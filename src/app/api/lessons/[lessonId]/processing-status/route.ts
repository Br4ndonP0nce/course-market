import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      select: {
        uploadStatus: true,
        processingProgress: true,
        processingError: true,
        videoQualities: true,
        thumbnailUrl: true,
        duration: true,
        processedAt: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Processing status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}