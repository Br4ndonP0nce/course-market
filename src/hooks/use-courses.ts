// src/lib/hooks/use-courses.ts
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  featuredImage?: string;
  categories: string[];
  language: string;
  studentCount: number;
  moduleCount: number;
  creator: {
    name: string;
  };
  userHasAccess?: boolean;
  enrolledAt?: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  position: number;
  lessons: Lesson[];
  completedCount?: number;
  totalCount?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  position: number;
  isPreview: boolean;
  duration?: number;
  completed?: boolean;
  completedAt?: string;
  contentUrl?: string;
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  priceRange?: string;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Hook for browsing courses (marketplace)
export function useCourses(filters: CourseFilters = {}) {
  const [data, setData] = useState<CoursesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (newFilters: CourseFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const allFilters = { ...filters, ...newFilters };
      
      Object.entries(allFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/courses?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchCourses,
  };
}

// Hook for individual course with flexible data loading
export function useCourse(
  courseId: string, 
  options: { 
    include?: 'structure' | 'content';
    lesson?: string;
  } = {}
) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.include) params.append('include', options.include);
      if (options.lesson) params.append('lesson', options.lesson);

      const response = await fetch(`/api/courses/${courseId}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch course");
      }

      const result = await response.json();
      setCourse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId, options.include, options.lesson]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourse,
  };
}

// Hook for course progress
export function useCourseProgress(courseId: string) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/progress`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch progress");
      }

      const result = await response.json();
      setProgress(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      // Don't show toast for 403 errors (not enrolled)
      if (!errorMessage.includes("not enrolled")) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  };
}

// Hook for course actions
export function useCourseActions() {
  const [loading, setLoading] = useState(false);

  const completeLesson = async (courseId: string, lessonId: string, completed: boolean = true) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId, completed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lesson progress");
      }

      const result = await response.json();
      
      if (completed) {
        toast.success("Lesson marked as complete!");
      } else {
        toast.success("Lesson marked as incomplete.");
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll in course");
      }

      const result = await response.json();
      toast.success("Successfully enrolled in course!");
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeLesson,
    enrollInCourse,
    loading,
  };
}

// src/lib/hooks/use-lesson.ts (separate file or add to same file)
export interface LessonContent {
  lesson: {
    id: string;
    title: string;
    description?: string;
    contentType: string;
    contentUrl?: string;
    duration?: number;
    completed: boolean;
    completedAt?: string;
  };
  module: {
    id: string;
    title: string;
    position: number;
  };
  courseId: string;
}

// Hook for individual lesson content
export function useLesson(courseId: string, lessonId: string) {
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = async () => {
    if (!courseId || !lessonId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}?lesson=${lessonId}&include=content`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch lesson");
      }

      const result = await response.json();
      setLesson(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [courseId, lessonId]);

  return {
    lesson,
    loading,
    error,
    refetch: fetchLesson,
  };
}

// Combined hook for course learning experience
export function useCoursePlayer(courseId: string) {
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  
  // Get course structure
  const { course, loading: courseLoading, refetch: refetchCourse } = useCourse(courseId, {
    include: 'structure'
  });
  
  // Get progress
  const { progress, loading: progressLoading, refetch: refetchProgress } = useCourseProgress(courseId);
  
  // Get current lesson content
  const { lesson, loading: lessonLoading, refetch: refetchLesson } = useLesson(
    courseId, 
    currentLessonId || ''
  );
  
  // Actions
  const { completeLesson, loading: actionLoading } = useCourseActions();
  
  // Helper functions
  const navigateToLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };
  
  const getNextLesson = () => {
    if (!course?.modules || !currentLessonId) return null;
    
    let found = false;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (found) return lesson;
        if (lesson.id === currentLessonId) found = true;
      }
    }
    return null;
  };
  
  const getPreviousLesson = () => {
    if (!course?.modules || !currentLessonId) return null;
    
    let previousLesson = null;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLessonId) return previousLesson;
        previousLesson = lesson;
      }
    }
    return null;
  };
  
  const markCurrentLessonComplete = async (completed: boolean = true) => {
    if (!currentLessonId) return;
    
    const result = await completeLesson(courseId, currentLessonId, completed);
    
    // Refresh progress data
    refetchProgress();
    
    return result;
  };
  
  // Auto-navigate to first incomplete lesson on load
  useEffect(() => {
    if (progress && !currentLessonId) {
      // Find first incomplete lesson
      for (const module of progress.modules || []) {
        for (const lesson of module.lessons || []) {
          if (!lesson.completed) {
            setCurrentLessonId(lesson.id);
            return;
          }
        }
      }
      
      // If all complete, go to first lesson
      if (progress.modules?.[0]?.lessons?.[0]) {
        setCurrentLessonId(progress.modules[0].lessons[0].id);
      }
    }
  }, [progress, currentLessonId]);
  
  return {
    // Data
    course,
    progress,
    currentLesson: lesson,
    currentLessonId,
    
    // Loading states
    loading: courseLoading || progressLoading || lessonLoading || actionLoading,
    
    // Actions
    navigateToLesson,
    markCurrentLessonComplete,
    
    // Navigation helpers
    nextLesson: getNextLesson(),
    previousLesson: getPreviousLesson(),
    
    // Refresh functions
    refetch: () => {
      refetchCourse();
      refetchProgress();
      refetchLesson();
    }
  };
}