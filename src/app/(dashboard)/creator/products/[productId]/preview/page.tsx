// src/app/(dashboard)/creator/products/[productId]/preview/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CoursePreview from "@/components/course/coursePreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProductPreviewPageProps {
  params: { productId: string };
}

// Type for the product with modules and lessons (matching your Prisma schema)
type ProductWithModules = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: any; // Decimal from Prisma
  published: boolean;
  featuredImage: string | null;
  categories: string | null;
  language: string | null;
  primaryCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    productId: string;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      contentType: string;
      position: number;
      isPreview: boolean;
      duration: number | null;
      uploadStatus: string | null;
      processingProgress: number | null;
      videoQualities: any;
      thumbnailUrl: string | null;
      contentUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      moduleId: string;
      processedAt: Date | null;
      processingError: string | null;
      processingJobId: string | null;
      rawVideoUrl: string | null;
      uploadedAt: Date | null;
    }>;
  }>;
  creator: {
    id: string;
    name: string;
  };
};

async function getProductWithModulesForPreview(
  productId: string,
  userId: string
): Promise<ProductWithModules> {
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
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      modules: {
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return product as ProductWithModules;
}

export default async function ProductPreviewPage({
  params,
}: ProductPreviewPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let product: ProductWithModules;

  try {
    product = await getProductWithModulesForPreview(params.productId, userId);
  } catch (error) {
    console.error("Error fetching product for preview:", error);
    redirect("/creator/products");
  }

  // Transform price from Decimal to number for the frontend
  const transformedProduct = {
    ...product,
    price: product.price.toNumber(),
  };

  // Check if product has any content
  const hasContent =
    product.modules.length > 0 &&
    product.modules.some((module) => module.lessons.length > 0);

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

  const processingLessons = product.modules.reduce(
    (sum, module) =>
      sum +
      module.lessons.filter((lesson) => lesson.uploadStatus === "processing")
        .length,
    0
  );

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/creator/products/${params.productId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Product
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.title} - Preview
                </h1>
                <p className="text-gray-600">Creator preview mode</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Content to Preview
            </h2>
            <p className="text-gray-600 mb-6">
              This course doesn't have any modules or lessons yet. Add some
              content to see how it will look to your students.
            </p>
            <div className="space-y-3">
              <Link href={`/creator/products/${params.productId}/content`}>
                <Button className="w-full">Add Course Content</Button>
              </Link>
              <Link href={`/creator/products/${params.productId}`}>
                <Button variant="outline" className="w-full">
                  Back to Product Overview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with course info */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href={`/creator/products/${params.productId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Product
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.title}
                </h1>
                <p className="text-gray-600">Creator preview mode</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href={`/creator/products/${params.productId}/content`}>
                <Button variant="outline" size="sm">
                  Edit Content
                </Button>
              </Link>

              {product.published && (
                <Link href={`/product/${product.slug}`} target="_blank">
                  <Button size="sm">View Live Course</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Content status summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {product.modules.length}
              </div>
              <div className="text-sm text-gray-600">Modules</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {totalLessons}
              </div>
              <div className="text-sm text-gray-600">Total Lessons</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-600">
                {completedLessons}
              </div>
              <div className="text-sm text-gray-600">Ready Lessons</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-orange-600">
                {processingLessons}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
          </div>

          {/* Warning if no ready lessons */}
          {completedLessons === 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    No Ready Lessons
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    All lessons are still processing or haven't been uploaded
                    yet. Students won't be able to access any content until
                    videos are processed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course preview */}
      <CoursePreview
        course={transformedProduct}
        mode="creator"
        userHasAccess={true}
      />
    </div>
  );
}
