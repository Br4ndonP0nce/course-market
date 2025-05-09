// app/api/webhook/clerk/route.ts
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import { storeWebhookData } from "../../debug/webhook/route";

export async function POST(req: Request) {
  let originalBody;
  try {
    // Clone the request to get the original body for debugging
    const clonedReq = req.clone();
    originalBody = await clonedReq.json();
  } catch (error) {
    console.error("Error cloning request:", error);
  }

  try {
    // Get the webhook secret from environment variables
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      const error = "Missing CLERK_WEBHOOK_SECRET env var";
      console.error(error);
      storeWebhookData(originalBody, error);
      return new NextResponse("Webhook secret not provided", { status: 500 });
    }

    // Get the headers
    const headersList = await headers();
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      const error = "Missing svix headers";
      console.error(error, { svix_id, svix_timestamp, svix_signature });
      storeWebhookData(originalBody, error);
      return new NextResponse("Missing webhook headers", { status: 400 });
    }

    console.log("Headers received:", { svix_id, svix_timestamp, svix_signature });
    
    // Get the body
    const payload = originalBody || await req.json();
    const body = JSON.stringify(payload);

    console.log("Webhook payload received:", payload);
    
    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);
    
    let event: WebhookEvent;
    
    // Verify the webhook
    try {
      event = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
      console.log("Webhook verified successfully");
    } catch (err) {
      const error = `Error verifying webhook: ${err instanceof Error ? err.message : String(err)}`;
      console.error(error);
      storeWebhookData(payload, error);
      return new NextResponse("Error verifying webhook", { status: 400 });
    }

    // Handle the webhook event based on the type
    const eventType = event.type;
    console.log(`Processing event type: ${eventType}`);
    
    if (eventType === "user.created") {
      // When a new user is created, automatically set them as a student
      const { id, email_addresses, first_name, last_name } = event.data;
      
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';
      
      console.log("Creating new user:", { id, email, name });

      try {
        // Create the user in the database with STUDENT role
        const newUser = await prisma.user.create({
          data: { 
            clerkId: id, 
            email, 
            name,
            role: "STUDENT", // Default role for all new users
          },
        });
        
        console.log(`New user created with ID: ${newUser.id}`);
        storeWebhookData({ eventType, id, email, result: "success" });
        
        return NextResponse.json({
          message: "User created successfully",
          user: {
            id: newUser.id,
            role: newUser.role
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating user:", errorMessage);
        
        // Check if it's a database connection error
        if (errorMessage.includes("connect") || errorMessage.includes("connection")) {
          console.error("Database connection issue. Check your DATABASE_URL");
        }
        
        // Check if it's a unique constraint error
        if (errorMessage.includes("Unique constraint failed")) {
          console.error("User may already exist in the database");
          
          // Try to retrieve the existing user
          try {
            const existingUser = await prisma.user.findUnique({
              where: { clerkId: id }
            });
            console.log("Found existing user:", existingUser);
          } catch (subError) {
            console.error("Error finding existing user:", subError);
          }
        }
        
        storeWebhookData({ eventType, id, email }, errorMessage);
        return new NextResponse(`Error creating user: ${errorMessage}`, { status: 500 });
      }
    }
    
    // Handle other event types similarly...
    
    // For any other event types
    storeWebhookData({ eventType, data: event.data }, null);
    return new NextResponse("Webhook received", { status: 200 });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unhandled webhook error:", errorMessage);
    storeWebhookData(originalBody, errorMessage);
    return new NextResponse(`Internal server error: ${errorMessage}`, { status: 500 });
  }
}