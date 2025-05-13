"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Import step components
import ProductTypeSelection from "../forms/product-steps/productTypeSelection";
import BasicInfoForm from "../forms/product-steps/BasicInfoForm";
import PricingForm from "../forms/product-steps/PricingForm";
import MembershipAreaForm from "../forms/product-steps/MembershipAreaForm";
import ContentCreationForm from "../forms/product-steps/ContentCreationForm";
import RegistrationSummary from "../forms/product-steps/RegistrationSummary";
import SuccessScreen from "../forms/product-steps/SuccesScreen";
import StepTitle from "../forms/product-steps/StepTitle";

const ProductCreationFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    basic: null,
    pricing: null,
    membership: null,
    content: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductTypeSelection = (type: string) => {
    setProductType(type);
    setStep(2);
  };

  const handleBasicInfoSubmit = (data: any) => {
    setFormData({ ...formData, basic: data });
    setStep(3);
  };

  const handlePricingSubmit = (data: any) => {
    setFormData({ ...formData, pricing: data });
    setStep(4);
  };

  const handleMembershipSubmit = (data: any) => {
    setFormData({ ...formData, membership: data });
    setStep(5);
  };

  const handleContentSubmit = (data: any) => {
    setFormData({ ...formData, content: data });
    setStep(6);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare the data for submission to API
      const productData = {
        type: productType,
        basic: formData.basic,
        pricing: formData.pricing,
        membership: formData.membership,
        content: formData.content,
      };

      // Submit to the API
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }

      const data = await response.json();

      toast.success("Product created successfully!");
      setStep(7);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductCreationFlow;
