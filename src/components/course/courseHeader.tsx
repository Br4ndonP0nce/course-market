"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, User, BarChart, Award } from "lucide-react";

// Mock data - would come from API in real app
const getCourseDetails = (courseId: string) => {
  return {
    id: courseId,
    title: "Complete Web Development Bootcamp",
    description:
      "Learn HTML, CSS, JavaScript, React, Node.js and more. This comprehensive course will take you from beginner to advanced developer with real-world projects and expert instruction.",
    progress: 68,
    instructor: "John Doe",
    instructorTitle: "Senior Web Developer",
    totalLessons: 120,
    completedLessons: 82,
    duration: "42 hours",
    students: 1243,
    category: "Development",
    level: "All Levels",
    imageUrl: "https://placehold.co/1200x600",
    lastLesson: {
      id: "lesson-24",
      title: "Building Forms with React",
      progress: 50,
    },
  };
};

interface CourseHeaderProps {
  courseId: string;
}

export function CourseHeader({ courseId }: CourseHeaderProps) {
  const course = getCourseDetails(courseId);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const truncatedDescription =
    course.description.slice(0, 150) +
    (course.description.length > 150 ? "..." : "");

  return (
    <div className="space-y-6">
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={course.imageUrl}
          alt={course.title}
          className="w-full aspect-[2/1] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
          <Badge className="mb-2 self-start">{course.category}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-white/90 text-sm">
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              {course.instructor}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {course.duration}
            </div>
            <div className="flex items-center">
              <BarChart className="mr-1 h-4 w-4" />
              {course.level}
            </div>
            <div className="flex items-center">
              <Award className="mr-1 h-4 w-4" />
              {course.completedLessons} of {course.totalLessons} completed
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">About This Course</h2>
            <p className="text-slate-600">
              {showFullDescription ? course.description : truncatedDescription}
              {course.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary font-medium ml-1"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Instructor</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
                JD
              </div>
              <div>
                <p className="font-medium">{course.instructor}</p>
                <p className="text-sm text-slate-500">
                  {course.instructorTitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <h3 className="font-medium mb-2">Your Progress</h3>
            <div className="flex justify-between text-sm mb-1">
              <span>
                Lesson {course.completedLessons} of {course.totalLessons}
              </span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>

          <div className="pt-2">
            <h3 className="font-medium mb-2">Continue Learning</h3>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-medium">{course.lastLesson.title}</p>
              <div className="mt-2 flex justify-between items-center">
                <Progress
                  value={course.lastLesson.progress}
                  className="h-1.5 w-24"
                />
                <Button size="sm">Continue</Button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full">
              View Certificate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
