// src/components/course/CourseContentBuilder.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Video,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Play,
} from "lucide-react";
import CustomVideoUploader from "../uploads/customVideoUploader";
import { toast } from "sonner";

// Import Prisma types directly to ensure compatibility
type PrismaContentType = "VIDEO" | "PDF" | "AUDIO" | "TEXT" | "QUIZ";

// Updated interfaces to match Prisma schema exactly
interface Lesson {
  id: string;
  title: string;
  description: string | null;
  contentType: PrismaContentType; // Use Prisma enum type
  position: number;
  isPreview: boolean;
  duration: number | null;
  uploadStatus: string | null;
  processingProgress: number | null;
  videoQualities: any; // JsonValue from Prisma
  thumbnailUrl: string | null;
  contentUrl: string | null;
  // Add other Prisma fields that might be present
  createdAt?: Date;
  updatedAt?: Date;
  moduleId?: string;
  processedAt?: Date | null;
  processingError?: string | null;
  processingJobId?: string | null;
  rawVideoUrl?: string | null;
  uploadedAt?: Date | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
  expanded?: boolean; // This is UI-only, so can stay optional
  // Add other Prisma fields that might be present
  createdAt?: Date;
  updatedAt?: Date;
  productId?: string;
}

interface CourseContentBuilderProps {
  productId: string;
  initialModules?: any[]; // Accept any[] and transform internally
  onSave?: (modules: Module[]) => void;
  className?: string;
}

export default function CourseContentBuilder({
  productId,
  initialModules = [],
  onSave,
  className = "",
}: CourseContentBuilderProps) {
  // Transform initialModules to ensure type compatibility
  const transformModules = (modules: any[]): Module[] => {
    return modules.map((module) => ({
      ...module,
      expanded: true,
      lessons: module.lessons.map((lesson: any) => ({
        ...lesson,
        // Ensure contentType is properly typed
        contentType: lesson.contentType as PrismaContentType,
      })),
    }));
  };

  const [modules, setModules] = useState<Module[]>(
    transformModules(initialModules)
  );
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [uploadingLesson, setUploadingLesson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-save changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (modules.length > 0) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [modules]);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave?.(modules);
      // The actual saving will be handled by the parent component or API calls
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Module Management
  const addModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error("Please enter a module title");
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newModuleTitle,
          position: modules.length + 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create module");
      }

      const createdModule = await response.json();
      setModules([
        ...modules,
        { ...createdModule, lessons: [], expanded: true },
      ]);
      setNewModuleTitle("");
      toast.success("Module created successfully!");
    } catch (error) {
      console.error("Failed to create module:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create module"
      );
    }
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(
      modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m))
    );
  };

  const deleteModule = async (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    if (module.lessons.length > 0) {
      if (
        !confirm(
          `Delete "${module.title}" and all ${module.lessons.length} lessons? This cannot be undone.`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Delete "${module.title}"?`)) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete module");
      }

      setModules(modules.filter((m) => m.id !== moduleId));
      toast.success("Module deleted successfully");
    } catch (error) {
      console.error("Failed to delete module:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete module"
      );
    }
  };

  const toggleModule = (moduleId: string) => {
    updateModule(moduleId, {
      expanded: !modules.find((m) => m.id === moduleId)?.expanded,
    });
  };

  // Lesson Management
  const addLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    try {
      const response = await fetch(
        `/api/products/${productId}/modules/${moduleId}/lessons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newLessonTitle,
            contentType: "VIDEO",
            position: module.lessons.length + 1,
            isPreview: false,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lesson");
      }

      const createdLesson = await response.json();

      updateModule(moduleId, {
        lessons: [...module.lessons, createdLesson],
      });

      setNewLessonTitle("");
      setUploadingLesson(createdLesson.id);
      toast.success("Lesson created! You can now upload video content.");
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create lesson"
      );
    }
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<Lesson>
  ) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    const updatedLessons = module.lessons.map((l) =>
      l.id === lessonId ? { ...l, ...updates } : l
    );

    updateModule(moduleId, { lessons: updatedLessons });
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    const lesson = modules
      .find((m) => m.id === moduleId)
      ?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lesson");
      }

      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        updateModule(moduleId, {
          lessons: module.lessons.filter((l) => l.id !== lessonId),
        });
      }

      toast.success("Lesson deleted successfully");
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lesson"
      );
    }
  };

  // Upload Handlers
  const handleUploadComplete = (lessonId: string) => (videoData: any) => {
    // Find and update the lesson with video data
    const moduleId = modules.find((m) =>
      m.lessons.some((l) => l.id === lessonId)
    )?.id;

    if (moduleId) {
      updateLesson(moduleId, lessonId, {
        uploadStatus: "completed",
        videoQualities: videoData.videoQualities,
        thumbnailUrl: videoData.thumbnailUrl,
        contentUrl: videoData.contentUrl,
        duration: videoData.duration,
        processingProgress: 100,
      });

      toast.success("Video processing completed! Your lesson is ready.");
    }

    setUploadingLesson(null);
  };

  const handleUploadError = (lessonId: string) => (error: string) => {
    const moduleId = modules.find((m) =>
      m.lessons.some((l) => l.id === lessonId)
    )?.id;

    if (moduleId) {
      updateLesson(moduleId, lessonId, {
        uploadStatus: "failed",
        processingProgress: 0,
      });
    }

    setUploadingLesson(null);
    toast.error(`Upload failed: ${error}`);
  };

  // Helper functions
  const getLessonStatusIcon = (lesson: Lesson) => {
    switch (lesson.uploadStatus) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Video className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalStats = () => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (sum, m) =>
        sum + m.lessons.filter((l) => l.uploadStatus === "completed").length,
      0
    );
    const totalDuration = modules.reduce(
      (sum, m) =>
        sum +
        m.lessons.reduce((lessonSum, l) => lessonSum + (l.duration || 0), 0),
      0
    );

    return { totalLessons, completedLessons, totalDuration };
  };

  const stats = getTotalStats();

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>{modules.length} modules</span>
            <span>•</span>
            <span>{stats.totalLessons} lessons</span>
            <span>•</span>
            <span>
              {stats.completedLessons}/{stats.totalLessons} ready
            </span>
            {stats.totalDuration > 0 && (
              <>
                <span>•</span>
                <span>{formatDuration(stats.totalDuration)} total</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {saving && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <div
            key={module.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Module Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {module.expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {editingModule === module.id ? (
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) =>
                        updateModule(module.id, { title: e.target.value })
                      }
                      onBlur={() => setEditingModule(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setEditingModule(null);
                        if (e.key === "Escape") setEditingModule(null);
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Module {moduleIndex + 1}: {module.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {module.lessons.length} lesson
                        {module.lessons.length !== 1 ? "s" : ""}
                        {module.lessons.filter(
                          (l) => l.uploadStatus === "completed"
                        ).length > 0 && (
                          <span className="ml-2">
                            •{" "}
                            {
                              module.lessons.filter(
                                (l) => l.uploadStatus === "completed"
                              ).length
                            }{" "}
                            ready
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingModule(module.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Module Content */}
            {module.expanded && (
              <div className="p-4 space-y-4">
                {/* Lessons */}
                {module.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    className="border border-gray-200 rounded-lg"
                  >
                    {/* Lesson Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {getLessonStatusIcon(lesson)}

                        {editingLesson === lesson.id ? (
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(module.id, lesson.id, {
                                title: e.target.value,
                              })
                            }
                            onBlur={() => setEditingLesson(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingLesson(null);
                              if (e.key === "Escape") setEditingLesson(null);
                            }}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {lessonIndex + 1}. {lesson.title}
                            </h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span>{lesson.contentType}</span>
                              {lesson.duration && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(lesson.duration)}</span>
                                </>
                              )}
                              {lesson.uploadStatus && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">
                                    {lesson.uploadStatus}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {lesson.thumbnailUrl && (
                          <div className="relative w-16 h-9 rounded overflow-hidden">
                            <img
                              src={lesson.thumbnailUrl}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <Play className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setEditingLesson(lesson.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteLesson(module.id, lesson.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Video Upload Section */}
                    {lesson.contentType === "VIDEO" && !lesson.contentUrl && (
                      <div className="border-t border-gray-200 p-4">
                        {uploadingLesson === lesson.id ? (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3">
                              Upload Video
                            </h5>
                            <CustomVideoUploader
                              lessonId={lesson.id}
                              onUploadComplete={handleUploadComplete(lesson.id)}
                              onUploadError={handleUploadError(lesson.id)}
                              maxSizeGB={5}
                              className="max-w-none"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadingLesson(lesson.id)}
                            className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors w-full"
                          >
                            <Upload className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-600">
                              Click to upload video
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Processing Progress */}
                    {lesson.uploadStatus === "processing" && (
                      <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                          <span className="text-sm text-gray-600">
                            Processing video... {lesson.processingProgress || 0}
                            %
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${lesson.processingProgress || 0}%`,
                            }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Creating multiple quality versions for optimal
                          streaming
                        </div>
                      </div>
                    )}

                    {/* Video Ready State */}
                    {lesson.uploadStatus === "completed" &&
                      lesson.contentUrl && (
                        <div className="border-t border-gray-200 p-4 bg-green-50">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                Video Ready
                              </p>
                              <p className="text-xs text-green-600">
                                Multiple quality versions available for
                                streaming
                              </p>
                            </div>
                            <button
                              onClick={() => setUploadingLesson(lesson.id)}
                              className="ml-auto px-3 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-100 transition-colors"
                            >
                              Replace Video
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Upload Failed State */}
                    {lesson.uploadStatus === "failed" && (
                      <div className="border-t border-gray-200 p-4 bg-red-50">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Upload Failed
                            </p>
                            <p className="text-xs text-red-600">
                              There was an error processing your video
                            </p>
                          </div>
                          <button
                            onClick={() => setUploadingLesson(lesson.id)}
                            className="ml-auto px-3 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-100 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New Lesson */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter lesson title..."
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addLesson(module.id);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => addLesson(module.id)}
                      disabled={!newLessonTitle.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Lesson
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-8">
                    Video lessons will be processed into multiple quality
                    versions for optimal streaming
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add New Module */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Plus className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter module title..."
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addModule();
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addModule}
              disabled={!newModuleTitle.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Module
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-8">
            Organize your course content into logical sections
          </p>
        </div>
      </div>

      {/* Empty State */}
      {modules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Start Building Your Course
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first module to organize your course content. Each
            module can contain multiple lessons with video content.
          </p>
          <div className="inline-flex items-center space-x-3 max-w-md">
            <input
              type="text"
              placeholder="e.g., Introduction to Video Editing"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addModule();
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addModule}
              disabled={!newModuleTitle.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Module
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      {modules.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">
            💡 Tips for Course Creation
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              • <strong>Structure:</strong> Organize content logically from
              basic to advanced concepts
            </div>
            <div>
              • <strong>Video Quality:</strong> Upload high-quality videos -
              they'll be automatically optimized for streaming
            </div>
            <div>
              • <strong>File Size:</strong> Large videos ({">"}100MB) use
              chunked upload with resume capability
            </div>
            <div>
              • <strong>Processing:</strong> Video processing takes 2-10 minutes
              depending on length and quality
            </div>
            <div>
              • <strong>Auto-save:</strong> Your changes are automatically saved
              as you work
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
