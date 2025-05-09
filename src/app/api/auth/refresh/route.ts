// app/api/auth/refresh/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    console.log("Refreshing session for user:", userId);
    console.log("Current unsafeMetadata:", user.unsafeMetadata);
    
    // If user has no role metadata in Clerk but has one in the database,
    // update Clerk's metadata with the role from the database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (dbUser && dbUser.role && (!user.unsafeMetadata || !user.unsafeMetadata.role)) {
      console.log(`User has role in database: ${dbUser.role}, but not in Clerk metadata. Updating Clerk...`);
      
      try {
        // Update Clerk metadata with role from database
        await user.update({
          unsafeMetadata: {
            role: dbUser.role,
          },
        });
        
        console.log("Updated Clerk metadata with role from database");
      } catch (error) {
        console.error("Error updating Clerk metadata:", error);
      }
    }
    
    // Check if a redirect is requested
    const url = new URL(req.url);
    const redirectPath = url.searchParams.get('redirect');
    
    if (redirectPath) {
      // Determine where to redirect based on role
      if (redirectPath === '/dashboard') {
        // If redirect is to dashboard, route based on role
        const role = dbUser?.role || user.unsafeMetadata?.role;
        
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
        databaseRole: dbUser?.role || null
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