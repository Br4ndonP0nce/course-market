// app/api/debug/create-test-user/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { clerkId, email, name, role } = await req.json();
    
    if (!clerkId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: clerkId and email are required" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    
    if (existingUser) {
      return NextResponse.json({
        message: "User already exists",
        user: existingUser
      });
    }
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: name || 'Test User',
        role: role || 'STUDENT'
      }
    });
    
    return NextResponse.json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { error: `Failed to create user: ${errorMessage}` },
      { status: 500 }
    );
  }
}