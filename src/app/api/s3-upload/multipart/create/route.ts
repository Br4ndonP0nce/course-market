// src/app/api/s3-upload/multipart/create/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
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
    
    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        uploadId,
        creatorId: dbUser.id,
        lessonId,
        originalFileName: filename,
        fileSize: fileSize.toString(),
      },
    });
    
    const response = await s3Client.send(createCommand);
    
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
      uploadId: response.UploadId,
      key: s3Key,
    });
    
  } catch (error) {
    console.error("Error creating multipart upload:", error);
    return NextResponse.json({ error: "Failed to create multipart upload" }, { status: 500 });
  }
}

