// app/api/auth/sync-role/route.ts
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
    
    // Update Clerk metadata with properly initialized client
    await client.users.updateUser(userId, {
      privateMetadata: {
        role,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "User role synchronized",
    });
  } catch (error) {
    console.error("Role sync error:", error);
    return new NextResponse(
      `Internal error: ${error instanceof Error ? error.message : String(error)}`, 
      { status: 500 }
    );
  }
}