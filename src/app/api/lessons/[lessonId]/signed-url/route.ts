// src/app/api/lessons/[lessonId]/signed-url/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
// GET /api/lessons/[lessonId]/signed-url - Generate CloudFront signed URL for video access
export async function GET(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = await auth();
    const { lessonId } = params;
    const { searchParams } = new URL(request.url);
    const quality = searchParams.get("quality") || "720p"; // Default to 720p
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get lesson with access verification
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
      },
      include: {
        module: {
          include: {
            product: {
              include: {
                purchases: {
                  where: {
                    userId: dbUser.id,
                    paymentStatus: "COMPLETED"
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }
    
    // Check if user has access (purchased course or is the creator or admin)
    const hasAccess = 
      lesson.module.product.purchases.length > 0 || // User purchased the course
      lesson.module.product.creatorId === dbUser.id || // User is the creator
      dbUser.role === "ADMIN" || // User is admin
      lesson.isPreview; // Lesson is a preview
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. Please purchase this course to view this lesson." },
        { status: 403 }
      );
    }
    
    // Check if lesson processing is complete
    if (lesson.uploadStatus !== 'completed' || !lesson.videoQualities) {
      return NextResponse.json(
        { error: "Video is still processing. Please try again later." },
        { status: 202 } // Accepted but not ready
      );
    }
    
    // Get video URL for requested quality
    const videoQualities = lesson.videoQualities as Record<string, any>;
    const requestedVideo = videoQualities[quality];
    
    if (!requestedVideo) {
      // Fallback to available qualities
      const availableQualities = Object.keys(videoQualities);
      const fallbackQuality = availableQualities.includes('720p') 
        ? '720p' 
        : availableQualities[0];
      
      if (!fallbackQuality) {
        return NextResponse.json(
          { error: "No video qualities available" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Quality ${quality} not available`,
          availableQualities,
          redirectQuality: fallbackQuality
        },
        { status: 400 }
      );
    }
    
    // Generate CloudFront signed URL
    const videoUrl = requestedVideo.url;
    const urlToSign = videoUrl.replace(`https://${process.env.AWS_CLOUDFRONT_DOMAIN}`, '');
    
    const privateKey = readFileSync(
      path.join(process.cwd(), 'keys', 'cloudfront-private-key.pem'),
      'utf8'
    );
    
    const signedUrl = getSignedUrl({
      url: videoUrl,
      keyPairId: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID!,
      privateKey,
      dateLessThan: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    });
    
    return NextResponse.json({
      signedUrl,
      quality,
      availableQualities: Object.keys(videoQualities),
      duration: lesson.duration,
      thumbnailUrl: lesson.thumbnailUrl,
      expiresIn: 4 * 60 * 60, // 4 hours in seconds
    });
    
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate video URL" },
      { status: 500 }
    );
  }
}