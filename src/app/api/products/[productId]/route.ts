// src/app/api/products/[productId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateProductSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.array(z.string()).optional(),
  language: z.string().optional(),
  primaryCountry: z.string().optional(),
  featuredImage: z.string().optional(),
  published: z.boolean().optional(),
});

// GET /api/products/[productId] - Get single product
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            purchases: true
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[productId] - Update product
export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await auth();
    const { productId } = params;
    
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
    
    // Check if product exists and user owns it
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    if (existingProduct.creatorId !== dbUser.id && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only update your own products" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);
    
    // Update slug if title changed
    let slug = existingProduct.slug;
    if (validatedData.title && validatedData.title !== existingProduct.title) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const existingSlug = await prisma.product.findFirst({
        where: { 
          slug,
          id: { not: productId }
        }
      });
      
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }
    
    // Prepare update data
    const updateData: any = {
      ...validatedData,
      slug
    };
    
    if (validatedData.category) {
      updateData.categories = validatedData.category.join(',');
      delete updateData.category;
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedProduct);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[productId] - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await auth();
    const { productId } = params;
    
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
    
    // Check if product exists and user owns it
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            purchases: true
          }
        }
      }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    if (existingProduct.creatorId !== dbUser.id && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only delete your own products" },
        { status: 403 }
      );
    }
    
    // Check if product has purchases (prevent deletion)
    if (existingProduct._count.purchases > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with existing purchases" },
        { status: 400 }
      );
    }
    
    await prisma.product.delete({
      where: { id: productId }
    });
    
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}