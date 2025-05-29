// src/components/dashboard/productCreationFlow.tsx - Type fixes

"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProductActions } from "@/hooks/product-actions";

// Add proper type definitions
interface BasicFormData {
  title: string;
  description: string;
  language: string;
  primaryCountry: string;
  category: string[];
  imagePreview?: string;
}

interface PricingFormData {
  currency: string;
  price: string;
  refundPeriod: string;
  paymentMethod: string;
}

interface MembershipFormData {
  clubName: string;
  customUrl: string;
  useExternalMembership: boolean;
  externalMembershipUrl?: string;
}

interface ContentFormData {
  modules: any[];
}

interface FormDataState {
  basic: BasicFormData | null;
  pricing: PricingFormData | null;
  membership: MembershipFormData | null;
  content: ContentFormData | null;
}

// Import your step components here
// import ProductTypeSelection from "../forms/product-steps/productTypeSelection";
// ... other imports

const ProductCreationFlow = () => {
  const router = useRouter();
  const { createProduct, loading: isSubmitting } = useProductActions();

  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataState>({
    basic: null,
    pricing: null,
    membership: null,
    content: null,
  });

  const handleProductTypeSelection = (type: string) => {
    setProductType(type);
    setStep(2);
  };

  const handleBasicInfoSubmit = (data: BasicFormData) => {
    setFormData({ ...formData, basic: data });
    setStep(3);
  };

  const handlePricingSubmit = (data: PricingFormData) => {
    setFormData({ ...formData, pricing: data });
    setStep(4);
  };

  const handleMembershipSubmit = (data: MembershipFormData) => {
    setFormData({ ...formData, membership: data });
    setStep(5);
  };

  const handleContentSubmit = (data: ContentFormData) => {
    setFormData({ ...formData, content: data });
    setStep(6);
  };

  const handleFinalSubmit = async () => {
    try {
      // Add null checks and provide defaults
      if (!formData.basic) {
        toast.error("Basic information is required");
        return;
      }

      if (!formData.pricing) {
        toast.error("Pricing information is required");
        return;
      }

      // Transform the form data to match API expectations
      const productData = {
        title: formData.basic.title,
        description: formData.basic.description,
        price: parseFloat(formData.pricing.price || "0"),
        category: formData.basic.category || [],
        language: formData.basic.language || "English",
        primaryCountry: formData.basic.primaryCountry || "United States",
        featuredImage: formData.basic.imagePreview || undefined,
        published: false, // Start as draft
      };

      // Create the product using the API
      const createdProduct = await createProduct(productData);

      // TODO: Handle content creation (modules/lessons) in a separate API call
      if (formData.content?.modules && formData.content.modules.length > 0) {
        console.log("Content to be created:", formData.content.modules);
        // This would be implemented in Phase 1 Week 1 of our roadmap
      }

      // Move to success screen
      setStep(7);
    } catch (error) {
      console.error("Error creating product:", error);
      // Error is already handled by the hook with toast
    }
  };

  const handleFinish = () => {
    // Reset the flow and go to dashboard
    router.push("/creator/products");
  };

  // Calculate progress
  const totalSteps = 7;
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Progress bar (hidden on success screen) */}
      {step < 7 && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <div>
              <span className="font-medium">Step {step}</span> of{" "}
              {totalSteps - 1}
            </div>
            <div>{progress}% Complete</div>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Your step components here - uncomment when you have them */}
          {/* 
          {step === 1 && (
            <ProductTypeSelection onSelect={handleProductTypeSelection} />
          )}
          {step === 2 && (
            <BasicInfoForm
              initialData={formData.basic}
              onSubmit={handleBasicInfoSubmit}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <PricingForm
              initialData={formData.pricing}
              onSubmit={handlePricingSubmit}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <MembershipAreaForm
              initialData={formData.membership}
              onSubmit={handleMembershipSubmit}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <ContentCreationForm
              onSubmit={handleContentSubmit}
              onBack={() => setStep(4)}
            />
          )}
          {step === 6 && (
            <RegistrationSummary
              formData={formData}
              isSubmitting={isSubmitting}
              onSubmit={handleFinalSubmit}
              onBack={() => setStep(5)}
            />
          )}
          {step === 7 && (
            <SuccessScreen productData={formData} onDone={handleFinish} />
          )}
          */}

          {/* Temporary placeholder */}
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Step {step}</h2>
            <p className="text-gray-600 mb-8">
              Product creation flow in progress...
            </p>
            <button
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Next Step
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductCreationFlow;
