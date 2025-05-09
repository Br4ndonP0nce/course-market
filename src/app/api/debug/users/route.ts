// app/api/debug/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Attempt to get all users
    const users = await prisma.user.findMany();
    
    return NextResponse.json({
      userCount: users.length,
      users: users.map(user => ({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (error: any) {
    console.error("Database query error:", error);
    
    return NextResponse.json({
      error: error.message,
      code: error.code,
      stack: error.stack,
    }, { status: 500 });
  }
}