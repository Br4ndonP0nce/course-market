// app/api/auth/refresh/route.ts - Updated to use unsafeMetadata consistently
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Initialize the Clerk client
    const client = await clerkClient();
    
    // Get current user from Clerk
    let user = await client.users.getUser(userId);
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Check if force refresh is requested
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    console.log("Refreshing session for user:", userId);
    console.log("Current unsafeMetadata:", user.unsafeMetadata);
    
    // Get latest user data from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return new NextResponse("User not found in database", { status: 404 });
    }
    
    // Force update Clerk metadata with database role if requested or if different
    if (forceRefresh || 
        (dbUser.role && (!user.unsafeMetadata?.role || user.unsafeMetadata.role !== dbUser.role))) {
      console.log(`Forcing update of user metadata from database. DB role: ${dbUser.role}`);
      
      try {
        await client.users.updateUser(userId, {
          unsafeMetadata: {
            role: dbUser.role,
            lastUpdated: new Date().toISOString() // Add timestamp to force refresh
          },
        });
        
        console.log("Updated Clerk metadata with role from database");
        
        // Fetch the user again to get updated metadata
        user = await client.users.getUser(userId);
        console.log("Updated unsafeMetadata:", user.unsafeMetadata);
      } catch (error) {
        console.error("Error updating Clerk metadata:", error);
      }
    }
    
    // Check if a redirect is requested
    const redirectPath = url.searchParams.get('redirect');
    
    if (redirectPath) {
      // Determine where to redirect based on role
      if (redirectPath === '/dashboard') {
        // If redirect is to dashboard, route based on role
        const role = dbUser.role || user.unsafeMetadata?.role;
        
        console.log(`Redirecting based on role: ${role}`);
        
        if (role === 'CREATOR') {
          return NextResponse.redirect(new URL('/creator/dashboard', url.origin));
        } else if (role === 'STUDENT') {
          return NextResponse.redirect(new URL('/student/dashboard', url.origin));
        } else {
          return NextResponse.redirect(new URL('/onboarding', url.origin));
        }
      } else {
        // For any other redirect, just go there
        return NextResponse.redirect(new URL(redirectPath, url.origin));
      }
    }
    
    // If no redirect, just return success
    return NextResponse.json({
      success: true,
      message: "Session refreshed",
      userData: {
        id: user.id,
        unsafeMetadata: user.unsafeMetadata,
        databaseRole: dbUser.role
      }
    });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}