import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Trash2,
  GripVertical,
  FileText,
  Video,
  Music,
  CheckSquare,
  BookOpen,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface ContentCreationFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

// Define explicit content type union
type ContentType = "VIDEO" | "PDF" | "AUDIO" | "TEXT" | "QUIZ";

// Type definitions
type LessonType = {
  id: string;
  title: string;
  contentType: ContentType;
  isPreview: boolean;
};

type ModuleType = {
  id: string;
  title: string;
  lessons: LessonType[];
};

const ContentCreationForm: React.FC<ContentCreationFormProps> = ({
  onSubmit,
  onBack,
}) => {
  const [modules, setModules] = useState<ModuleType[]>([
    {
      id: "module-1",
      title: "Introduction",
      lessons: [
        {
          id: "lesson-1",
          title: "Welcome to the Course",
          contentType: "VIDEO",
          isPreview: true,
        },
      ],
    },
  ]);

  const [expandedModule, setExpandedModule] = useState<string | null>(
    "module-1"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ modules });
  };

  const addModule = () => {
    const newModuleId = `module-${modules.length + 1}`;
    const newModule: ModuleType = {
      id: newModuleId,
      title: `Module ${modules.length + 1}`,
      lessons: [],
    };
    setModules([...modules, newModule]);
    setExpandedModule(newModuleId);
  };

  const addLesson = (moduleId: string) => {
    const updatedModules = modules.map((module) => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [
            ...module.lessons,
            {
              id: `lesson-${Date.now()}`,
              title: `New Lesson`,
              contentType: "VIDEO" as ContentType, // Add explicit type casting
              isPreview: false,
            },
          ],
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((module) => module.id !== moduleId));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map((module) => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    const updatedModules = modules.map((module) => {
      if (module.id === moduleId) {
        return { ...module, title };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    updates: Partial<LessonType>
  ) => {
    const updatedModules = modules.map((module) => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id === lessonId) {
              return { ...lesson, ...updates };
            }
            return lesson;
          }),
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    // Handling module reordering
    if (type === "MODULE") {
      const reorderedModules = Array.from(modules);
      const [movedModule] = reorderedModules.splice(source.index, 1);
      reorderedModules.splice(destination.index, 0, movedModule);
      setModules(reorderedModules);
      return;
    }

    // Handling lesson reordering within the same module
    if (source.droppableId === destination.droppableId) {
      const moduleId = source.droppableId;
      const module = modules.find((m) => m.id === moduleId);
      if (!module) return;

      const lessons = Array.from(module.lessons);
      const [movedLesson] = lessons.splice(source.index, 1);
      lessons.splice(destination.index, 0, movedLesson);

      const updatedModules = modules.map((m) => {
        if (m.id === moduleId) {
          return { ...m, lessons };
        }
        return m;
      });

      setModules(updatedModules);
    }
    // Handling lesson moving between modules
    else {
      const sourceModuleId = source.droppableId;
      const destModuleId = destination.droppableId;

      const sourceModule = modules.find((m) => m.id === sourceModuleId);
      const destModule = modules.find((m) => m.id === destModuleId);

      if (!sourceModule || !destModule) return;

      const sourceLessons = Array.from(sourceModule.lessons);
      const destLessons = Array.from(destModule.lessons);

      const [movedLesson] = sourceLessons.splice(source.index, 1);
      destLessons.splice(destination.index, 0, movedLesson);

      const updatedModules = modules.map((m) => {
        if (m.id === sourceModuleId) {
          return { ...m, lessons: sourceLessons };
        }
        if (m.id === destModuleId) {
          return { ...m, lessons: destLessons };
        }
        return m;
      });

      setModules(updatedModules);
    }
  };

  const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      case "AUDIO":
        return <Music className="h-4 w-4" />;
      case "TEXT":
        return <BookOpen className="h-4 w-4" />;
      case "QUIZ":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Content</h2>
          <p className="text-gray-500">
            Organize your course content into modules and lessons.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">
                Tips for organizing your content:
              </p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Group related content into modules</li>
                <li>Keep lessons focused on a single topic</li>
                <li>Set some lessons as preview to attract students</li>
                <li>Drag and drop modules and lessons to reorder them</li>
              </ul>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules" type="MODULE">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {modules.map((module, index) => (
                  <Draggable
                    key={module.id}
                    draggableId={module.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-md overflow-hidden bg-white"
                      >
                        <div className="flex items-center bg-gray-50 p-3 border-b">
                          <div
                            {...provided.dragHandleProps}
                            className="mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) =>
                              updateModuleTitle(module.id, e.target.value)
                            }
                            className="flex-1 bg-transparent border-none focus:ring-0 font-medium"
                            placeholder="Module Title"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedModule(
                                  expandedModule === module.id
                                    ? null
                                    : module.id
                                )
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {expandedModule === module.id
                                ? "Collapse"
                                : "Expand"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeModule(module.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedModule === module.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Droppable droppableId={module.id} type="LESSON">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="p-4 space-y-3"
                                  >
                                    {module.lessons.length === 0 ? (
                                      <p className="text-sm text-gray-500 text-center py-4">
                                        No lessons yet. Add your first lesson!
                                      </p>
                                    ) : (
                                      module.lessons.map((lesson, index) => (
                                        <Draggable
                                          key={lesson.id}
                                          draggableId={lesson.id}
                                          index={index}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className="flex items-center gap-3 border rounded-md p-3 bg-gray-50"
                                            >
                                              <div
                                                {...provided.dragHandleProps}
                                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                              >
                                                <GripVertical className="h-5 w-5" />
                                              </div>

                                              <div className="flex-1 space-y-3">
                                                <input
                                                  type="text"
                                                  value={lesson.title}
                                                  onChange={(e) =>
                                                    updateLesson(
                                                      module.id,
                                                      lesson.id,
                                                      { title: e.target.value }
                                                    )
                                                  }
                                                  className="w-full bg-transparent border-none focus:ring-0 font-medium"
                                                  placeholder="Lesson Title"
                                                />

                                                <div className="flex flex-wrap items-center gap-4">
                                                  <div className="flex items-center gap-2">
                                                    <label className="text-sm">
                                                      Type:
                                                    </label>
                                                    <select
                                                      value={lesson.contentType}
                                                      onChange={(e) =>
                                                        updateLesson(
                                                          module.id,
                                                          lesson.id,
                                                          {
                                                            contentType: e
                                                              .target
                                                              .value as ContentType,
                                                          }
                                                        )
                                                      }
                                                      className="text-sm border-gray-300 rounded-md"
                                                    >
                                                      <option value="VIDEO">
                                                        Video
                                                      </option>
                                                      <option value="PDF">
                                                        PDF
                                                      </option>
                                                      <option value="AUDIO">
                                                        Audio
                                                      </option>
                                                      <option value="TEXT">
                                                        Text
                                                      </option>
                                                      <option value="QUIZ">
                                                        Quiz
                                                      </option>
                                                    </select>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    <input
                                                      type="checkbox"
                                                      id={`preview-${lesson.id}`}
                                                      checked={lesson.isPreview}
                                                      onChange={(e) =>
                                                        updateLesson(
                                                          module.id,
                                                          lesson.id,
                                                          {
                                                            isPreview:
                                                              e.target.checked,
                                                          }
                                                        )
                                                      }
                                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label
                                                      htmlFor={`preview-${lesson.id}`}
                                                      className="text-sm"
                                                    >
                                                      Preview
                                                    </label>
                                                  </div>
                                                </div>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeLesson(
                                                    module.id,
                                                    lesson.id
                                                  )
                                                }
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))
                                    )}
                                    {provided.placeholder}

                                    <button
                                      type="button"
                                      onClick={() => addLesson(module.id)}
                                      className="w-full flex items-center justify-center gap-2 p-2 border border-dashed rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      <PlusCircle className="h-4 w-4" />
                                      Add Lesson
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button
          type="button"
          onClick={addModule}
          className="w-full flex items-center justify-center gap-2 p-3 border border-dashed rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <PlusCircle className="h-5 w-5" />
          Add Module
        </button>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ContentCreationForm;
