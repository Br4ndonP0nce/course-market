// src/app/test-upload/page.tsx
"use client";

import { useState } from "react";
import { UppyVideoUploader } from "@/components/uploads/UppyVideoUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
console.log("UppyVideoUploader component:", UppyVideoUploader);
export default function TestUploadPage() {
  const [testLessonId, setTestLessonId] = useState<string>("");
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showUploader, setShowUploader] = useState(false);

  // Create a test lesson for upload testing
  const createTestLesson = async () => {
    try {
      const response = await fetch("/api/test/create-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create test lesson");
      }

      const data = await response.json();
      setTestLessonId(data.lessonId);
      setShowUploader(true);

      console.log("Test lesson created:", data);
    } catch (error) {
      console.error("Error creating test lesson:", error);
    }
  };

  const handleUploadComplete = (videoData: any) => {
    console.log("Upload completed:", videoData);
    setUploadResults(videoData);
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    setUploadResults({ error });
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Video Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Create Test Lesson */}
          {!showUploader && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Step 1: Create Test Lesson
              </h3>
              <Button onClick={createTestLesson}>Create Test Lesson</Button>
            </div>
          )}

          {/* Step 2: Upload Video */}
          {showUploader && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Step 2: Upload Video
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Test Lesson ID: <code>{testLessonId}</code>
              </p>

              {/* ADD DEBUG INFO */}
              <div className="bg-yellow-50 p-2 mb-4 text-sm">
                Debug: About to render UppyVideoUploader with lessonId:{" "}
                {testLessonId}
              </div>

              <div className="border-2 border-dashed border-red-300 p-4">
                <p className="text-red-600 mb-2">
                  Uploader should appear below:
                </p>
                <UppyVideoUploader
                  lessonId={testLessonId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxSizeGB={2}
                />
                <div className="border-2 border-red-500 p-4 bg-red-50">
                  <h4 className="text-red-800 font-bold">
                    Debug: Uppy Container
                  </h4>
                  <p className="text-red-600">
                    This red box should contain the Uppy interface above
                  </p>
                  <p className="text-sm">
                    If you can't see the upload interface but this red box is
                    visible, it's a CSS issue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Show Results */}
          {uploadResults && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 3: Results</h3>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(uploadResults, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-900 mb-2">
              Test Instructions:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>
                1. Click "Create Test Lesson" to generate a test lesson ID
              </li>
              <li>2. Upload a small video file (start with under 200MB)</li>
              <li>3. Monitor the console for progress and any errors</li>
              <li>4. Check your S3 buckets for uploaded files</li>
              <li>5. Verify Lambda/Fargate processing starts</li>
            </ol>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Debug Information:</h4>
            <div className="text-sm space-y-1">
              <div>Environment: {process.env.NODE_ENV}</div>
              <div>
                API Base:{" "}
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}
              </div>
              <div>Test Mode: Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
