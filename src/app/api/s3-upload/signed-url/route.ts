
// src/app/api/s3-upload/signed-url/route.ts - For non-multipart uploads
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { filename, contentType, fileSize, lessonId } = await request.json();
    
    // Validate user owns this lesson
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
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
      return NextResponse.json({ error: "Lesson not found or access denied" }, { status: 403 });
    }
    
    // Generate S3 key
    const uploadId = nanoid();
    const fileExtension = filename.split('.').pop() || 'mp4';
    const s3Key = `creators/${dbUser.id}/${uploadId}/original.${fileExtension}`;
    
    // Create signed URL for direct upload
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: s3Key,
      ContentType: contentType,
      ContentLength: fileSize,
      Metadata: {
        uploadId,
        creatorId: dbUser.id,
        lessonId,
        originalFileName: filename,
        fileSize: fileSize.toString(),
      },
    });
    
    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 3600, // 1 hour
    });
    
    // Update lesson status
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        uploadStatus: 'uploading',
        rawVideoUrl: `s3://${process.env.AWS_S3_RAW_UPLOADS_BUCKET}/${s3Key}`,
        processingProgress: 0,
      }
    });
    
    return NextResponse.json({
      method: 'PUT',
      url: presignedUrl,
      fields: {}, // Empty for PUT uploads
    });
    
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
  }
}