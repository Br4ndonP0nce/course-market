"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, Users, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Mock data - would be fetched from API in a real app
const courses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    description: "Learn HTML, CSS, JavaScript, React, Node.js and more.",
    progress: 68,
    instructor: "John Doe",
    totalLessons: 120,
    completedLessons: 82,
    duration: "42 hours",
    students: 1243,
    category: "Development",
    imageUrl: "https://placehold.co/300x200",
  },
  {
    id: "2",
    title: "Data Science Fundamentals",
    description: "Master Python, pandas, NumPy, and machine learning basics.",
    progress: 42,
    instructor: "Jane Smith",
    totalLessons: 85,
    completedLessons: 36,
    duration: "28 hours",
    students: 965,
    category: "Data Science",
    imageUrl: "https://placehold.co/300x200",
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    description: "Comprehensive guide to SEO, SEM, social media marketing.",
    progress: 12,
    instructor: "Mike Johnson",
    totalLessons: 65,
    completedLessons: 8,
    duration: "22 hours",
    students: 1543,
    category: "Marketing",
    imageUrl: "https://placehold.co/300x200",
  },
  {
    id: "4",
    title: "Photography for Beginners",
    description: "Learn the fundamentals of photography and camera settings.",
    progress: 100,
    instructor: "Sarah Williams",
    totalLessons: 48,
    completedLessons: 48,
    duration: "16 hours",
    students: 876,
    category: "Photography",
    imageUrl: "https://placehold.co/300x200",
    completed: true,
  },
];

export function MyCourses() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden">
          <div className="relative h-48">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            {course.completed && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge className="bg-green-500 text-white hover:bg-green-600">
                  Completed
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{course.category}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mt-2">{course.title}</h3>
                <p className="text-sm text-slate-500">{course.description}</p>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {course.completedLessons} of {course.totalLessons} lessons
                  </span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {course.duration}
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {course.students.toLocaleString()}
                </div>
              </div>

              <Link href={`/student/courses/${course.id}`}>
                <Button className="w-full gap-2">
                  <PlayCircle className="h-4 w-4" />
                  {course.completed ? "Review Course" : "Continue Learning"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
