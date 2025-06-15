// src/components/uploads/CustomVideoUploader.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface CustomVideoUploaderProps {
  lessonId: string;
  onUploadComplete?: (videoData: any) => void;
  onUploadError?: (error: string) => void;
  maxSizeGB?: number;
  allowedFileTypes?: string[];
  className?: string;
}

interface UploadState {
  status:
    | "idle"
    | "uploading"
    | "processing"
    | "completed"
    | "failed"
    | "paused";
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  speed: number;
  timeRemaining: number;
  error?: string;
  processingProgress?: number;
}

interface VideoFile {
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
  thumbnail?: string;
}

export default function CustomVideoUploader({
  lessonId,
  onUploadComplete,
  onUploadError,
  maxSizeGB = 5,
  allowedFileTypes = [".mp4", ".mov", ".avi", ".mkv", ".webm"],
  className = "",
}: CustomVideoUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    timeRemaining: 0,
  });

  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<{
    xhr?: XMLHttpRequest;
    uploadId?: string;
    key?: string;
    parts?: any[];
    partSize?: number;
    currentPart?: number;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTime = useRef<number>(0);
  const lastProgressTime = useRef<number>(0);
  const lastProgressBytes = useRef<number>(0);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSizeGB}GB`;
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedFileTypes.includes(fileExtension)) {
      return `Invalid file type. Allowed: ${allowedFileTypes.join(", ")}`;
    }

    return null;
  };

  // Format utilities
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  // Calculate upload speed and time remaining
  const updateUploadMetrics = (uploadedBytes: number, totalBytes: number) => {
    const now = Date.now();
    const timeDiff = (now - lastProgressTime.current) / 1000;
    const bytesDiff = uploadedBytes - lastProgressBytes.current;

    if (timeDiff > 1) {
      // Update every second
      const speed = bytesDiff / timeDiff;
      const remainingBytes = totalBytes - uploadedBytes;
      const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

      setUploadState((prev) => ({
        ...prev,
        speed,
        timeRemaining,
        uploadedBytes,
        totalBytes,
      }));

      lastProgressTime.current = now;
      lastProgressBytes.current = uploadedBytes;
    }
  };

  // Create video thumbnail
  const createVideoThumbnail = (
    file: File
  ): Promise<{ thumbnail: string; duration: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.addEventListener("loadedmetadata", () => {
        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        video.currentTime = Math.min(5, video.duration / 4); // Thumbnail at 5s or 1/4 duration
      });

      video.addEventListener("seeked", () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
          resolve({ thumbnail, duration: video.duration });
        }
      });

      video.addEventListener("error", () => {
        // If we can't create thumbnail, just resolve with duration 0
        resolve({ thumbnail: "", duration: 0 });
      });

      video.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState((prev) => ({
        ...prev,
        status: "failed",
        error: validationError,
      }));
      onUploadError?.(validationError);
      toast.error(validationError);
      return;
    }

    try {
      // Create thumbnail and get duration
      const { thumbnail, duration } = await createVideoThumbnail(file);

      setSelectedVideo({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration,
        thumbnail,
      });

      setUploadState({
        status: "idle",
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        speed: 0,
        timeRemaining: 0,
      });
    } catch (error) {
      console.error("Error processing video:", error);
      setSelectedVideo({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });

      setUploadState({
        status: "idle",
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        speed: 0,
        timeRemaining: 0,
      });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // File input handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Start upload process
  const startUpload = async () => {
    if (!selectedVideo || !lessonId) return;

    const file = selectedVideo.file;
    const isLargeFile = file.size > 100 * 1024 * 1024; // 100MB threshold

    setUploadState((prev) => ({ ...prev, status: "uploading", progress: 0 }));
    uploadStartTime.current = Date.now();
    lastProgressTime.current = Date.now();
    lastProgressBytes.current = 0;

    try {
      if (isLargeFile) {
        await uploadLargeFile(file);
      } else {
        await uploadSmallFile(file);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState((prev) => ({
        ...prev,
        status: "failed",
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Small file upload (direct)
  const uploadSmallFile = async (file: File) => {
    const response = await fetch("/api/s3-upload/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        lessonId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get upload URL");
    }

    const { url, key } = await response.json();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      setCurrentUpload({ xhr });

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadState((prev) => ({ ...prev, progress }));
          updateUploadMetrics(event.loaded, event.total);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          await completeUpload(key);
          resolve(void 0);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.addEventListener("abort", () =>
        reject(new Error("Upload cancelled"))
      );

      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  // Large file multipart upload
  const uploadLargeFile = async (file: File) => {
    // Create multipart upload
    const createResponse = await fetch("/api/s3-upload/multipart/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        lessonId,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create multipart upload");
    }

    const { uploadId, key } = await createResponse.json();

    // Calculate optimal chunk size
    const partSize = Math.max(5 * 1024 * 1024, Math.ceil(file.size / 1000)); // Min 5MB, max 1000 parts
    const totalParts = Math.ceil(file.size / partSize);

    setCurrentUpload({ uploadId, key, parts: [], partSize, currentPart: 0 });

    const parts: any[] = [];
    let uploadedBytes = 0;

    // Upload parts sequentially with retry logic
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const partResult = await uploadPart(uploadId, key, partNumber, chunk);
      parts.push(partResult);

      uploadedBytes += chunk.size;
      const progress = (uploadedBytes / file.size) * 100;

      setUploadState((prev) => ({ ...prev, progress }));
      setCurrentUpload((prev) => ({ ...prev, currentPart: partNumber, parts }));
      updateUploadMetrics(uploadedBytes, file.size);
    }

    // Complete multipart upload
    const completeResponse = await fetch("/api/s3-upload/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key, parts, lessonId }),
    });

    if (!completeResponse.ok) {
      const errorData = await completeResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to complete upload");
    }

    await completeUpload(key);
  };

  // Upload single part
  const uploadPart = async (
    uploadId: string,
    key: string,
    partNumber: number,
    chunk: Blob
  ) => {
    const signResponse = await fetch("/api/s3-upload/multipart/sign-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key, partNumber }),
    });

    if (!signResponse.ok) {
      const errorData = await signResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to sign part ${partNumber}`);
    }

    const { url } = await signResponse.json();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const etag = xhr.getResponseHeader("ETag");
          resolve({ number: partNumber, etag });
        } else {
          reject(new Error(`Part ${partNumber} upload failed`));
        }
      });

      xhr.addEventListener("error", () =>
        reject(new Error(`Part ${partNumber} upload failed`))
      );
      xhr.open("PUT", url);
      xhr.send(chunk);
    });
  };

  // Complete upload and start processing
  const completeUpload = async (key: string) => {
    setUploadState((prev) => ({
      ...prev,
      status: "processing",
      processingProgress: 0,
    }));
    toast.success("Upload complete! Video processing will begin shortly.");

    // Start polling for processing status
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/lessons/${lessonId}/processing-status`
        );
        if (response.ok) {
          const data = await response.json();

          setUploadState((prev) => ({
            ...prev,
            processingProgress: data.processingProgress || 0,
          }));

          if (data.uploadStatus === "completed") {
            clearInterval(pollInterval);
            setUploadState((prev) => ({ ...prev, status: "completed" }));
            onUploadComplete?.(data);
            toast.success("Video processing completed!");
          } else if (data.uploadStatus === "failed") {
            clearInterval(pollInterval);
            setUploadState((prev) => ({
              ...prev,
              status: "failed",
              error: data.processingError,
            }));
            onUploadError?.(data.processingError);
            toast.error(`Processing failed: ${data.processingError}`);
          }
        }
      } catch (error) {
        console.error("Error polling processing status:", error);
      }
    }, 3000);

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  // Cancel upload
  const cancelUpload = async () => {
    if (currentUpload.xhr) {
      currentUpload.xhr.abort();
    }

    if (currentUpload.uploadId && currentUpload.key) {
      try {
        await fetch("/api/s3-upload/multipart/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId: currentUpload.uploadId,
            key: currentUpload.key,
          }),
        });
      } catch (error) {
        console.error("Failed to abort multipart upload:", error);
      }
    }

    setUploadState((prev) => ({ ...prev, status: "idle" }));
    setCurrentUpload({});
    toast.info("Upload cancelled");
  };

  // Remove selected file
  const removeFile = () => {
    if (uploadState.status === "uploading") {
      cancelUpload();
    }
    setSelectedVideo(null);
    setUploadState({
      status: "idle",
      progress: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      timeRemaining: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFileTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${
            dragActive
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : selectedVideo
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${
            uploadState.status === "uploading" ||
            uploadState.status === "processing"
              ? "pointer-events-none"
              : "cursor-pointer"
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={
          selectedVideo
            ? undefined
            : (e) => {
                // Only open file dialog if clicking the container itself, not child elements
                if (e.target === e.currentTarget) {
                  openFileDialog();
                }
              }
        }
      >
        {selectedVideo ? (
          // File selected view
          <div className="space-y-4">
            {/* Video preview */}
            <div className="flex items-center justify-center">
              {selectedVideo.thumbnail ? (
                <div className="relative">
                  <img
                    src={selectedVideo.thumbnail}
                    alt="Video thumbnail"
                    className="max-w-64 max-h-36 rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-64 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                  <File className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 truncate max-w-md mx-auto">
                {selectedVideo.name}
              </h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span>{formatFileSize(selectedVideo.size)}</span>
                {selectedVideo.duration && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(selectedVideo.duration)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress and status */}
            {uploadState.status !== "idle" && (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  {uploadState.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {uploadState.status === "processing" && (
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  )}
                  {uploadState.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadState.status === "failed" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}

                  <span className="font-medium">
                    {uploadState.status === "uploading" && "Uploading..."}
                    {uploadState.status === "processing" && "Processing..."}
                    {uploadState.status === "completed" && "Complete!"}
                    {uploadState.status === "failed" && "Failed"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      uploadState.status === "uploading"
                        ? "bg-blue-500"
                        : uploadState.status === "processing"
                        ? "bg-orange-500"
                        : uploadState.status === "completed"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${
                        uploadState.status === "processing"
                          ? uploadState.processingProgress || 0
                          : uploadState.progress
                      }%`,
                    }}
                  />
                </div>

                {/* Upload metrics */}
                {uploadState.status === "uploading" && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      {formatFileSize(uploadState.uploadedBytes)} /{" "}
                      {formatFileSize(uploadState.totalBytes)}
                    </span>
                    <span>
                      {formatSpeed(uploadState.speed)} •{" "}
                      {formatTime(uploadState.timeRemaining)} remaining
                    </span>
                  </div>
                )}

                {/* Processing info */}
                {uploadState.status === "processing" && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      Creating multiple quality versions for optimal streaming
                    </div>
                    <div>Progress: {uploadState.processingProgress || 0}%</div>
                  </div>
                )}

                {/* Error message */}
                {uploadState.status === "failed" && uploadState.error && (
                  <div className="text-red-600 text-sm">
                    {uploadState.error}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center space-x-3 pt-2">
              {uploadState.status === "idle" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startUpload();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Upload
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}

              {uploadState.status === "uploading" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              )}

              {(uploadState.status === "completed" ||
                uploadState.status === "failed") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Another
                </button>
              )}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="space-y-4">
            <div className="text-6xl">{dragActive ? "📁" : "🎬"}</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {dragActive ? "Drop your video here" : "Upload your video"}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your video file or click to browse
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <div>Maximum size: {maxSizeGB}GB</div>
                <div>Supported formats: {allowedFileTypes.join(", ")}</div>
                <div className="text-xs">
                  Files over 100MB automatically use resumable upload
                </div>
              </div>
            </div>

            {!dragActive && (
              <button
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click handler
                  openFileDialog();
                }}
              >
                <Upload className="h-5 w-5 mr-2" />
                Choose Video File
              </button>
            )}
          </div>
        )}
      </div>

      {/* Processing information */}
      {uploadState.status === "processing" && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Video Processing</h4>
          <div className="text-sm text-amber-800 space-y-1">
            <div>• Creating multiple quality versions (360p, 720p, 1080p)</div>
            <div>• Generating optimized thumbnail</div>
            <div>• Setting up for streaming delivery</div>
            <div>
              • Processing typically takes 2-10 minutes depending on video
              length
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
