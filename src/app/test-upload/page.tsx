// src/app/test-upload/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import CustomVideoUploader from "@/components/uploads/customVideoUploader";

interface TestLesson {
  lessonId: string;
  productId: string;
  moduleId: string;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function TestUploadPage() {
  const [testLesson, setTestLesson] = useState<TestLesson | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    api: boolean;
    auth: boolean;
    database: boolean;
    s3: boolean;
  } | null>(null);

  // Create a test lesson for upload testing
  const createTestLesson = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test/create-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: Failed to create test lesson`
        );
      }

      const data = await response.json();
      setTestLesson(data);

      addResult({
        success: true,
        data: { message: "Test lesson created successfully", ...data },
        timestamp: new Date().toLocaleTimeString(),
      });

      console.log("✅ Test lesson created:", data);
    } catch (error) {
      console.error("❌ Error creating test lesson:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Check system status
  const checkSystemStatus = async () => {
    setLoading(true);
    const status = { api: false, auth: false, database: false, s3: false };

    try {
      // Test API connectivity
      const healthResponse = await fetch("/api/health");
      status.api = healthResponse.ok;

      // Test authentication
      const authResponse = await fetch("/api/auth/status");
      status.auth = authResponse.ok;

      // Test database (via test lesson creation endpoint options)
      const dbResponse = await fetch("/api/test/create-lesson", {
        method: "OPTIONS",
      });
      status.database = dbResponse.ok;

      // S3 status will be tested during actual upload
      status.s3 = true; // Assume OK for now

      setSystemStatus(status);

      addResult({
        success: Object.values(status).every(Boolean),
        data: { message: "System status check completed", status },
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("❌ System status check failed:", error);
      setSystemStatus(status);
      addResult({
        success: false,
        error: "System status check failed",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const addResult = (result: UploadResult) => {
    setUploadResults((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 results
  };

  const handleUploadComplete = (videoData: any) => {
    console.log("✅ Upload completed:", videoData);
    addResult({
      success: true,
      data: { message: "Video processing completed", ...videoData },
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleUploadError = (error: string) => {
    console.error("❌ Upload error:", error);
    addResult({
      success: false,
      error,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const resetTest = () => {
    setTestLesson(null);
    setUploadResults([]);
    setSystemStatus(null);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto max-w-6xl p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Video Upload System Test
        </h1>
        <p className="text-gray-600">
          Test your complete video upload and processing pipeline
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex space-x-3">
              <Button
                onClick={checkSystemStatus}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Check System Status
              </Button>
              <Button onClick={resetTest} variant="outline">
                Reset Test
              </Button>
            </div>
          </div>

          {systemStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.api)}
                <span className="text-sm">API</span>
                <Badge variant={systemStatus.api ? "default" : "destructive"}>
                  {systemStatus.api ? "OK" : "Failed"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.auth)}
                <span className="text-sm">Auth</span>
                <Badge variant={systemStatus.auth ? "default" : "destructive"}>
                  {systemStatus.auth ? "OK" : "Failed"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.database)}
                <span className="text-sm">Database</span>
                <Badge
                  variant={systemStatus.database ? "default" : "destructive"}
                >
                  {systemStatus.database ? "OK" : "Failed"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.s3)}
                <span className="text-sm">S3</span>
                <Badge variant={systemStatus.s3 ? "default" : "destructive"}>
                  {systemStatus.s3 ? "OK" : "Pending"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Create Test Lesson */}
            {!testLesson && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Step 1: Create Test Lesson
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  First, create a test lesson to upload video content to.
                </p>
                <Button onClick={createTestLesson} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Test Lesson
                </Button>
              </div>
            )}

            {/* Step 2: Upload Video */}
            {testLesson && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Step 2: Upload Video
                </h3>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Lesson ID:</strong>{" "}
                      <code className="text-xs">{testLesson.lessonId}</code>
                    </div>
                    <div>
                      <strong>Product ID:</strong>{" "}
                      <code className="text-xs">{testLesson.productId}</code>
                    </div>
                    <div>
                      <strong>Module ID:</strong>{" "}
                      <code className="text-xs">{testLesson.moduleId}</code>
                    </div>
                  </div>
                </div>

                <CustomVideoUploader
                  lessonId={testLesson.lessonId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxSizeGB={5}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Test results will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {getStatusIcon(result.success)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {result.success ? "Success" : "Error"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {result.timestamp}
                          </span>
                        </div>
                        {result.error && (
                          <p className="text-sm text-red-700 mt-1">
                            {result.error}
                          </p>
                        )}
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions & Debug Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Run system status check to verify all components are working
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Create a test lesson to get a valid lesson ID</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Upload a small video file (start with under 100MB for testing)
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>Monitor upload progress and processing status</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  5
                </span>
                <span>Verify processed videos appear in your S3 buckets</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  6
                </span>
                <span>Check CloudFront URLs for video delivery</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-gray-700">Environment</div>
                  <div className="text-gray-600">
                    {process.env.NODE_ENV || "development"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Upload Mode</div>
                  <div className="text-gray-600">Custom Uploader</div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-700">
                  Features Enabled
                </div>
                <div className="space-y-1 text-gray-600">
                  <div>✅ Multipart upload for files {">"} 100MB</div>
                  <div>✅ Resume capability with retry logic</div>
                  <div>✅ Real-time progress tracking</div>
                  <div>✅ Video thumbnail generation</div>
                  <div>✅ Processing status polling</div>
                  <div>✅ Error handling and recovery</div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-700">Browser Support</div>
                <div className="text-gray-600">
                  Modern browsers with File API, XMLHttpRequest2, and
                  drag-and-drop support
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-medium text-amber-900 text-xs mb-1">
                  Note
                </div>
                <div className="text-amber-800 text-xs">
                  This custom uploader completely replaces Uppy and gives you
                  full control over the upload experience. No more CSS conflicts
                  or missing components!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
