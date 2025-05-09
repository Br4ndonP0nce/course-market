"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Mock data - would be fetched from API in a real app
const courses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    progress: 68,
    lastAccessed: "2 days ago",
    imageUrl: "https://placehold.co/150",
  },
  {
    id: "2",
    title: "Data Science Fundamentals",
    progress: 42,
    lastAccessed: "Yesterday",
    imageUrl: "https://placehold.co/150",
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    progress: 12,
    lastAccessed: "Today",
    imageUrl: "https://placehold.co/150",
  },
];

export function StudentCoursesList() {
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-slate-50"
        >
          <div className="flex-shrink-0">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-12 h-12 object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-base font-medium truncate">{course.title}</h4>
              <span className="text-xs text-slate-500">
                {course.lastAccessed}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={course.progress} className="h-2 flex-1" />
              <span className="text-xs font-medium">{course.progress}%</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link href={`/student/courses/${course.id}`}>
              <Button variant="ghost" size="sm">
                Resume
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
