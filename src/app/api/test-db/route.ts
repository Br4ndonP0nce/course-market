// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Attempt a simple query to check connection
    const userCount = await prisma.user.count();
    
    // Try to retrieve all users to check if the table exists
    const users = await prisma.user.findMany({
      take: 5, // Limit to first 5 users for safety
    });

    return NextResponse.json({
      success: true,
      connectionOk: true,
      userCount,
      sampleUsers: users
    });
  } catch (error: any) {
    console.error("Database connection test failed:", error);
    
    return NextResponse.json({
      success: false,
      connectionOk: false,
      error: error.message,
      hint: "Check your DATABASE_URL and make sure Prisma has been set up correctly."
    }, { status: 500 });
  }
}