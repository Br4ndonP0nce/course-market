// src/app/(dashboard)/creator/products/[productId]/content/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import CourseContentBuilder from "@/components/course/courseContentBuilder";
import { ArrowLeft, Save, Eye, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductContentPageProps {
  params: { productId: string };
}

// Type for the product with modules and lessons
type ProductWithModules = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  featuredImage: string | null;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
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
};

async function getProductWithModules(
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

export default async function ProductContentPage({
  params,
}: ProductContentPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let product;
  try {
    product = await getProductWithModules(params.productId, userId);
  } catch (error) {
    redirect("/creator/products");
  }

  // Calculate content statistics
  const totalModules = product.modules.length;
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/creator/products/${params.productId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Button>
          </Link>

          <div>
            <DashboardHeader
              heading={`${product.title} - Content`}
              text="Manage your course modules and lessons"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Content Stats */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Badge variant="outline">{totalModules} modules</Badge>
            <Badge variant="outline">{totalLessons} lessons</Badge>
            {processingLessons > 0 && (
              <Badge variant="secondary">{processingLessons} processing</Badge>
            )}
            <Badge
              variant={
                completedLessons === totalLessons && totalLessons > 0
                  ? "default"
                  : "outline"
              }
            >
              {completedLessons}/{totalLessons} complete
            </Badge>
          </div>

          {/* Action Buttons */}
          <Link href={`/creator/products/${params.productId}/preview`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>

          {product.published && (
            <Link href={`/product/${product.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      {totalLessons > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-blue-900">Course Completion</h3>
            <span className="text-sm text-blue-700">
              {Math.round((completedLessons / totalLessons) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-blue-700">
            <span>{completedLessons} lessons ready</span>
            {processingLessons > 0 && (
              <span>{processingLessons} still processing</span>
            )}
          </div>
        </div>
      )}

      {/* Content Builder */}
      <CourseContentBuilder
        productId={params.productId}
        initialModules={product.modules}
      />

      {/* Publishing Checklist */}
      {totalLessons > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Publishing Checklist
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  totalModules > 0 ? "bg-green-500 text-white" : "bg-gray-300"
                }`}
              >
                {totalModules > 0 ? "✓" : "○"}
              </div>
              <span
                className={
                  totalModules > 0 ? "text-green-700" : "text-gray-600"
                }
              >
                Create at least one module ({totalModules} created)
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  totalLessons >= 3 ? "bg-green-500 text-white" : "bg-gray-300"
                }`}
              >
                {totalLessons >= 3 ? "✓" : "○"}
              </div>
              <span
                className={
                  totalLessons >= 3 ? "text-green-700" : "text-gray-600"
                }
              >
                Add at least 3 lessons ({totalLessons} created)
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  completedLessons === totalLessons && totalLessons > 0
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                {completedLessons === totalLessons && totalLessons > 0
                  ? "✓"
                  : "○"}
              </div>
              <span
                className={
                  completedLessons === totalLessons && totalLessons > 0
                    ? "text-green-700"
                    : "text-gray-600"
                }
              >
                All videos processed and ready ({completedLessons}/
                {totalLessons})
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  product.featuredImage
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                {product.featuredImage ? "✓" : "○"}
              </div>
              <span
                className={
                  product.featuredImage ? "text-green-700" : "text-gray-600"
                }
              >
                Featured image uploaded
              </span>
            </div>
          </div>

          {/* Publish Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {product.published
                    ? "Your course is live and available for purchase"
                    : "Complete the checklist above to publish your course"}
                </p>
              </div>
              <Link href={`/creator/products/${params.productId}`}>
                <Button
                  variant={product.published ? "outline" : "default"}
                  disabled={
                    !product.published &&
                    (totalModules === 0 ||
                      totalLessons < 3 ||
                      completedLessons !== totalLessons ||
                      !product.featuredImage)
                  }
                >
                  {product.published ? "Manage Publishing" : "Go to Publishing"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
