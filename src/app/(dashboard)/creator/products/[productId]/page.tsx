// src/app/(dashboard)/creator/products/[productId]/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Settings,
  Eye,
  Globe,
  Users,
  PlayCircle,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface ProductOverviewPageProps {
  params: { productId: string };
}

async function getProductDetails(productId: string, userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      creatorId: dbUser.id,
    },
    include: {
      modules: {
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              uploadStatus: true,
              duration: true,
              contentType: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return product;
}

export default async function ProductOverviewPage({
  params,
}: ProductOverviewPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let product;
  try {
    product = await getProductDetails(params.productId, userId);
  } catch (error) {
    redirect("/creator/products");
  }

  // Calculate stats
  const totalLessons = product.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );
  const completedLessons = product.modules.reduce(
    (sum, module) =>
      sum +
      module.lessons.filter((lesson) => lesson.uploadStatus === "completed")
        .length,
    0
  );
  const totalDuration = product.modules.reduce(
    (sum, module) =>
      sum +
      module.lessons.reduce(
        (lessonSum, lesson) => lessonSum + (lesson.duration || 0),
        0
      ),
    0
  );

  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/creator/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>

          <div>
            <DashboardHeader
              heading={product.title}
              text="Product overview and management"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={`/creator/products/${params.productId}/content`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Content
            </Button>
          </Link>

          {product.published ? (
            <Link href={`/product/${product.slug}`} target="_blank">
              <Button>
                <Globe className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </Link>
          ) : (
            <Button disabled={completionPercentage < 100}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-6">
          {/* Featured Image */}
          <div className="flex-shrink-0">
            {product.featuredImage ? (
              <img
                src={product.featuredImage}
                alt={product.title}
                className="w-32 h-24 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-32 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {product.title}
              </h1>
              <Badge variant={product.published ? "default" : "outline"}>
                {product.published ? "Published" : "Draft"}
              </Badge>
            </div>

            <p className="text-gray-600 mb-4">{product.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(product.price.toNumber())}
                </div>
                <div className="text-sm text-gray-600">Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {product._count.purchases}
                </div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalLessons}
                </div>
                <div className="text-sm text-gray-600">Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(totalDuration)}
                </div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Content Progress</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Course Completion
            </span>
            <span className="text-sm text-gray-600">
              {completionPercentage}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {product.modules.length}
              </div>
              <div className="text-gray-600">Modules</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {completedLessons}/{totalLessons}
              </div>
              <div className="text-gray-600">Lessons Ready</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {formatDuration(totalDuration)}
              </div>
              <div className="text-gray-600">Total Content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href={`/creator/products/${params.productId}/content`}>
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer">
            <Settings className="h-8 w-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Manage Content</h4>
            <p className="text-sm text-gray-600">
              Add modules, lessons, and upload videos
            </p>
          </div>
        </Link>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
          <p className="text-sm text-gray-600">
            View student engagement and progress
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <Users className="h-8 w-8 text-purple-600 mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Students</h4>
          <p className="text-sm text-gray-600">
            Manage enrolled students and feedback
          </p>
        </div>
      </div>
    </div>
  );
}
