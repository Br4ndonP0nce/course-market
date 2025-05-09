// app/api/debug/db-test/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Try to connect to the database
    await prisma.$connect();
    console.log("Database connection successful");
    
    // Check if the User table exists by querying it
    let tableExists = true;
    try {
      const userCount = await prisma.user.count();
      console.log(`User table exists with ${userCount} records`);
    } catch (error) {
      tableExists = false;
      console.error("Error querying User table:", error);
    }

    // Perform a simple write test if the table exists
    let writeTest = null;
    if (tableExists) {
      try {
        // Create a test user
        const testUser = await prisma.user.create({
          data: {
            clerkId: `test_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            name: "Test User",
            role: "STUDENT",
          },
        });
        
        console.log("Write test successful:", testUser);
        
        // Clean up by deleting the test user
        await prisma.user.delete({
          where: { id: testUser.id },
        });
        
        writeTest = "success";
      } catch (error) {
        writeTest = `failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error("Write test failed:", error);
      }
    }

    return NextResponse.json({
      status: "success",
      connection: "ok",
      tableExists,
      writeTest,
      databaseUrl: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.split("@")[0].split("://")[0]}://*****@${process.env.DATABASE_URL.split("@")[1]}` : 
        "not available",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Database connection failed:", errorMessage);
    
    return NextResponse.json({
      status: "error",
      connection: "failed",
      error: errorMessage,
      databaseUrl: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.split("@")[0].split("://")[0]}://*****@${process.env.DATABASE_URL.split("@")[1]}` : 
        "not available",
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}