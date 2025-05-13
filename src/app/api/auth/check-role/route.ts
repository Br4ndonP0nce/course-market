// app/api/auth/check-role/route.ts - Modified version
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    // Get URL to redirect to after check
    const url = new URL(req.url);
    const redirectPath = url.searchParams.get('redirect') || '/dashboard';
    const origin = url.origin;
    
    // Initialize Clerk client
    const client = await clerkClient();
    
    // Get user from Clerk
    const clerkUser = await client.users.getUser(userId);
    console.log(`Checking role for user ${userId}`);
    console.log("Clerk unsafeMetadata:", clerkUser.unsafeMetadata);
    
    // Get role from Clerk unsafeMetadata
    let role = clerkUser.unsafeMetadata?.role as string | undefined;
    
    // If no role in Clerk, check database
    if (!role) {
      console.log("No role in Clerk, checking database");
      const dbUser = await prisma.user.findFirst({
        where: { clerkId: userId }
      });
      
      if (dbUser?.role) {
        role = dbUser.role;
        console.log(`Role found in database: ${role}`);
        
        // Update Clerk with the database role
        await client.users.updateUser(userId, {
          unsafeMetadata: {
            role: dbUser.role,
            lastUpdated: new Date().toISOString()
          },
        });
        
        console.log("Updated Clerk with database role");
      }
    }
    
    console.log(`Final role determination: ${role || "none"}`);
    
    // Create the destination URL with nocheck parameter
    const createDestinationUrl = (path: string) => {
      const destUrl = new URL(path, origin);
      // Add a nocheck parameter to prevent middleware from redirecting again
      destUrl.searchParams.set('nocheck', 'true');
      return destUrl;
    };
    
    // Handle redirects based on role and destination
    if (redirectPath === '/dashboard') {
      // Redirect to role-specific dashboard
      if (role === 'CREATOR') {
        return NextResponse.redirect(createDestinationUrl('/creator/dashboard'));
      } else if (role === 'STUDENT') {
        return NextResponse.redirect(createDestinationUrl('/student/dashboard'));
      } else {
        // No role yet, send to onboarding
        return NextResponse.redirect(createDestinationUrl('/onboarding'));
      }
    } else if (redirectPath.startsWith('/creator') && role !== 'CREATOR') {
      // If trying to access creator routes but not a creator
      console.log(`User with role ${role} trying to access creator route`);
      return NextResponse.redirect(createDestinationUrl('/student/dashboard'));
    } else {
      // For any other redirects, just go there if allowed by role
      return NextResponse.redirect(createDestinationUrl(redirectPath));
    }
  } catch (error) {
    console.error("Role check error:", error);
    // On error, redirect to a safe page
    return NextResponse.redirect(new URL('/?error=role-check-failed', new URL(req.url).origin));
  }
}