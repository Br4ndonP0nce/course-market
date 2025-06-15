// src/components/course/CoursePreview.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlayCircle,
  BarChart3,
  Edit,
  Loader2,
} from "lucide-react";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import CourseSidebar from "./courseNavigationSideBar";
import { toast } from "sonner";

// Types matching your Prisma schema exactly
interface Lesson {
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
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
  productId: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  published: boolean;
  featuredImage: string | null;
  categories: string | null;
  language: string | null;
  primaryCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  modules: Module[];
  creator: {
    id: string;
    name: string | null; // NOW NULLABLE - matches Prisma schema
  };
}

interface CoursePreviewProps {
  course: Course;
  mode?: "creator" | "student";
  userHasAccess?: boolean;
  className?: string;
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Helper function to safely get creator name
const getCreatorName = (creator: { name: string | null }): string => {
  return creator.name || "Unknown Instructor";
};

const CoursePreview: React.FC<CoursePreviewProps> = ({
  course,
  mode = "creator",
  userHasAccess = true,
  className = "",
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(false);

  // Find all accessible lessons based on mode
  const getAllLessons = (): Lesson[] => {
    return course.modules
      .flatMap((module) =>
        module.lessons.filter((lesson) => {
          if (mode === "creator") return true; // Creators can see all lessons
          if (!userHasAccess) return lesson.isPreview; // Non-enrolled users only see previews
          return lesson.isPreview || lesson.uploadStatus === "completed";
        })
      )
      .sort((a, b) => {
        // Sort by module position, then lesson position
        const moduleA = course.modules.find((m) => m.id === a.moduleId);
        const moduleB = course.modules.find((m) => m.id === b.moduleId);

        if (moduleA && moduleB && moduleA.position !== moduleB.position) {
          return moduleA.position - moduleB.position;
        }

        return a.position - b.position;
      });
  };

  const allLessons = getAllLessons();
  const currentIndex = currentLesson
    ? allLessons.findIndex((lesson) => lesson.id === currentLesson.id)
    : -1;
  const hasNext = currentIndex < allLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  // Initialize with first lesson
  useEffect(() => {
    if (!currentLesson && allLessons.length > 0) {
      // Find first incomplete lesson or first lesson
      const incompleteLesson = allLessons.find(
        (lesson) =>
          lesson.uploadStatus === "completed" && !lesson.processingProgress
      );
      setCurrentLesson(incompleteLesson || allLessons[0]);
    }
  }, [course, allLessons, currentLesson]);

  const goToNextLesson = () => {
    if (hasNext) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    }
  };

  const goToPreviousLesson = () => {
    if (hasPrevious) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  const handleLessonComplete = async () => {
    if (!currentLesson) return;

    try {
      setLoading(true);

      if (mode === "creator") {
        // Creator preview mode - just simulate completion
        console.log("Creator preview - lesson completion simulated");
        toast.success("Lesson marked as complete (preview mode)");
      } else if (userHasAccess) {
        // Student mode with access - call your existing API
        const response = await fetch(
          `/api/lessons/${currentLesson.id}/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to mark lesson as complete"
          );
        }

        const result = await response.json();
        console.log("Lesson completed:", result);
        toast.success("Lesson completed!");

        // Update local state if needed
        // You could update the lesson completion status here
      }

      // Auto-advance to next lesson if autoplay enabled
      if (autoPlay && hasNext) {
        setTimeout(goToNextLesson, 2000);
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to complete lesson: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = async (currentTime: number, duration: number) => {
    if (!currentLesson || mode === "creator") return;

    // Throttle progress updates to avoid excessive API calls
    const progressPercentage = (currentTime / duration) * 100;

    // Only save progress at significant milestones
    if (progressPercentage % 10 < 0.5) {
      // Every 10%
      try {
        // You can implement progress saving to your API here
        console.log(
          `Progress: ${Math.round(progressPercentage)}% for lesson ${
            currentLesson.id
          }`
        );

        // Example API call (implement this endpoint):
        // await fetch(`/api/lessons/${currentLesson.id}/progress`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     currentTime,
        //     duration,
        //     progressPercentage: Math.round(progressPercentage)
        //   }),
        // });
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const getCurrentModule = (): Module | null => {
    if (!currentLesson) return null;
    return (
      course.modules.find((module) =>
        module.lessons.some((lesson) => lesson.id === currentLesson.id)
      ) || null
    );
  };

  const getCompletionStats = () => {
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter(
      (lesson) =>
        lesson.uploadStatus === "completed" && lesson.processingProgress === 100
    ).length;
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return { totalLessons, completedLessons, progressPercentage };
  };

  const stats = getCompletionStats();
  const currentModule = getCurrentModule();

  if (!currentLesson) {
    return (
      <div
        className={`h-screen flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center">
          <PlayCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No lessons available
          </h2>
          <p className="text-gray-600">
            {mode === "creator"
              ? "This course doesn't have any lessons yet."
              : userHasAccess
              ? "No accessible lessons found in this course."
              : "Please enroll in this course to access lessons."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex bg-gray-100 ${className}`}>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "w-0" : "w-80"
        } overflow-hidden`}
      >
        <CourseSidebar
          course={course}
          currentLessonId={currentLesson.id}
          onLessonSelect={setCurrentLesson}
          isPreviewMode={mode === "creator"}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={
                  sidebarCollapsed
                    ? "Show course outline"
                    : "Hide course outline"
                }
              >
                <BookOpen className="h-5 w-5 text-gray-600" />
              </button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentLesson.title}
                </h1>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  {currentModule && (
                    <>
                      <span>Module: {currentModule.title}</span>
                      <span className="mx-2">•</span>
                    </>
                  )}
                  <span>
                    Lesson {currentIndex + 1} of {allLessons.length}
                  </span>
                  {currentLesson.duration && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{formatDuration(currentLesson.duration)}</span>
                    </>
                  )}
                  {currentLesson.uploadStatus !== "completed" && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-orange-600 capitalize">
                        {currentLesson.uploadStatus}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {mode === "creator" && (
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 font-medium">
                    Creator Preview
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoplay" className="text-sm text-gray-600">
                  Auto-play next
                </label>
              </div>

              {mode === "creator" && (
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Course settings"
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video player */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <SecureVideoPlayer
              lessonId={currentLesson.id}
              lessonTitle={currentLesson.title}
              videoQualities={currentLesson.videoQualities || {}}
              thumbnailUrl={currentLesson.thumbnailUrl || undefined}
              duration={currentLesson.duration || undefined}
              autoPlay={autoPlay}
              onProgress={handleProgress}
              onComplete={handleLessonComplete}
              isPreview={mode === "creator"}
              hasAccess={mode === "creator" || userHasAccess}
              className="w-full"
            />

            {/* Loading indicator */}
            {loading && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            )}

            {/* Lesson description */}
            {currentLesson.description && (
              <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">
                  About this lesson
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {currentLesson.description}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={goToPreviousLesson}
                disabled={!hasPrevious}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous Lesson</span>
              </button>

              <div className="text-center">
                <div className="text-sm text-gray-600">
                  {currentIndex + 1} of {allLessons.length} lessons
                </div>
                <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentIndex + 1) / allLessons.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={goToNextLesson}
                disabled={!hasNext}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next Lesson</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Course progress for students */}
            {mode === "student" && userHasAccess && (
              <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Your Progress
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.progressPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Course Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completedLessons}
                    </div>
                    <div className="text-sm text-gray-600">
                      Lessons Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatDuration(
                        allLessons.reduce(
                          (acc, lesson) => acc + (lesson.duration || 0),
                          0
                        )
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Duration</div>
                  </div>
                </div>
              </div>
            )}

            {/* Creator-specific features */}
            {mode === "creator" && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Content Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Ready for students
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {
                          allLessons.filter(
                            (l) => l.uploadStatus === "completed"
                          ).length
                        }{" "}
                        lessons
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Still processing
                      </span>
                      <span className="text-sm font-medium text-orange-600">
                        {
                          allLessons.filter(
                            (l) => l.uploadStatus === "processing"
                          ).length
                        }{" "}
                        lessons
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Preview lessons
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {allLessons.filter((l) => l.isPreview).length} lessons
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        // Navigate to edit lesson page
                        window.location.href = `/creator/products/${course.id}/content`;
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Edit className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Edit this lesson
                          </div>
                          <div className="text-sm text-gray-600">
                            Update title, description, or video
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        window.location.href = `/creator/products/${course.id}/content`;
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Manage course content
                          </div>
                          <div className="text-sm text-gray-600">
                            Add, remove, or reorder lessons
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        window.location.href = `/creator/analytics`;
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            View analytics
                          </div>
                          <div className="text-sm text-gray-600">
                            See how students are engaging
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;
