// src/app/api/s3-upload/multipart/complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";

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
    
    const { uploadId, key, parts, lessonId } = await request.json();
    
    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part: any) => ({
          ETag: part.etag,
          PartNumber: part.number,
        })),
      },
    });
    
    const response = await s3Client.send(completeCommand);
    
    // Update lesson status to uploaded (triggers Lambda processing)
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        uploadStatus: 'uploaded',
        uploadedAt: new Date(),
        processingProgress: 10,
      }
    });
    
    return NextResponse.json({
      location: response.Location,
    });
    
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json({ error: "Failed to complete multipart upload" }, { status: 500 });
  }
}
