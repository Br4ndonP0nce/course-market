// src/app/(dashboard)/student/courses/[courseId]/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CoursePreview from "@/components/course/coursePreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShoppingCart, Eye } from "lucide-react";
import Link from "next/link";

interface StudentCoursePageProps {
  params: { courseId: string };
}

// Type for enrolled course with progress - matching Prisma schema exactly
type EnrolledCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // Converted from Decimal
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
    name: string | null; // Nullable as per Prisma schema
  };
  userAccess: {
    hasAccess: boolean;
    enrolledAt: Date | null;
    purchaseId: string | null;
  };
};

async function getStudentCourseAccess(
  courseId: string,
  userId: string
): Promise<EnrolledCourse> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Get course with all content
  const course = await prisma.product.findUnique({
    where: { id: courseId },
    include: {
      creator: {
        select: {
          id: true,
          name: true, // This can be null
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

  if (!course) {
    throw new Error("Course not found");
  }

  // Check if course is published
  if (!course.published) {
    throw new Error("Course not available");
  }

  // Check user access
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: dbUser.id,
      productId: courseId,
      paymentStatus: "COMPLETED",
    },
  });

  return {
    ...course,
    price: course.price.toNumber(),
    userAccess: {
      hasAccess: !!purchase,
      enrolledAt: purchase?.createdAt || null,
      purchaseId: purchase?.id || null,
    },
  };
}

export default async function StudentCoursePage({
  params,
}: StudentCoursePageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let course: EnrolledCourse;

  try {
    course = await getStudentCourseAccess(params.courseId, userId);
  } catch (error) {
    console.error("Error fetching course:", error);

    // Handle different error types
    if (error instanceof Error) {
      if (error.message === "Course not found") {
        redirect("/student/courses?error=course-not-found");
      }
      if (error.message === "Course not available") {
        redirect("/student/courses?error=course-unavailable");
      }
    }

    redirect("/student/courses?error=access-denied");
  }

  // Helper function to get creator name with fallback
  const getCreatorName = () => {
    return course.creator.name || "Unknown Instructor";
  };

  // If user doesn't have access, show enrollment page
  if (!course.userAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/student/courses">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Courses
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {course.title}
                </h1>
                <p className="text-gray-600">by {getCreatorName()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment required */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-2xl mx-auto p-8">
            <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Enrollment Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to enroll in this course to access the lessons and
              content.
            </p>

            {/* Course preview info */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-start space-x-4">
                {course.featuredImage && (
                  <img
                    src={course.featuredImage}
                    alt={course.title}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {course.modules.length} module
                      {course.modules.length !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>
                      {course.modules.reduce(
                        (sum, m) => sum + m.lessons.length,
                        0
                      )}{" "}
                      lessons
                    </span>
                    <span>•</span>
                    <span>by {getCreatorName()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment actions */}
            <div className="space-y-4">
              {course.price === 0 ? (
                <form action="/api/courses/enroll" method="POST">
                  <input type="hidden" name="courseId" value={course.id} />
                  <Button type="submit" size="lg" className="w-full">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Enroll for Free
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${course.price.toFixed(2)}
                  </div>
                  <Button size="lg" className="w-full">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Purchase Course
                  </Button>
                </div>
              )}

              {/* Preview lessons available */}
              {course.modules.some((m) =>
                m.lessons.some((l) => l.isPreview)
              ) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Preview available lessons:
                  </p>
                  <Link href={`/courses/${course.id}/preview`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Watch Preview Lessons
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access - show full course player
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/student/courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Courses
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>by {getCreatorName()}</span>
                {course.userAccess.enrolledAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      Enrolled{" "}
                      {new Date(
                        course.userAccess.enrolledAt
                      ).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-sm text-green-600 font-medium">✓ Enrolled</div>
          </div>
        </div>
      </div>

      {/* Course player */}
      <CoursePreview
        course={course}
        mode="student"
        userHasAccess={course.userAccess.hasAccess}
      />
    </div>
  );
}
