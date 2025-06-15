// src/components/course/CourseSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Eye,
  PlayCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

interface CourseSidebarProps {
  course: Course;
  currentLessonId: string;
  onLessonSelect: (lesson: Lesson) => void;
  isPreviewMode?: boolean;
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

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  course,
  currentLessonId,
  onLessonSelect,
  isPreviewMode = true,
  className = "",
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Auto-expand module containing current lesson
  useEffect(() => {
    const currentModule = course.modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === currentLessonId)
    );
    if (currentModule) {
      setExpandedModules((prev) => new Set([...prev, currentModule.id]));
    }
  }, [currentLessonId, course.modules]);

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.uploadStatus === "processing") {
      return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
    }
    if (lesson.uploadStatus === "failed") {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (lesson.uploadStatus !== "completed") {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
    if (lesson.processingProgress === 100) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (lesson.isPreview) {
      return <Eye className="h-4 w-4 text-blue-500" />;
    }
    return <PlayCircle className="h-4 w-4 text-gray-600" />;
  };

  const canAccessLesson = (lesson: Lesson) => {
    return (
      isPreviewMode || lesson.isPreview || lesson.uploadStatus === "completed"
    );
  };

  const getLessonStatusText = (lesson: Lesson) => {
    if (lesson.uploadStatus === "processing") {
      return `Processing (${lesson.processingProgress || 0}%)`;
    }
    if (lesson.uploadStatus === "failed") {
      return "Processing failed";
    }
    if (lesson.uploadStatus === "pending") {
      return "Pending upload";
    }
    if (lesson.uploadStatus === "uploading") {
      return "Uploading...";
    }
    if (lesson.uploadStatus === "completed") {
      return "Ready";
    }
    return "Not ready";
  };

  const getTotalStats = () => {
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    const completedLessons = course.modules.reduce(
      (sum, m) =>
        sum + m.lessons.filter((l) => l.uploadStatus === "completed").length,
      0
    );
    const processingLessons = course.modules.reduce(
      (sum, m) =>
        sum + m.lessons.filter((l) => l.uploadStatus === "processing").length,
      0
    );
    return { totalLessons, completedLessons, processingLessons };
  };

  const { totalLessons, completedLessons, processingLessons } = getTotalStats();

  return (
    <div
      className={`w-80 bg-white border-r border-gray-200 flex flex-col h-full ${className}`}
    >
      {/* Course header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          {course.featuredImage && (
            <img
              src={course.featuredImage}
              alt={course.title}
              className="w-16 h-12 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {course.title}
            </h2>
            <p className="text-sm text-gray-600">
              by {getCreatorName(course.creator)}
            </p>
            {isPreviewMode && (
              <div className="flex items-center mt-1">
                <Eye className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs text-blue-600">Preview Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Course progress summary */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded px-2 py-1">
            <div className="font-medium text-gray-900">{completedLessons}</div>
            <div className="text-gray-600">Ready</div>
          </div>
          <div className="bg-gray-50 rounded px-2 py-1">
            <div className="font-medium text-gray-900">{processingLessons}</div>
            <div className="text-gray-600">Processing</div>
          </div>
        </div>
      </div>

      {/* Course content */}
      <div className="flex-1 overflow-y-auto">
        {course.modules.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No modules created yet</p>
          </div>
        ) : (
          course.modules.map((module) => (
            <div key={module.id} className="border-b border-gray-100">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {module.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>
                        {module.lessons.length} lesson
                        {module.lessons.length !== 1 ? "s" : ""}
                      </span>
                      <span className="mx-1">•</span>
                      <span>
                        {
                          module.lessons.filter(
                            (l) => l.uploadStatus === "completed"
                          ).length
                        }{" "}
                        ready
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      expandedModules.has(module.id) ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {expandedModules.has(module.id) && (
                <div className="bg-gray-50">
                  {module.lessons.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm">No lessons in this module</div>
                    </div>
                  ) : (
                    module.lessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        onClick={() =>
                          canAccessLesson(lesson) && onLessonSelect(lesson)
                        }
                        disabled={!canAccessLesson(lesson)}
                        className={`w-full p-3 text-left border-l-4 transition-all ${
                          lesson.id === currentLessonId
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:bg-gray-100"
                        } ${
                          !canAccessLesson(lesson)
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getLessonIcon(lesson)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {index + 1}. {lesson.title}
                                </p>
                                {lesson.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {lesson.description}
                                  </p>
                                )}
                                <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                                  <span>{lesson.contentType}</span>
                                  {lesson.duration && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {formatDuration(lesson.duration)}
                                      </span>
                                    </>
                                  )}
                                  {lesson.isPreview && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600">
                                        Preview
                                      </span>
                                    </>
                                  )}
                                </div>
                                {isPreviewMode &&
                                  lesson.uploadStatus !== "completed" && (
                                    <div className="mt-1">
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                        {getLessonStatusText(lesson)}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Course stats footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {totalLessons}
            </div>
            <div className="text-xs text-gray-600">Total Lessons</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {completedLessons}
            </div>
            <div className="text-xs text-gray-600">Ready</div>
          </div>
        </div>
        {processingLessons > 0 && (
          <div className="mt-2 text-center">
            <div className="text-sm text-orange-600">
              {processingLessons} lesson{processingLessons !== 1 ? "s" : ""}{" "}
              processing
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSidebar;
