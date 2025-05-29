// src/app/api/products/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating/updating products
const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  category: z.array(z.string()).min(1, "At least one category required"),
  language: z.string().min(1, "Language is required"),
  primaryCountry: z.string().min(1, "Primary country is required"),
  featuredImage: z.string().optional(),
  published: z.boolean().default(false),
});

// GET /api/products - List products with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const creatorOnly = searchParams.get("creatorOnly") === "true";
    const published = searchParams.get("published");
    
    const { userId } = await auth();
    
    // Build where clause
    const where: any = {};
    
    if (creatorOnly && userId) {
      // Get user from database to find creator products
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId }
      });
      
      if (dbUser) {
        where.creatorId = dbUser.id;
      }
    }
    
    if (category) {
      where.categories = {
        contains: category
      };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (published !== null) {
      where.published = published === "true";
    }
    
    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              purchases: true,
              modules: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: Request) {
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
    
    // Check if user is a creator
    if (dbUser.role !== "CREATOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only creators can create products" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = productSchema.parse(body);
    
    // Create slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });
    
    const finalSlug = existingProduct 
      ? `${slug}-${Date.now()}` 
      : slug;
    
    // Create product
    const product = await prisma.product.create({
      data: {
        title: validatedData.title,
        slug: finalSlug,
        description: validatedData.description,
        price: validatedData.price,
        featuredImage: validatedData.featuredImage,
        published: validatedData.published,
        categories: validatedData.category.join(','), // Store as comma-separated string
        language: validatedData.language,
        primaryCountry: validatedData.primaryCountry,
        creatorId: dbUser.id,
      },
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
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

