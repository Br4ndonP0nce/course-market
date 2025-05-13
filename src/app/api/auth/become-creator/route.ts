// app/api/auth/become-creator/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    const { bio, website } = await req.json();
    
    // Validate bio
    if (!bio || bio.length < 10) {
      return new NextResponse("Bio must be at least 10 characters", { status: 400 });
    }
    
    // Update user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return new NextResponse("User not found in database", { status: 404 });
    }
    
    // Update user role to CREATOR
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { 
        role: "CREATOR",
        // You might want to add these fields to your User model
        // bio: bio,
        // website: website || null,
      }
    });
    
    // Update Clerk metadata with role
    await client.users.updateUser(userId, {
      unsafeMetadata: {
        role: "CREATOR",
      },
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: "User role updated to CREATOR",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse(
      `Internal error: ${error instanceof Error ? error.message : String(error)}`, 
      { status: 500 }
    );
  }
}