// app/api/debug/session/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get auth data
    const { userId, sessionClaims } = await auth();
    
    // Get current user
    const user = await currentUser();
    
    // Return all available data for debugging
    return NextResponse.json({
      auth: {
        userId,
        sessionClaimsAvailable: !!sessionClaims,
        sessionMetadata: sessionClaims?.metadata || null,
      },
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddresses: user.emailAddresses.map(email => email.emailAddress),
        unsafeMetadata: user.unsafeMetadata || null,
        publicMetadata: user.publicMetadata || null,
      } : null,
    });
  } catch (error: any) {
    console.error("Session debug error:", error);
    
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}