// src/app/api/s3-upload/multipart/sign-part/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    
    const { uploadId, key, partNumber } = await request.json();
    
    // Generate signed URL for this specific part
    const command = new UploadPartCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });
    
    return NextResponse.json({
      url: presignedUrl,
    });
    
  } catch (error) {
    console.error("Error signing upload part:", error);
    return NextResponse.json({ error: "Failed to sign upload part" }, { status: 500 });
  }
}


