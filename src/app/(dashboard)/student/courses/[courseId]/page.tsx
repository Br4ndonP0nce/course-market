import { Button } from "@/components/ui/button";
import { CourseContent } from "@/components/course/courseContent";
import { CourseHeader } from "@/components/course/courseHeader";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="mb-6">
        <Link href="/student/courses">
          <Button variant="ghost" size="sm" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Courses
          </Button>
        </Link>
      </div>

      <CourseHeader courseId={params.courseId} />

      <div className="mt-8">
        <CourseContent courseId={params.courseId} />
      </div>
    </div>
  );
}
