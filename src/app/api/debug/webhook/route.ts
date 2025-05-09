// app/api/debug/webhook/route.ts
import { NextResponse } from "next/server";

// This endpoint will store the last webhook payload for debugging
let lastWebhookPayload: any = null;
let lastWebhookError: any = null;

// Export a function to store webhook data for debugging
export function storeWebhookData(payload: any, error: any = null) {
  lastWebhookPayload = payload;
  lastWebhookError = error;
}

export async function GET() {
  return NextResponse.json({
    lastPayload: lastWebhookPayload,
    lastError: lastWebhookError,
    receivedAt: lastWebhookPayload ? new Date().toISOString() : null,
  });
}