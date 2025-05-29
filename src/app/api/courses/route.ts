// src/app/api/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/courses - Public marketplace
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const priceRange = searchParams.get("priceRange"); // "0-50" or "50-100"
    
    // Build where clause for public courses only
    const where: any = {
      published: true // Only show published courses
    };
    
    if (category) {
      where.categories = {
        contains: category,
        mode: 'insensitive'
      };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      where.price = {
        gte: min,
        lte: max || 999999
      };
    }
    
    // Get courses with pagination
    const [courses, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          price: true,
          featuredImage: true,
          categories: true,
          language: true,
          createdAt: true,
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              purchases: true,
              modules: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    // Transform categories from string to array
    const transformedCourses = courses.map(course => ({
      ...course,
      categories: course.categories ? course.categories.split(',') : [],
      studentCount: course._count.purchases,
      moduleCount: course._count.modules
    }));
    
    return NextResponse.json({
      courses: transformedCourses,
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
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

