// app/api/debug/auth-data/route.ts
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authData = await auth();
    const client = await clerkClient();
    const user = await currentUser();
    
    // Get the user directly using the Backend API
    let clerkUserData = null;
    if (authData.userId) {
      clerkUserData = await client.users.getUser(authData.userId);
    }
    
    // Return all available data for debugging
    return NextResponse.json({
      auth: {
        userId: authData.userId,
        sessionId: authData.sessionId,
        sessionClaims: authData.sessionClaims,
      },
      currentUser: user ? {
        id: user.id,
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        unsafeMetadata: user.unsafeMetadata,
      } : null,
      clerkUserData: clerkUserData ? {
        id: clerkUserData.id,
        publicMetadata: clerkUserData.publicMetadata,
        privateMetadata: clerkUserData.privateMetadata,
        unsafeMetadata: clerkUserData.unsafeMetadata,
      } : null,
    });
  } catch (error) {
    console.error("Auth data debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}