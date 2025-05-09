//import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MyCourses } from "@/components/dashboard/myCourses";
import { CoursesFilter } from "@/components/dashboard/coursesFilter";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
export default function StudentCoursesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        heading="My Courses"
        text="All your enrolled courses in one place"
      />

      <CoursesFilter />
      <MyCourses />
    </div>
  );
}
