// src/app/api/s3-upload/multipart/list-parts/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { S3Client, ListPartsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const key = searchParams.get('key');
    
    if (!uploadId || !key) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // List existing parts for resume capability
    const listCommand = new ListPartsCommand({
      Bucket: process.env.AWS_S3_RAW_UPLOADS_BUCKET!,
      Key: key,
      UploadId: uploadId,
    });
    
    const response = await s3Client.send(listCommand);
    
    const parts = (response.Parts || []).map(part => ({
      number: part.PartNumber,
      etag: part.ETag,
      size: part.Size,
    }));
    
    return NextResponse.json({ parts });
    
  } catch (error) {
    console.error("Error listing parts:", error);
    return NextResponse.json({ error: "Failed to list parts" }, { status: 500 });
  }
}

