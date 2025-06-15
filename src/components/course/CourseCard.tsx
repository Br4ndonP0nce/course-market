// src/components/course/CourseCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  ShoppingCart,
  Eye,
} from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    featuredImage: string | null;
    categories: string | null;
    creator: {
      name: string | null;
    };
    stats: {
      totalLessons: number;
      totalDuration: number;
      studentCount: number;
      avgRating: number;
      isNew: boolean;
      isTrending: boolean;
    };
    userEnrolled?: boolean;
  };
  showEnrollment?: boolean;
  isAuthenticated?: boolean;
  className?: string;
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

const getCreatorName = (creator: { name: string | null }): string => {
  return creator.name || "Unknown Instructor";
};

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  showEnrollment = false,
  isAuthenticated = false,
  className = "",
}) => {
  const handleEnroll = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation

    if (!isAuthenticated) {
      window.location.href = "/sign-in";
      return;
    }

    if (course.price === 0) {
      // Free course enrollment
      try {
        const response = await fetch("/api/courses/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId: course.id }),
        });

        if (response.ok) {
          window.location.href = `/student/courses/${course.id}`;
        } else {
          const error = await response.json();
          alert(error.error || "Failed to enroll");
        }
      } catch (error) {
        alert("Failed to enroll");
      }
    } else {
      // Paid course - redirect to course page for purchase
      window.location.href = `/course/${course.slug}`;
    }
  };

  const categories = course.categories
    ? course.categories.split(",").map((cat) => cat.trim())
    : [];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      <Link
        href={
          course.userEnrolled
            ? `/student/courses/${course.id}`
            : `/course/${course.slug}`
        }
      >
        {/* Course Image */}
        <div className="relative aspect-video">
          {course.featuredImage ? (
            <img
              src={course.featuredImage}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <PlayCircle className="h-16 w-16 text-white opacity-80" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {course.stats.isNew && (
              <Badge className="bg-green-500 text-white text-xs">New</Badge>
            )}
            {course.stats.isTrending && (
              <Badge className="bg-orange-500 text-white text-xs">
                Trending
              </Badge>
            )}
            {course.price === 0 && (
              <Badge className="bg-blue-500 text-white text-xs">Free</Badge>
            )}
          </div>

          {/* Enrolled indicator */}
          {course.userEnrolled && (
            <div className="absolute top-3 right-3">
              <div className="bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Duration overlay */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(course.stats.totalDuration)}
            </div>
          </div>
        </div>
      </Link>

      {/* Course Content */}
      <div className="p-4">
        {/* Category tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {categories.slice(0, 2).map((category) => (
              <Link
                key={category}
                href={`/courses?category=${encodeURIComponent(category)}`}
                className="inline-block"
              >
                <Badge variant="outline" className="text-xs hover:bg-gray-100">
                  {category}
                </Badge>
              </Link>
            ))}
            {categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Course Title */}
        <Link
          href={
            course.userEnrolled
              ? `/student/courses/${course.id}`
              : `/course/${course.slug}`
          }
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors mb-2">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <p className="text-sm text-gray-600 mb-2">
          by {getCreatorName(course.creator)}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {course.description}
        </p>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              <span>{course.stats.totalLessons} lessons</span>
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{course.stats.studentCount}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{course.stats.avgRating}</span>
            </div>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {course.price === 0 ? (
              <span className="text-lg font-bold text-green-600">Free</span>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${course.price.toFixed(2)}
              </span>
            )}
          </div>

          {showEnrollment && (
            <div>
              {course.userEnrolled ? (
                <Link href={`/student/courses/${course.id}`}>
                  <Button size="sm" variant="outline">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Continue
                  </Button>
                </Link>
              ) : (
                <div className="flex space-x-1">
                  {/* Preview button for courses with preview lessons */}
                  <Link href={`/course/${course.slug}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </Link>

                  {/* Enroll/Purchase button */}
                  {course.price === 0 ? (
                    <Button size="sm" onClick={handleEnroll}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Enroll
                    </Button>
                  ) : (
                    <Link href={`/course/${course.slug}`}>
                      <Button size="sm">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Buy
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
