// src/app/api/purchases/[purchaseId]/complete/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/purchases/[purchaseId]/complete - Complete purchase and enroll student
export async function POST(
  request: Request,
  { params }: { params: { purchaseId: string } }
) {
  try {
    const { userId } = await auth();
    const { purchaseId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    });
    
    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }
    
    if (purchase.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "You can only complete your own purchases" },
        { status: 403 }
      );
    }
    
    if (purchase.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Purchase already completed" },
        { status: 400 }
      );
    }
    
    // Start transaction to complete purchase and create progress records
    await prisma.$transaction(async (tx) => {
      // Update purchase status
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { 
          paymentStatus: "COMPLETED",
          stripePaymentId: `sim_${Date.now()}` // Simulated payment ID
        }
      });
      
      // Create progress records for all lessons
      const progressRecords = [];
      for (const module of purchase.product.modules) {
        for (const lesson of module.lessons) {
          progressRecords.push({
            purchaseId: purchase.id,
            lessonId: lesson.id,
            completed: false
          });
        }
      }
      
      if (progressRecords.length > 0) {
        await tx.progress.createMany({
          data: progressRecords
        });
      }
    });
    
    // Get updated purchase with progress
    const completedPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        },
        progress: true
      }
    });
    
    return NextResponse.json({ 
      purchase: completedPurchase,
      message: "Purchase completed and enrollment successful"
    });
    
  } catch (error) {
    console.error("Error completing purchase:", error);
    return NextResponse.json(
      { error: "Failed to complete purchase" },
      { status: 500 }
    );
  }
}