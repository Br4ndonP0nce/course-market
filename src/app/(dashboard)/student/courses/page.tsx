// src/app/(dashboard)/student/courses/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  BookOpen,
  Search,
  Filter,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// Types for enrolled courses with progress - matching Prisma schema exactly
interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImage: string | null;
  createdAt: Date;
  creator: {
    name: string | null; // Nullable as per Prisma schema
  };
  enrolledAt: Date;
  stats: {
    totalLessons: number;
    completedLessons: number;
    totalDuration: number;
    progressPercentage: number;
    lastAccessedAt: Date | null;
  };
}

async function getStudentEnrolledCourses(
  userId: string
): Promise<EnrolledCourse[]> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Get all completed purchases for this user
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: dbUser.id,
      paymentStatus: "COMPLETED",
    },
    include: {
      product: {
        include: {
          creator: {
            select: {
              name: true, // This can be null
            },
          },
          modules: {
            include: {
              lessons: {
                select: {
                  id: true,
                  duration: true,
                  uploadStatus: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform to enrolled courses with progress calculation
  const enrolledCourses: EnrolledCourse[] = purchases.map((purchase) => {
    const product = purchase.product;

    // Calculate course statistics
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

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      featuredImage: product.featuredImage,
      createdAt: product.createdAt,
      creator: {
        name: product.creator.name, // Keep nullable
      },
      enrolledAt: purchase.createdAt,
      stats: {
        totalLessons,
        completedLessons,
        totalDuration,
        progressPercentage,
        lastAccessedAt: null, // Could be implemented with progress tracking
      },
    };
  });

  return enrolledCourses;
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return "0m";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 50) return "bg-blue-500";
  if (percentage >= 25) return "bg-yellow-500";
  return "bg-gray-300";
};

const getProgressText = (percentage: number): string => {
  if (percentage === 0) return "Not started";
  if (percentage === 100) return "Completed";
  return "In progress";
};

// Helper function to get creator name with fallback
const getCreatorName = (creator: { name: string | null }): string => {
  return creator.name || "Unknown Instructor";
};

export default async function StudentCoursesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let enrolledCourses: EnrolledCourse[];

  try {
    enrolledCourses = await getStudentEnrolledCourses(userId);
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    enrolledCourses = [];
  }

  // Calculate dashboard statistics
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(
    (course) => course.stats.progressPercentage === 100
  ).length;
  const inProgressCourses = enrolledCourses.filter(
    (course) =>
      course.stats.progressPercentage > 0 &&
      course.stats.progressPercentage < 100
  ).length;
  const totalLearningTime = enrolledCourses.reduce(
    (sum, course) => sum + course.stats.totalDuration,
    0
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <DashboardHeader
        heading="My Courses"
        text="Track your learning progress and continue where you left off"
      />

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {totalCourses}
              </div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {inProgressCourses}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {completedCourses}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatDuration(totalLearningTime)}
              </div>
              <div className="text-sm text-gray-600">Learning Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            <option value="recent">Recently accessed</option>
            <option value="progress">Progress</option>
            <option value="name">Course name</option>
            <option value="enrolled">Enrollment date</option>
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Courses Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Browse our course catalog
            to start your learning journey.
          </p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Course Image */}
              <div className="relative">
                {course.featuredImage ? (
                  <img
                    src={course.featuredImage}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Progress Badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={
                      course.stats.progressPercentage === 100
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {course.stats.progressPercentage}% Complete
                  </Badge>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center text-xs text-gray-500 mb-4 space-x-3">
                  <span>by {getCreatorName(course.creator)}</span>
                  <span>•</span>
                  <span>{course.stats.totalLessons} lessons</span>
                  <span>•</span>
                  <span>{formatDuration(course.stats.totalDuration)}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {getProgressText(course.stats.progressPercentage)}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {course.stats.completedLessons}/
                      {course.stats.totalLessons}
                    </span>
                  </div>
                  <Progress
                    value={course.stats.progressPercentage}
                    className="h-2"
                  />
                </div>

                {/* Enrollment Date */}
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Action Button */}
                <Link href={`/student/courses/${course.id}`}>
                  <Button className="w-full">
                    {course.stats.progressPercentage === 0 ? (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Course
                      </>
                    ) : course.stats.progressPercentage === 100 ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review Course
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue Learning
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/courses">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">
                  Browse More Courses
                </div>
                <div className="text-sm text-gray-600">
                  Discover new learning opportunities
                </div>
              </div>
            </Link>

            <Link href="/student/progress">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">View Progress</div>
                <div className="text-sm text-gray-600">
                  Track your learning journey
                </div>
              </div>
            </Link>

            <Link href="/student/settings">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                <div className="font-medium text-gray-900">
                  Learning Schedule
                </div>
                <div className="text-sm text-gray-600">
                  Manage your study time
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
