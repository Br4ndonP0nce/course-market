// components/dashboard/sidebar.tsx - Update to better handle role switching

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  BarChart,
  Settings,
  GraduationCap,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

const creatorRoutes = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/creator/dashboard",
  },
  {
    icon: BookOpen,
    label: "Products",
    href: "/creator/products",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/creator/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/creator/settings",
  },
];

const studentRoutes = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/student/dashboard",
  },
  {
    icon: GraduationCap,
    label: "My Courses",
    href: "/student/courses",
  },
  {
    icon: ListChecks,
    label: "Progress",
    href: "/student/progress",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/student/settings",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Determine user role from Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      const role = (user.unsafeMetadata?.role as string) || null;
      setUserRole(role);
    }
  }, [isLoaded, user]);

  // More accurate role detection - check both URL and metadata
  const isCreatorSection = pathname.includes("/creator");
  const isCreator = userRole === "CREATOR";

  // Choose routes based on current section (fallback to URL-based detection)
  const routes = isCreatorSection ? creatorRoutes : studentRoutes;

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <div className="h-full border-r bg-white flex flex-col w-64">
      <div className="p-6">
        <Link href="/">
          <h1 className="font-bold text-xl">CourseHub</h1>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2 text-slate-500 text-sm font-medium pl-6 transition-all hover:text-slate-600 hover:bg-slate-100/50 py-4",
              pathname === route.href &&
                "text-slate-700 bg-slate-100 hover:bg-slate-100"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
      </div>
      {isCreatorSection && !isCreator && (
        <div className="mt-auto mb-4 mx-6 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
          <p>You're viewing the creator area without creator permissions.</p>
        </div>
      )}
      {isCreatorSection && (
        <Link
          href="/student/dashboard"
          className="mt-auto mb-4 mx-6 flex items-center gap-x-2 text-sm"
        >
          <GraduationCap className="h-4 w-4" />
          Switch to Student
        </Link>
      )}
      {!isCreatorSection && isCreator && (
        <Link
          href="/creator/dashboard"
          className="mt-auto mb-4 mx-6 flex items-center gap-x-2 text-sm"
        >
          <BookOpen className="h-4 w-4" />
          Switch to Creator
        </Link>
      )}
    </div>
  );
}
