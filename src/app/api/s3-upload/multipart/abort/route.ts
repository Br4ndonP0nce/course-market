// src/app/api/s3-upload/multipart/abort/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";

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
    
    const { uploadId, key } = await request.json();
    
    // Abort multipart upload
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: key,
      UploadId: uploadId,
    });
    
    await s3Client.send(abortCommand);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
    return NextResponse.json({ error: "Failed to abort multipart upload" }, { status: 500 });
  }
}
