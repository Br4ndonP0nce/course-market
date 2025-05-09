// app/api/debug/session-status/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get auth data
    const { userId, sessionClaims } = await auth();
    
    // If not logged in
    if (!userId) {
      return NextResponse.json({
        loggedIn: false,
        message: "Not logged in"
      });
    }
    
    // Get current user from Clerk
    const user = await currentUser();
    
    // Get user from database
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: userId }
      });
    } catch (error) {
      console.error("Error fetching user from database:", error);
    }
    
    // Return detailed session information
    return NextResponse.json({
      loggedIn: true,
      userId,
      sessionClaims: {
        available: !!sessionClaims,
        metadata: sessionClaims?.metadata || null
      },
      clerkUserData: {
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        emailAddress: user?.emailAddresses[0]?.emailAddress,
        publicMetadata: user?.publicMetadata,
        privateMetadata: user?.privateMetadata,
        unsafeMetadata: user?.unsafeMetadata
      },
      databaseUser: dbUser
    });
  } catch (error) {
    console.error("Error in session status endpoint:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}