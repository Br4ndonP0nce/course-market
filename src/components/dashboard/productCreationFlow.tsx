"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  BookOpen,
  Settings,
  Eye,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import FeaturedImageUploader from "../uploads/FeaturedImageUploader";

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  category: string[];
  language: string;
  primaryCountry: string;
  featuredImage?: string;
}

type CreationStep = "details" | "image" | "content" | "publish";

export default function ProductCreationFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CreationStep>("details");
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: 0,
    category: [],
    language: "en",
    primaryCountry: "US",
  });

  const [imageUploadStatus, setImageUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "failed"
  >("idle");

  const steps = [
    { id: "details", title: "Product Details", icon: BookOpen },
    { id: "image", title: "Featured Image", icon: Upload },
    { id: "content", title: "Course Content", icon: Settings },
    { id: "publish", title: "Publish", icon: Globe },
  ];

  const categories = [
    "Video Editing",
    "Photography",
    "Graphic Design",
    "Web Development",
    "Marketing",
    "Business",
    "Music",
    "Art",
    "Writing",
    "Other",
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
  ];

  const countries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "ES", name: "Spain" },
    { code: "MX", name: "Mexico" },
  ];

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const createProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      const product = await response.json();
      setProductId(product.id);
      toast.success("Product created successfully!");
      return product;
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === "details") {
      // Validate required fields
      if (
        !formData.title?.trim() ||
        !formData.description?.trim() ||
        formData.price < 0 ||
        formData.category.length === 0
      ) {
        toast.error(
          "Please fill in all required fields: title, description, price, and at least one category"
        );
        return;
      }

      // Additional validation
      if (formData.title.trim().length < 3) {
        toast.error("Title must be at least 3 characters");
        return;
      }

      if (formData.description.trim().length < 10) {
        toast.error("Description must be at least 10 characters");
        return;
      }

      try {
        await createProduct();
        setCurrentStep("image");
      } catch (error) {
        // Error already handled in createProduct
      }
    } else if (currentStep === "image") {
      setCurrentStep("content");
    } else if (currentStep === "content") {
      setCurrentStep("publish");
    } else if (currentStep === "publish") {
      // Complete the flow - redirect to product management
      if (productId) {
        router.push(`/creator/products/${productId}/content`);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === "image") setCurrentStep("details");
    else if (currentStep === "content") setCurrentStep("image");
    else if (currentStep === "publish") setCurrentStep("content");
  };

  const handleImageUploadComplete = (imageUrl: string) => {
    updateFormData({ featuredImage: imageUrl });
    setImageUploadStatus("completed");
    toast.success("Image uploaded successfully!");
  };

  const handleImageUploadError = (error: string) => {
    setImageUploadStatus("failed");
    toast.error(`Image upload failed: ${error}`);
  };

  const getStepIndex = (step: CreationStep) =>
    steps.findIndex((s) => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "details":
        return formData.title && formData.description && formData.price >= 0;
      case "image":
        return true; // Image is optional
      case "content":
        return productId; // Product must exist
      case "publish":
        return productId;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 border-blue-500 text-white"
                      : isAccessible
                      ? "border-gray-300 text-gray-400"
                      : "border-gray-200 text-gray-300"
                  }
                `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-6 ${
                      index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === "details" && (
          <ProductDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            categories={categories}
            languages={languages}
            countries={countries}
          />
        )}

        {currentStep === "image" && (
          <ImageUploadStep
            productId={productId}
            currentImageUrl={formData.featuredImage}
            onUploadComplete={handleImageUploadComplete}
            onUploadError={handleImageUploadError}
            uploadStatus={imageUploadStatus}
            setUploadStatus={setImageUploadStatus}
          />
        )}

        {currentStep === "content" && (
          <ContentCreationStep productId={productId} />
        )}

        {currentStep === "publish" && (
          <PublishStep
            productId={productId}
            formData={formData}
            onPublished={() => router.push(`/creator/products/${productId}`)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === "details"}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          {currentStep === "publish" ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
}

// Individual Step Components
interface ProductDetailsStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  categories: string[];
  languages: Array<{ code: string; name: string }>;
  countries: Array<{ code: string; name: string }>;
}

function ProductDetailsStep({
  formData,
  updateFormData,
  categories,
  languages,
  countries,
}: ProductDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Information</h3>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="e.g., Master Video Editing in 30 Days"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Describe what students will learn in your course..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  updateFormData({ price: parseFloat(e.target.value) || 0 })
                }
                placeholder="99.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => updateFormData({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.category.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFormData({
                          category: [...formData.category, category],
                        });
                      } else {
                        updateFormData({
                          category: formData.category.filter(
                            (c) => c !== category
                          ),
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImageUploadStepProps {
  productId: string | null;
  currentImageUrl?: string;
  onUploadComplete: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
  uploadStatus: "idle" | "uploading" | "completed" | "failed";
  setUploadStatus: (
    status: "idle" | "uploading" | "completed" | "failed"
  ) => void;
}

function ImageUploadStep({
  productId,
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  uploadStatus,
  setUploadStatus,
}: ImageUploadStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Featured Image</h3>
        <p className="text-gray-600 mb-4">
          Upload a high-quality image that represents your course. This will be
          shown on course listings and product pages.
        </p>
      </div>

      {productId ? (
        <FeaturedImageUploader
          productId={productId}
          currentImageUrl={currentImageUrl}
          onUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
        />
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h4 className="font-medium text-gray-900">
                Upload featured image
              </h4>
              <p className="text-sm text-gray-500">
                Complete the previous step first
              </p>
            </div>
            <div className="text-xs text-amber-600">
              Product must be created before uploading image
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ContentCreationStepProps {
  productId: string | null;
}

function ContentCreationStep({ productId }: ContentCreationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Course Content</h3>
        <p className="text-gray-600 mb-4">
          You can add course content now or skip this step and add it later from
          your product dashboard.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              Ready to add content?
            </h4>
            <p className="text-sm text-blue-700 mb-4">
              You can now create modules and lessons for your course. Each
              lesson can include video content that will be automatically
              processed for optimal streaming.
            </p>
            {productId && (
              <a
                href={`/creator/products/${productId}/content`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Open Content Builder
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">What you can add:</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Video lessons with automatic quality optimization</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Course modules to organize your content</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Drag-and-drop reordering</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Real-time upload progress and processing status</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PublishStepProps {
  productId: string | null;
  formData: ProductFormData;
  onPublished: () => void;
}

function PublishStep({ productId, formData, onPublished }: PublishStepProps) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!productId) return;

    setPublishing(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish product");
      }

      toast.success("Product published successfully!");
      onPublished();
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("Failed to publish product");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Ready to Publish</h3>
        <p className="text-gray-600 mb-4">
          Review your course details and publish when ready. You can always make
          changes later.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Course Summary</h4>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Title:</span>{" "}
            <span className="text-gray-600">{formData.title}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Price:</span>{" "}
            <span className="text-gray-600">${formData.price}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Categories:</span>{" "}
            <span className="text-gray-600">
              {formData.category.join(", ") || "None selected"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Featured Image:</span>{" "}
            <span className="text-gray-600">
              {formData.featuredImage ? "Uploaded" : "Not uploaded"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handlePublish}
          disabled={!productId || publishing}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {publishing ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Globe className="w-5 h-5 mr-2" />
          )}
          {publishing ? "Publishing..." : "Publish Course"}
        </button>

        {productId && (
          <a
            href={`/creator/products/${productId}`}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </a>
        )}
      </div>
    </div>
  );
}
