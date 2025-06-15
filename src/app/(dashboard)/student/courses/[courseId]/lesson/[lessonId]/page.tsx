// src/app/(dashboard)/student/courses/[courseId]/lesson/[lessonId]/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

interface StudentLessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

interface LessonWithCourse {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  position: number;
  isPreview: boolean;
  duration: number | null;
  uploadStatus: string | null;
  videoQualities: any;
  thumbnailUrl: string | null;
  contentUrl: string | null;
  module: {
    id: string;
    title: string;
    position: number;
    product: {
      id: string;
      title: string;
      slug: string;
      creator: {
        name: string | null; // Nullable as per Prisma schema
      };
    };
  };
  progress: {
    completed: boolean;
    completedAt: Date | null;
  } | null;
  navigation: {
    previousLesson: {
      id: string;
      title: string;
    } | null;
    nextLesson: {
      id: string;
      title: string;
    } | null;
    courseProgress: {
      totalLessons: number;
      completedLessons: number;
      progressPercentage: number;
    };
  };
}

async function getStudentLessonAccess(
  courseId: string,
  lessonId: string,
  userId: string
): Promise<LessonWithCourse> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  // Check if user has access to the course
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: dbUser.id,
      productId: courseId,
      paymentStatus: "COMPLETED",
    },
  });

  if (!purchase) {
    throw new Error("Access denied - not enrolled in course");
  }

  // Get the lesson with all required data
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      module: {
        productId: courseId,
      },
    },
    include: {
      module: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              creator: {
                select: {
                  name: true, // This can be null
                },
              },
            },
          },
        },
      },
      progress: {
        where: {
          purchaseId: purchase.id,
        },
        select: {
          completed: true,
          completedAt: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  // Get all lessons in the course for navigation
  const allLessons = await prisma.lesson.findMany({
    where: {
      module: {
        productId: courseId,
      },
    },
    select: {
      id: true,
      title: true,
      position: true,
      module: {
        select: {
          position: true,
        },
      },
    },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
  });

  // Find current lesson index and navigation
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Get course progress
  const allProgress = await prisma.progress.findMany({
    where: {
      purchaseId: purchase.id,
    },
    select: {
      completed: true,
    },
  });

  const totalLessons = allProgress.length;
  const completedLessons = allProgress.filter((p) => p.completed).length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    ...lesson,
    progress: lesson.progress[0] || null,
    navigation: {
      previousLesson: previousLesson
        ? {
            id: previousLesson.id,
            title: previousLesson.title,
          }
        : null,
      nextLesson: nextLesson
        ? {
            id: nextLesson.id,
            title: nextLesson.title,
          }
        : null,
      courseProgress: {
        totalLessons,
        completedLessons,
        progressPercentage,
      },
    },
  };
}

export default async function StudentLessonPage({
  params,
}: StudentLessonPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let lesson: LessonWithCourse;

  try {
    lesson = await getStudentLessonAccess(
      params.courseId,
      params.lessonId,
      userId
    );
  } catch (error) {
    console.error("Error fetching lesson:", error);

    if (error instanceof Error) {
      if (error.message === "Access denied - not enrolled in course") {
        redirect(`/student/courses/${params.courseId}?error=not-enrolled`);
      }
      if (error.message === "Lesson not found") {
        redirect(`/student/courses/${params.courseId}?error=lesson-not-found`);
      }
    }

    redirect("/student/courses");
  }

  // Helper function to get creator name with fallback
  const getCreatorName = () => {
    return lesson.module.product.creator.name || "Unknown Instructor";
  };

  const handleLessonComplete = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark lesson as complete");
      }

      // Optionally redirect to next lesson or refresh page
      window.location.reload();
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href={`/student/courses/${params.courseId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {lesson.title}
                </h1>
                <div className="flex items-center text-sm text-gray-600">
                  <span>{lesson.module.product.title}</span>
                  <span className="mx-2">•</span>
                  <span>{lesson.module.title}</span>
                  <span className="mx-2">•</span>
                  <span>by {getCreatorName()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {lesson.progress?.completed && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </div>
              )}
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Course Progress
              </span>
              <span className="text-sm text-gray-600">
                {lesson.navigation.courseProgress.completedLessons} of{" "}
                {lesson.navigation.courseProgress.totalLessons} lessons
              </span>
            </div>
            <Progress
              value={lesson.navigation.courseProgress.progressPercentage}
              className="h-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {lesson.navigation.courseProgress.progressPercentage}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Video Player */}
        <div className="mb-8">
          {lesson.uploadStatus === "completed" && lesson.videoQualities ? (
            <SecureVideoPlayer
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              videoQualities={lesson.videoQualities}
              thumbnailUrl={lesson.thumbnailUrl || undefined}
              duration={lesson.duration || undefined}
              autoPlay={false}
              onComplete={handleLessonComplete}
              isPreview={false}
              hasAccess={true}
              className="w-full"
            />
          ) : (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                {lesson.uploadStatus === "processing" ? (
                  <>
                    <Clock className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold mb-2">
                      Video Processing
                    </h3>
                    <p className="text-gray-300">
                      This lesson is still being processed. Please check back in
                      a few minutes.
                    </p>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Video Not Available
                    </h3>
                    <p className="text-gray-300">
                      This lesson content is not yet available.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Lesson Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {lesson.title}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600 space-x-3">
                    <span>{lesson.contentType}</span>
                    {lesson.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(lesson.duration)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Module: {lesson.module.title}</span>
                  </div>
                </div>

                {!lesson.progress?.completed &&
                  lesson.uploadStatus === "completed" && (
                    <Button onClick={handleLessonComplete}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
              </div>

              {lesson.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    About this lesson
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {lesson.description}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                {lesson.navigation.previousLesson ? (
                  <Link
                    href={`/student/courses/${params.courseId}/lesson/${lesson.navigation.previousLesson.id}`}
                  >
                    <Button variant="outline">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous: {lesson.navigation.previousLesson.title}
                    </Button>
                  </Link>
                ) : (
                  <div></div>
                )}

                {lesson.navigation.nextLesson ? (
                  <Link
                    href={`/student/courses/${params.courseId}/lesson/${lesson.navigation.nextLesson.id}`}
                  >
                    <Button>
                      Next: {lesson.navigation.nextLesson.title}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/student/courses/${params.courseId}`}>
                    <Button>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Back to Course
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Course Overview
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Course</div>
                  <div className="font-medium text-gray-900">
                    {lesson.module.product.title}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Instructor</div>
                  <div className="font-medium text-gray-900">
                    {getCreatorName()}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="font-medium text-gray-900">
                    {lesson.navigation.courseProgress.progressPercentage}%
                    Complete
                  </div>
                  <div className="text-xs text-gray-500">
                    {lesson.navigation.courseProgress.completedLessons} of{" "}
                    {lesson.navigation.courseProgress.totalLessons} lessons
                  </div>
                </div>

                {lesson.progress?.completedAt && (
                  <div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="font-medium text-gray-900">
                      {new Date(
                        lesson.progress.completedAt
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link href={`/student/courses/${params.courseId}`}>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Lessons
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
