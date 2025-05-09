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
import { useAuth } from "@clerk/nextjs";

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
  const { userId } = useAuth();

  // In a real app, we'd get this from the backend based on the user role
  // For now, we'll use a simple heuristic based on the URL
  const isCreator = pathname.includes("/creator");
  const routes = isCreator ? creatorRoutes : studentRoutes;

  if (!userId) {
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
      {isCreator && (
        <Link
          href="/student/dashboard"
          className="mt-auto mb-4 mx-6 flex items-center gap-x-2 text-sm"
        >
          <GraduationCap className="h-4 w-4" />
          Switch to Student
        </Link>
      )}
      {!isCreator && (
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
