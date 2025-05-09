"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CoursesFilter() {
  const [status, setStatus] = useState({
    inProgress: true,
    completed: true,
    notStarted: true,
  });

  const [sort, setSort] = useState("recent");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex flex-1 items-center space-x-2 w-full sm:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-8" />
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={status.inProgress}
              onCheckedChange={(value) =>
                setStatus({ ...status, inProgress: !!value })
              }
            >
              In Progress
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={status.completed}
              onCheckedChange={(value) =>
                setStatus({ ...status, completed: !!value })
              }
            >
              Completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={status.notStarted}
              onCheckedChange={(value) =>
                setStatus({ ...status, notStarted: !!value })
              }
            >
              Not Started
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              Sort:{" "}
              {sort === "recent"
                ? "Recent"
                : sort === "az"
                ? "A-Z"
                : "Progress"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sort === "recent"}
              onCheckedChange={(value) => value && setSort("recent")}
            >
              Recently Accessed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort === "az"}
              onCheckedChange={(value) => value && setSort("az")}
            >
              Title (A-Z)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort === "progress"}
              onCheckedChange={(value) => value && setSort("progress")}
            >
              Progress (High to Low)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
