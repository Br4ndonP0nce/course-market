import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.INTERNAL_API_KEY;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || !expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const providedKey = authHeader.substring(7);
    if (providedKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, progress, error } = await request.json();
    
    console.log(`Updating lesson ${params.lessonId}: ${status} (${progress}%)`);
    
    await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        uploadStatus: status,
        processingProgress: progress,
        ...(error && { processingError: error }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Processing update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}