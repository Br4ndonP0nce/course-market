"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  PlayCircle,
  Lock,
  FileText,
  Download,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock data - would be fetched from API in a real app
const getCourseModules = (courseId: string) => {
  return [
    {
      id: "module-1",
      title: "Introduction to Web Development",
      description: "Get started with the fundamentals of web development",
      progress: 100,
      totalDuration: "2h 15m",
      lessons: [
        {
          id: "lesson-1",
          title: "Welcome to the Course",
          duration: "5m",
          type: "video",
          completed: true,
          preview: true,
        },
        {
          id: "lesson-2",
          title: "Setting Up Your Development Environment",
          duration: "15m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-3",
          title: "Understanding Web Technologies",
          duration: "20m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-4",
          title: "HTML, CSS, and JavaScript Overview",
          duration: "25m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-5",
          title: "Introduction Quiz",
          duration: "10m",
          type: "quiz",
          completed: true,
          preview: false,
        },
      ],
    },
    {
      id: "module-2",
      title: "HTML Fundamentals",
      description: "Learn the building blocks of web pages",
      progress: 100,
      totalDuration: "3h 30m",
      lessons: [
        {
          id: "lesson-6",
          title: "HTML Document Structure",
          duration: "20m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-7",
          title: "Text Elements and Typography",
          duration: "25m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-8",
          title: "Links and Images",
          duration: "30m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-9",
          title: "Lists and Tables",
          duration: "30m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-10",
          title: "Forms and Input Elements",
          duration: "35m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-11",
          title: "HTML Project: Building a Profile Page",
          duration: "45m",
          type: "project",
          completed: true,
          preview: false,
        },
      ],
    },
    {
      id: "module-3",
      title: "CSS Essentials",
      description: "Style your web pages with CSS",
      progress: 75,
      totalDuration: "4h 45m",
      lessons: [
        {
          id: "lesson-12",
          title: "CSS Syntax and Selectors",
          duration: "30m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-13",
          title: "Colors and Typography",
          duration: "25m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-14",
          title: "Box Model and Layout",
          duration: "40m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-15",
          title: "Flexbox Layout",
          duration: "45m",
          type: "video",
          completed: true,
          preview: false,
        },
        {
          id: "lesson-16",
          title: "CSS Grid",
          duration: "50m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-17",
          title: "Responsive Design",
          duration: "40m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-18",
          title: "CSS Transitions and Animations",
          duration: "35m",
          type: "video",
          completed: false,
          preview: false,
        },
      ],
    },
    {
      id: "module-4",
      title: "JavaScript Basics",
      description: "Add interactivity to your websites",
      progress: 0,
      totalDuration: "5h 20m",
      lessons: [
        {
          id: "lesson-19",
          title: "Introduction to JavaScript",
          duration: "25m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-20",
          title: "Variables and Data Types",
          duration: "30m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-21",
          title: "Operators and Expressions",
          duration: "25m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-22",
          title: "Control Flow: Conditionals",
          duration: "35m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-23",
          title: "Control Flow: Loops",
          duration: "30m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-24",
          title: "Functions",
          duration: "45m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-25",
          title: "Arrays and Objects",
          duration: "50m",
          type: "video",
          completed: false,
          preview: false,
        },
        {
          id: "lesson-26",
          title: "DOM Manipulation",
          duration: "40m",
          type: "video",
          completed: false,
          preview: false,
        },
      ],
    },
  ];
};

interface CourseContentProps {
  courseId: string;
}

export function CourseContent({ courseId }: CourseContentProps) {
  const modules = getCourseModules(courseId);
  const [activeModule, setActiveModule] = useState<string | undefined>(
    "module-1"
  );

  // Calculate overall progress
  const totalLessons = modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  const completedLessons = modules.reduce((acc, module) => {
    return acc + module.lessons.filter((lesson) => lesson.completed).length;
  }, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  const getLessonIcon = (lesson: any) => {
    if (lesson.type === "video") return <PlayCircle className="h-4 w-4" />;
    if (lesson.type === "quiz") return <FileText className="h-4 w-4" />;
    if (lesson.type === "project") return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Course Content</h2>
        <div className="text-sm text-slate-500">
          {completedLessons} of {totalLessons} lessons completed (
          {overallProgress}%)
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Accordion
          type="single"
          collapsible
          value={activeModule}
          onValueChange={setActiveModule}
          className="w-full"
        >
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="px-4 py-4 hover:bg-slate-50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full text-left">
                  <div>
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-sm text-slate-500">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <div className="flex items-center gap-1 text-sm">
                      <Progress
                        value={module.progress}
                        className="h-1.5 w-12"
                      />
                      <span>{module.progress}%</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {module.totalDuration}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                <div className="border-t">
                  {module.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        index !== module.lessons.length - 1 ? "border-b" : ""
                      } hover:bg-slate-50`}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 text-slate-500">
                          {lesson.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : lesson.preview ? (
                            <PlayCircle className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.preview && (
                              <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                                Preview
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center">
                              {getLessonIcon(lesson)}
                              <span className="ml-1 capitalize">
                                {lesson.type}
                              </span>
                            </div>
                            <span>•</span>
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={lesson.completed ? "outline" : "default"}
                        size="sm"
                      >
                        {lesson.completed ? "Rewatch" : "Start"}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Course Resources</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3 text-slate-500" />
              <span>Course Syllabus</span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3 text-slate-500" />
              <span>HTML Cheatsheet</span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3 text-slate-500" />
              <span>CSS Cheatsheet</span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3 text-slate-500" />
              <span>Project Files</span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
