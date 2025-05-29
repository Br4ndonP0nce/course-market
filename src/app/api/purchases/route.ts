// src/app/api/purchases/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const purchaseSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  paymentMethodId: z.string().optional(), // For Stripe payment method
});

// GET /api/purchases - Get user's purchases
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
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
    
    const purchases = await prisma.purchase.findMany({
      where: { userId: dbUser.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            featuredImage: true,
            creator: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ purchases });
    
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);
    
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
    
    // Get product
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    if (!product.published) {
      return NextResponse.json(
        { error: "Product is not available for purchase" },
        { status: 400 }
      );
    }
    
    // Check if user already owns this product
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: dbUser.id,
        productId: product.id,
        paymentStatus: "COMPLETED"
      }
    });
    
    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already own this product" },
        { status: 400 }
      );
    }
    
    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: dbUser.id,
        productId: product.id,
        amount: product.price,
        paymentStatus: "PENDING"
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true
          }
        }
      }
    });
    
    // TODO: Initialize Stripe payment intent here
    // For now, we'll simulate successful payment
    
    return NextResponse.json({ purchase }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}



