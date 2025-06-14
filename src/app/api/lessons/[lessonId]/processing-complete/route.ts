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

    const data = await request.json();
    
    console.log(`Completing lesson ${params.lessonId} processing:`, data);
    
    await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        uploadStatus: 'completed',
        processingProgress: 100,
        processedAt: new Date(),
        duration: data.duration,
        videoQualities: data.videoQualities,
        thumbnailUrl: data.thumbnailUrl,
        contentUrl: data.contentUrl,
        processingError: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Processing completion error:', error);
    return NextResponse.json({ error: 'Completion failed' }, { status: 500 });
  }
}
