// src/components/uploads/VideoUploader.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface VideoUploaderProps {
  lessonId: string;
  onUploadComplete?: (videoData: any) => void;
  onUploadError?: (error: string) => void;
  currentVideoUrl?: string;
  maxSizeGB?: number;
}

interface UploadStatus {
  status:
    | "idle"
    | "uploading"
    | "uploaded"
    | "processing"
    | "completed"
    | "failed";
  progress: number;
  error?: string;
  videoQualities?: Record<string, any>;
  thumbnailUrl?: string;
  duration?: number;
}

export function VideoUploader({
  lessonId,
  onUploadComplete,
  onUploadError,
  currentVideoUrl,
  maxSizeGB = 5,
}: VideoUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: currentVideoUrl ? "completed" : "idle",
    progress: currentVideoUrl ? 100 : 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > maxSizeGB * 1024 * 1024 * 1024) {
          toast.error(`File too large. Maximum size is ${maxSizeGB}GB`);
          return;
        }
        setSelectedFile(file);
        setUploadStatus({ status: "idle", progress: 0 });
      }
    },
    [maxSizeGB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus({ status: "uploading", progress: 0 });

      // Step 1: Get pre-signed URL
      const uploadResponse = await fetch("/api/uploads/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          contentType: selectedFile.type,
          uploadType: "lesson_video",
          lessonId,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { presignedUrl, uploadId, s3Key } = await uploadResponse.json();

      // Step 2: Upload to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadStatus({ status: "uploading", progress });
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          setUploadStatus({ status: "uploaded", progress: 100 });

          // Step 3: Mark upload as complete
          try {
            const completeResponse = await fetch("/api/uploads/complete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uploadId,
                s3Key,
                uploadType: "lesson_video",
                lessonId,
              }),
            });

            if (completeResponse.ok) {
              setUploadStatus({ status: "processing", progress: 10 });
              startPollingProcessingStatus();
              toast.success(
                "Video uploaded successfully! Processing will begin shortly."
              );
            } else {
              throw new Error("Failed to complete upload");
            }
          } catch (error) {
            console.error("Error completing upload:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Upload completion failed";
            setUploadStatus({
              status: "failed",
              progress: 0,
              error: errorMessage,
            });
            onUploadError?.(errorMessage);
          }
        } else {
          throw new Error("Upload failed");
        }
      });

      xhr.addEventListener("error", () => {
        setUploadStatus({
          status: "failed",
          progress: 0,
          error: "Upload failed",
        });
        onUploadError?.("Upload failed");
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", selectedFile.type);
      xhr.send(selectedFile);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Upload error:", error);
      setUploadStatus({ status: "failed", progress: 0, error: errorMessage });
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  const startPollingProcessingStatus = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/lessons/${lessonId}/processing-status`
        );
        if (response.ok) {
          const data = await response.json();

          setUploadStatus({
            status:
              data.uploadStatus === "completed" ? "completed" : "processing",
            progress: data.processingProgress || 0,
            videoQualities: data.videoQualities,
            thumbnailUrl: data.thumbnailUrl,
            duration: data.duration,
            error: data.processingError,
          });

          if (data.uploadStatus === "completed") {
            clearInterval(pollInterval);
            onUploadComplete?.(data);
            toast.success("Video processing completed!");
          } else if (data.uploadStatus === "failed") {
            clearInterval(pollInterval);
            setUploadStatus({
              status: "failed",
              progress: 0,
              error: data.processingError,
            });
            onUploadError?.(data.processingError);
          }
        }
      } catch (error) {
        console.error("Error polling processing status:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Clear interval after 30 minutes to avoid infinite polling
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus({ status: "idle", progress: 0 });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "uploaded":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return `Uploading... ${uploadStatus.progress}%`;
      case "uploaded":
        return "Upload complete, processing will begin shortly...";
      case "processing":
        return `Processing video... ${uploadStatus.progress}%`;
      case "completed":
        return "Video ready!";
      case "failed":
        return `Failed: ${uploadStatus.error}`;
      default:
        return "Ready to upload";
    }
  };

  // If video is already uploaded and processed, show video preview
  if (uploadStatus.status === "completed" && uploadStatus.videoQualities) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span className="text-lg font-medium text-green-700">
              Video Ready
            </span>
          </div>

          {uploadStatus.thumbnailUrl && (
            <div className="relative inline-block">
              <img
                src={uploadStatus.thumbnailUrl}
                alt="Video thumbnail"
                className="max-w-sm rounded-lg shadow-md"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {Object.keys(uploadStatus.videoQualities).map((quality) => (
              <span
                key={quality}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {quality}
              </span>
            ))}
          </div>

          {uploadStatus.duration && (
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(uploadStatus.duration)}</span>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setUploadStatus({ status: "idle", progress: 0 })}
          >
            Replace Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive || dragActive
            ? "border-blue-400 bg-blue-50"
            : selectedFile
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        } ${
          uploadStatus.status === "uploading" ||
          uploadStatus.status === "processing"
            ? "pointer-events-none"
            : ""
        }`}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Upload className="h-8 w-8 text-green-500" />
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {uploadStatus.status === "idle" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {uploadStatus.status !== "idle" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <Progress value={uploadStatus.progress} className="w-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Drop your video here</p>
              <p className="text-sm text-gray-500">
                Or click to browse files (Max {maxSizeGB}GB)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: MP4, MOV, AVI, MKV, WebM
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && uploadStatus.status === "idle" && (
        <div className="flex justify-center">
          <Button onClick={handleUpload} className="px-8">
            Upload Video
          </Button>
        </div>
      )}

      {/* Processing Information */}
      {uploadStatus.status === "processing" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">Processing Your Video</p>
              <p className="text-sm text-blue-700">
                We're creating multiple quality versions of your video for the
                best streaming experience. This usually takes 2-5 minutes
                depending on the video length.
              </p>
              <div className="text-xs text-blue-600">
                • Generating 360p, 720p, and 1080p versions • Creating thumbnail
                image • Optimizing for streaming
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadStatus.status === "failed" && uploadStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-700">{uploadStatus.error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setUploadStatus({ status: "idle", progress: 0 })}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
