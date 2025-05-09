// app/api/admin/set-role/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This is a protected endpoint for assigning roles
// Only the super admin should be able to access this
const ADMIN_USER_IDS = ['user_2U1dyp45DYLMMeGcpIxdZA8cHnz']; // Replace with your admin Clerk ID

export async function POST(req: Request) {
  // Check if the current user is an admin
  const { userId } = await auth();
  
  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  try {
    const { targetUserId, role } = await req.json();
    
    if (!targetUserId || !role || !['CREATOR', 'STUDENT', 'ADMIN'].includes(role)) {
      return new NextResponse("Invalid input data", { status: 400 });
    }
    
    // Look up the user in the database
    const user = await prisma.user.findFirst({
      where: { clerkId: targetUserId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role }
    });
    
    return NextResponse.json({
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}