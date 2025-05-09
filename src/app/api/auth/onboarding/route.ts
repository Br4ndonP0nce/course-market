// app/api/auth/onboarding/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    console.log("Onboarding API called");
    
    // Check authentication
    const { userId } = await auth();
    console.log("Auth userId:", userId);
    
    if (!userId) {
      console.error("No userId found in auth");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get current user details
    const user = await currentUser();
    console.log("Current user fetched:", user ? "success" : "null");
    
    if (!user) {
      console.error("Failed to get current user");
      return new NextResponse("User data not available", { status: 400 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", body);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new NextResponse("Invalid request body", { status: 400 });
    }
    
    const { role } = body;

    // Validate role
    if (!role || !["CREATOR", "STUDENT"].includes(role)) {
      console.error("Invalid role provided:", role);
      return new NextResponse("Invalid role", { status: 400 });
    }

    console.log(`Syncing user ${userId} with role ${role}`);
    
    // Get user email safely
    let email = null;
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      email = user.emailAddresses[0].emailAddress;
    }
    
    if (!email) {
      console.error("No email found for user");
      return new NextResponse("User has no email", { status: 400 });
    }

    // Prepare user name
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    
    console.log("About to upsert user with data:", {
      clerkId: userId,
      email,
      name,
      role
    });

    // Create or update user in database
    try {
      const dbUser = await prisma.user.upsert({
        where: {
          clerkId: userId,
        },
        update: {
          role: role,
        },
        create: {
          clerkId: userId,
          email,
          name,
          role,
        },
      });

      console.log("User saved to database successfully:", dbUser.id);
      return NextResponse.json(dbUser);
    } catch (dbError: any) {
      console.error("Database error during user upsert:", dbError);
      console.error("Error details:", dbError.message);
      
      // Check if it's a Prisma error with more details
      if (dbError.code) {
        console.error("Prisma error code:", dbError.code);
      }
      
      if (dbError.meta) {
        console.error("Prisma error metadata:", dbError.meta);
      }
      
      return new NextResponse(`Database error: ${dbError.message}`, { status: 500 });
    }
  } catch (error: any) {
    console.error("[ONBOARDING_ERROR]", error);
    console.error("Error stack:", error.stack);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}