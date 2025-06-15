import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeaturedImageUploaderProps {
  productId: string;
  currentImageUrl?: string;
  onUploadComplete: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

interface UploadState {
  status: "idle" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
}

export default function FeaturedImageUploader({
  productId,
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  className = "",
}: FeaturedImageUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: currentImageUrl ? "completed" : "idle",
    progress: currentImageUrl ? 100 : 0,
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate image file
  const validateImage = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, or WebP)";
    }

    if (file.size > maxSize) {
      return "Image must be smaller than 10MB";
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      toast.error(validationError);
      onUploadError(validationError);
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadState({ status: "idle", progress: 0 });
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

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Upload image to S3
  const uploadImage = async () => {
    if (!selectedImage || !productId) return;

    setUploadState({ status: "uploading", progress: 0 });

    try {
      // Step 1: Get signed URL for image upload
      const signedUrlResponse = await fetch("/api/uploads/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedImage.name,
          fileSize: selectedImage.size,
          contentType: selectedImage.type,
          uploadType: "featured_image",
          productId,
        }),
      });

      if (!signedUrlResponse.ok) {
        const error = await signedUrlResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { presignedUrl, uploadId, s3Key } = await signedUrlResponse.json();

      // Step 2: Upload to S3
      const uploadPromise = new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState((prev) => ({ ...prev, progress }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", selectedImage.type);
        xhr.send(selectedImage);
      });

      await uploadPromise;

      // Step 3: Complete upload and get final URL
      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          s3Key,
          uploadType: "featured_image",
          productId,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload");
      }

      const finalImageUrl = `https://${
        process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_DOMAIN ||
        "d29v4wmhmft6s2.cloudfront.net"
      }/${s3Key}`;

      setUploadState({ status: "completed", progress: 100 });
      onUploadComplete(finalImageUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState({ status: "failed", progress: 0, error: errorMessage });
      onUploadError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Remove/reset image
  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(currentImageUrl || null);
    setUploadState({
      status: currentImageUrl ? "completed" : "idle",
      progress: currentImageUrl ? 100 : 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${
            dragActive
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : selectedImage || currentImageUrl
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
          ${
            uploadState.status === "uploading"
              ? "pointer-events-none"
              : "cursor-pointer"
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={
          !selectedImage && !currentImageUrl ? openFileDialog : undefined
        }
      >
        {previewUrl ? (
          // Image preview
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Featured image preview"
                className="max-w-full max-h-48 rounded-lg shadow-md object-cover"
              />
              {uploadState.status === "completed" && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-green-500 bg-white rounded-full p-0.5" />
                </div>
              )}
            </div>

            {/* File info */}
            {selectedImage && (
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {selectedImage.name}
                </p>
                <p className="text-gray-500">
                  {(selectedImage.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            )}

            {/* Upload progress */}
            {uploadState.status === "uploading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm font-medium">
                    Uploading... {uploadState.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error display */}
            {uploadState.status === "failed" && uploadState.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {uploadState.error}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center space-x-3">
              {uploadState.status === "idle" && selectedImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadImage();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Image
                </button>
              )}

              {uploadState.status !== "uploading" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {uploadState.status === "completed"
                    ? "Change Image"
                    : "Remove"}
                </button>
              )}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="space-y-4">
            <div className="text-4xl">{dragActive ? "📎" : "🖼️"}</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {dragActive ? "Drop your image here" : "Upload featured image"}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Drag and drop your image or click to browse
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Recommended: 1280x720px (16:9 aspect ratio)</div>
                <div>Formats: JPEG, PNG, WebP • Max size: 10MB</div>
              </div>
            </div>

            {!dragActive && (
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={openFileDialog}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </button>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          This image will be displayed on your course listing and product page
        </p>
      </div>
    </div>
  );
}
