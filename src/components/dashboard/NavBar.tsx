// components/dashboard/navbar.tsx
"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DashboardNavbar() {
  return (
    <div className="h-16 border-b bg-white flex items-center px-6">
      <div className="flex items-center gap-x-4 flex-1">
        <div className="relative w-full md:w-64 lg:w-96">
          <Search className="h-4 w-4 absolute top-3 left-3 text-slate-500" />
          <Input
            placeholder="Search..."
            className="w-full pl-9 bg-slate-100 focus-visible:ring-slate-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-x-4 ml-auto">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}
