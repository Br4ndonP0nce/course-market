"use client";

import React, { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { Dashboard } from "@uppy/react";
import GoldenRetriever from "@uppy/golden-retriever";
import { toast } from "sonner";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface UppyVideoUploaderProps {
  lessonId: string;
  onUploadComplete?: (videoData: any) => void;
  onUploadError?: (error: string) => void;
  maxSizeGB?: number;
  allowedFileTypes?: string[];
}

export function UppyVideoUploader({
  lessonId,
  onUploadComplete,
  onUploadError,
  maxSizeGB = 5,
  allowedFileTypes = [".mp4", ".mov", ".avi", ".mkv", ".webm"],
}: UppyVideoUploaderProps) {
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      id: `video-uploader-${lessonId}`,
      autoProceed: false,
      allowMultipleUploads: false,
      restrictions: {
        maxFileSize: maxSizeGB * 1024 * 1024 * 1024, // Convert GB to bytes
        maxNumberOfFiles: 1,
        allowedFileTypes: allowedFileTypes,
      },
      meta: {
        lessonId,
      },
    });

    // Add resume capability
    uppyInstance.use(GoldenRetriever, {
      expires: 24 * 60 * 60 * 1000, // 24 hours persistence
    });

    // Configure unified AWS S3 plugin with direct server integration (no Companion)
    uppyInstance.use(AwsS3, {
      // Automatically use multipart for files > 100MB
      shouldUseMultipart: (file: any) => {
        return file?.size ? file.size > 100 * 1024 * 1024 : false;
      },

      // Limit concurrent parts (respects browser connection limits)
      limit: 6,

      // Dynamic chunk sizing for optimal performance
      getChunkSize: (file: any) => {
        const fileSize = file?.size || 0;
        if (fileSize > 5 * 1024 * 1024 * 1024) return 100 * 1024 * 1024; // 100MB for >5GB files
        if (fileSize > 1 * 1024 * 1024 * 1024) return 50 * 1024 * 1024; // 50MB for 1-5GB files
        return 20 * 1024 * 1024; // 20MB for smaller files
      },

      // Retry strategy with exponential backoff
      retryDelays: [0, 1000, 3000, 5000, 10000],

      // Direct server integration methods (correct method names)
      async createMultipartUpload(file: any) {
        const response = await fetch("/api/s3-upload/multipart/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
            lessonId: lessonId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create multipart upload");
        }

        return response.json();
      },

      async listParts(file: any, { uploadId, key }: any) {
        const response = await fetch(
          `/api/s3-upload/multipart/list-parts?uploadId=${uploadId}&key=${encodeURIComponent(
            key
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to list parts");
        }

        return response.json();
      },

      async signPart(file: any, { uploadId, key, partNumber }: any) {
        const response = await fetch("/api/s3-upload/multipart/sign-part", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId,
            key,
            partNumber,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to sign part");
        }

        const data = await response.json();
        return { url: data.url };
      },

      async completeMultipartUpload(file: any, { uploadId, key, parts }: any) {
        const response = await fetch("/api/s3-upload/multipart/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId,
            key,
            parts,
            lessonId: lessonId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to complete multipart upload");
        }

        return response.json();
      },

      async abortMultipartUpload(file: any, { uploadId, key }: any) {
        await fetch("/api/s3-upload/multipart/abort", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploadId,
            key,
          }),
        });
      },

      // For non-multipart uploads
      async getUploadParameters(file: any) {
        const response = await fetch("/api/s3-upload/signed-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
            lessonId: lessonId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get upload parameters");
        }

        return response.json();
      },
    });

    return uppyInstance;
  });

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "completed" | "failed"
  >("idle");
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    // Upload event handlers
    uppy.on("upload-progress", (file, progress) => {
      if (file && progress) {
        console.log(`Upload progress: ${progress.percentage}%`);
      }
    });

    uppy.on("upload-success", (file, response) => {
      if (file) {
        console.log("Upload successful:", file.name);
        setUploadStatus("processing");
        toast.success("Upload complete! Processing will begin shortly.");
        startProcessingPolling();
      }
    });

    uppy.on("upload-error", (file, error) => {
      if (file) {
        console.error("Upload failed:", error);
        setUploadStatus("failed");
        toast.error(`Upload failed: ${error.message}`);
        onUploadError?.(error.message);
      }
    });

    uppy.on("file-added", (file) => {
      if (file) {
        console.log("File added:", file.name);
        const fileSize = file.size || 0;
        if (fileSize > maxSizeGB * 1024 * 1024 * 1024) {
          uppy.removeFile(file.id);
          toast.error(`File too large. Maximum size is ${maxSizeGB}GB`);
          return;
        }
      }
    });

    uppy.on("upload", () => {
      setUploadStatus("uploading");
    });

    // Network connectivity handling
    const handleOnline = () => {
      uppy.resumeAll();
      toast.success("Connection restored, resuming upload...");
    };

    const handleOffline = () => {
      uppy.pauseAll();
      toast.warning("Connection lost, upload paused...");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      uppy.destroy();
    };
  }, [uppy, maxSizeGB, onUploadError]);

  const startProcessingPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/lessons/${lessonId}/processing-status`
        );
        if (response.ok) {
          const data = await response.json();

          setProcessingProgress(data.processingProgress || 0);

          if (data.uploadStatus === "completed") {
            clearInterval(pollInterval);
            setUploadStatus("completed");
            onUploadComplete?.(data);
            toast.success("Video processing completed!");
          } else if (data.uploadStatus === "failed") {
            clearInterval(pollInterval);
            setUploadStatus("failed");
            onUploadError?.(data.processingError || "Processing failed");
          }
        }
      } catch (error) {
        console.error("Error polling processing status:", error);
      }
    }, 5000);

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading video...";
      case "processing":
        return `Processing video... ${processingProgress}%`;
      case "completed":
        return "Video ready!";
      case "failed":
        return "Upload/processing failed";
      default:
        return "Ready to upload";
    }
  };

  const uppyStyles = `
  /* Main Dashboard container */
  .uppy-Dashboard {
    border: 2px solid #e5e7eb !important;
    border-radius: 8px !important;
    background: white !important;
    min-height: 400px !important;
    position: relative !important;
    z-index: 10 !important;
  }
  
  /* Inner dashboard area */
  .uppy-Dashboard-inner {
    background: white !important;
    min-height: 400px !important;
    pointer-events: auto !important;
  }
  
  /* Drop area */
  .uppy-Dashboard-dropFilesHereHint {
    color: #374151 !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    pointer-events: none !important;
  }
  
  /* Add files area - ENABLE INTERACTIONS */
  .uppy-Dashboard-AddFiles {
    background: #f9fafb !important;
    border: 2px dashed #d1d5db !important;
    border-radius: 8px !important;
    padding: 40px !important;
    text-align: center !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  
  /* Add files title */
  .uppy-Dashboard-AddFiles-title {
    color: #374151 !important;
    font-size: 16px !important;
    margin-bottom: 16px !important;
    pointer-events: none !important;
  }
  
  /* Browse button - CRITICAL FOR CLICKS */
  .uppy-u-reset.uppy-c-btn.uppy-Dashboard-browse {
    background: #3b82f6 !important;
    color: white !important;
    border: none !important;
    padding: 12px 24px !important;
    border-radius: 6px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    position: relative !important;
    z-index: 100 !important;
  }
  
  /* Hover effects */
  .uppy-u-reset.uppy-c-btn.uppy-Dashboard-browse:hover {
    background: #2563eb !important;
  }
  
  /* Make sure everything is visible AND clickable */
  .uppy-Dashboard * {
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  /* Enable file input */
  .uppy-Dashboard input[type="file"] {
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  
  /* Drop zone interactions */
  .uppy-Dashboard-dropFilesHereHint {
    pointer-events: none !important;
  }
  
  /* Overall container interactions */
  .uppy-Dashboard-AddFiles-list,
  .uppy-Dashboard-AddFiles-info {
    pointer-events: auto !important;
  }
`;
  return (
    <div className="space-y-4 ">
      <style dangerouslySetInnerHTML={{ __html: uppyStyles }} />
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Dashboard
          uppy={uppy}
          proudlyDisplayPoweredByUppy={false}
          width="100%"
          height={400}
          theme="light"
          hideProgressAfterFinish={false}
          showSelectedFiles={true}
          showRemoveButtonAfterComplete={true}
          note={`Videos up to ${maxSizeGB}GB. Files over 100MB use chunked upload with resume capability.`}
          metaFields={[
            {
              id: "name",
              name: "Video Title",
              placeholder: "Enter video title",
            },
            {
              id: "description",
              name: "Description",
              placeholder: "Video description (optional)",
            },
          ]}
        />
        <button
          onClick={() => {
            console.log("Current files:", uppy.getFiles());
            console.log("Uppy state:", uppy.getState());
          }}
          className="bg-red-500 text-white p-2 rounded"
        >
          Debug: Show Uppy Files
        </button>
      </div>

      {/* Status Display */}
      {uploadStatus !== "idle" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {uploadStatus === "uploading" && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
            {uploadStatus === "processing" && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
            )}
            {uploadStatus === "completed" && (
              <div className="h-5 w-5 text-green-500">✓</div>
            )}
            {uploadStatus === "failed" && (
              <div className="h-5 w-5 text-red-500">✗</div>
            )}

            <div className="flex-1">
              <p className="font-medium text-sm">{getStatusMessage()}</p>
              {uploadStatus === "processing" && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Information */}
      {uploadStatus === "processing" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">
            Video Processing in Progress
          </h4>
          <div className="text-sm text-amber-800 space-y-1">
            <p>• Creating multiple quality versions (1080p, 720p, 360p)</p>
            <p>• Generating optimized thumbnail</p>
            <p>• Processing takes 3-10 minutes for most videos</p>
            <p>• You'll be notified when complete</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for token refresh
async function refreshAuthToken(): Promise<string> {
  try {
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}
