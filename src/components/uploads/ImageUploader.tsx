// src/components/uploads/ImageUploader.tsx
("use client");

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  productId?: string;
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
  aspectRatio?: string; // e.g., "16:9", "1:1", "4:3"
}

interface UploadStatus {
  status: "idle" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
  imageUrl?: string;
}

export function ImageUploader({
  productId,
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  maxSizeMB = 10,
  aspectRatio = "16:9",
}: ImageUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: currentImageUrl ? "completed" : "idle",
    progress: currentImageUrl ? 100 : 0,
    imageUrl: currentImageUrl,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
          return;
        }

        setSelectedFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        setUploadStatus({ status: "idle", progress: 0 });
      }
    },
    [maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile || !productId) return;

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
          uploadType: "featured_image",
          productId,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { presignedUrl, uploadId, s3Key } = await uploadResponse.json();

      // Step 2: Upload to S3
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadStatus({ status: "uploading", progress });
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
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
                uploadType: "featured_image",
                productId,
              }),
            });

            if (completeResponse.ok) {
              const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN}/${s3Key}`;
              setUploadStatus({
                status: "completed",
                progress: 100,
                imageUrl,
              });
              onUploadComplete?.(imageUrl);
              toast.success("Image uploaded successfully!");
            } else {
              throw new Error("Failed to complete upload");
            }
          } catch (error) {
            console.error("Error completing upload:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred";
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
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setUploadStatus({ status: "failed", progress: 0, error: errorMessage });
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(uploadStatus.imageUrl || null);
    setUploadStatus({
      status: uploadStatus.imageUrl ? "completed" : "idle",
      progress: uploadStatus.imageUrl ? 100 : 0,
      imageUrl: uploadStatus.imageUrl,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : selectedFile
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploadStatus.status === "uploading" ? "pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 rounded-lg shadow-md"
                style={{ aspectRatio: aspectRatio }}
              />
              {uploadStatus.status === "completed" && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="text-sm">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            {uploadStatus.status === "uploading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">
                    Uploading... {uploadStatus.progress}%
                  </span>
                </div>
              </div>
            )}

            {uploadStatus.status !== "uploading" && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {uploadStatus.status === "completed"
                  ? "Change Image"
                  : "Remove"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Drop your image here</p>
              <p className="text-sm text-gray-500">
                Or click to browse files (Max {maxSizeMB}MB)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: JPEG, PNG, WebP • Recommended: {aspectRatio}{" "}
                aspect ratio
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && uploadStatus.status === "idle" && (
        <div className="flex justify-center">
          <Button onClick={handleUpload} disabled={!productId}>
            Upload Image
          </Button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
