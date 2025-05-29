"use client";

import { useCourses } from "@/hooks/use-courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function CourseGrid() {
  const { data, loading, refetch } = useCourses({
    limit: 12,
    // Could add filters: category: 'design', priceRange: '0-50'
  });

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.courses.map((course) => (
        <Card key={course.id}>
          <div className="aspect-video relative">
            <img
              src={course.featuredImage || "/placeholder.jpg"}
              alt={course.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              <Badge variant="outline">{course.categories[0]}</Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {course.description}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold">
                ${course.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                {course.studentCount} students
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">by {course.creator.name}</span>
              <Link href={`/courses/${course.id}`}>
                <Button>View Course</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
