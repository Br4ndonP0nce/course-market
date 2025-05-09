// app/(dashboard)/student/dashboard/page.tsx
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function StudentDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        heading="Student Dashboard"
        text="Welcome to your learning dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">My Courses</h2>
          <p className="text-gray-600">
            You haven't enrolled in any courses yet.
          </p>
          <div className="mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Explore Courses
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Learning Progress</h2>
          <p className="text-gray-600">Start a course to track your progress</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
          <p className="text-gray-600">
            Personalized course recommendations coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
