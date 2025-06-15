// src/app/(dashboard)/creator/products/page.tsx
import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { RealProductsTable } from "@/components/dashboard/productsTable";
import { ProductsFilter } from "@/components/dashboard/productsFilter";

// Define the Product type with stats
interface ProductStats {
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  studentCount: number;
}

interface ProductWithStats {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // Keep as number since we'll convert it
  published: boolean;
  featuredImage: string | null;
  categories: string | null;
  createdAt: Date;
  updatedAt: Date;
  stats: ProductStats;
}

async function getUserProducts(userId: string): Promise<ProductWithStats[]> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const products = await prisma.product.findMany({
    where: { creatorId: dbUser.id },
    include: {
      _count: {
        select: {
          purchases: true,
          modules: true,
        },
      },
      modules: {
        include: {
          _count: {
            select: {
              lessons: true,
            },
          },
          lessons: {
            select: {
              uploadStatus: true,
              duration: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats for each product and return properly typed array
  return products.map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price.toNumber(),
    published: product.published,
    featuredImage: product.featuredImage,
    categories: product.categories,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    stats: {
      totalModules: product._count.modules,
      totalLessons: product.modules.reduce(
        (sum, module) => sum + module._count.lessons,
        0
      ),
      completedLessons: product.modules.reduce(
        (sum, module) =>
          sum +
          module.lessons.filter((lesson) => lesson.uploadStatus === "completed")
            .length,
        0
      ),
      totalDuration: product.modules.reduce(
        (sum, module) =>
          sum +
          module.lessons.reduce(
            (lessonSum, lesson) => lessonSum + (lesson.duration || 0),
            0
          ),
        0
      ),
      studentCount: product._count.purchases,
    },
  }));
}

export default async function CreatorProductsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let products: ProductWithStats[];
  try {
    products = await getUserProducts(userId);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    products = [];
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Products"
          text="Manage your digital products"
        />

        <Link href="/creator/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {products.length}
            </div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.published).length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {products.reduce((sum, p) => sum + p.stats.studentCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                products.reduce((sum, p) => sum + p.stats.totalDuration, 0) / 60
              )}{" "}
              hrs
            </div>
            <div className="text-sm text-gray-600">Content Hours</div>
          </div>
        </div>
      )}

      <ProductsFilter />
      <RealProductsTable products={products} />
    </div>
  );
}
