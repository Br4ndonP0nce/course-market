// app/api/auth/sync-role/route.ts - Updated to use unsafeMetadata consistently
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Initialize the Clerk client
    const client = await clerkClient();
    
    // Parse request body
    const { role } = await req.json();
    
    if (!role || !["CREATOR", "STUDENT", "ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }
    
    console.log(`Updating role for user ${userId} to ${role}`);
    
    // Update Clerk metadata - ONLY use unsafeMetadata for consistency
    await client.users.updateUser(userId, {
      unsafeMetadata: {
        role: role,
        lastUpdated: new Date().toISOString()
      },
    });
    
    // Verify the update was successful
    const updatedUser = await client.users.getUser(userId);
    console.log("Updated user metadata:", updatedUser.unsafeMetadata);
    
    return NextResponse.json({
      success: true,
      message: "User role synchronized",
      metadata: updatedUser.unsafeMetadata
    });
  } catch (error) {
    console.error("Role sync error:", error);
    return new NextResponse(
      `Internal error: ${error instanceof Error ? error.message : String(error)}`, 
      { status: 500 }
    );
  }
}