import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Import step components
import ProductTypeSelection from "../forms/product-steps/productTypeSelection";
import BasicInfoForm from "../forms/product-steps/BasicInfoForm";
import PricingForm from "../forms/product-steps/PricingForm";
import MembershipAreaForm from "./product-steps/MembershipAreaForm";
import ContentCreationForm from "./product-steps/ContentCreationForm";
import RegistrationSummary from "./product-steps/RegistrationSummary";
import SuccessScreen from "./product-steps/SuccessScreen";
import StepTitle from "../forms/product-steps/StepTitle";

const ProductCreationFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState(null);
  const [formData, setFormData] = useState({
    basic: null,
    pricing: null,
    membership: null,
    content: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductTypeSelection = (type) => {
    setProductType(type);
    setStep(2);
  };

  const handleBasicInfoSubmit = (data) => {
    setFormData({ ...formData, basic: data });
    setStep(3);
  };

  const handlePricingSubmit = (data) => {
    setFormData({ ...formData, pricing: data });
    setStep(4);
  };

  const handleMembershipSubmit = (data) => {
    setFormData({ ...formData, membership: data });
    setStep(5);
  };

  const handleContentSubmit = (data) => {
    setFormData({ ...formData, content: data });
    setStep(6);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare the data for submission to API
      const productData = {
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
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    // Reset the flow and go to dashboard
    router.push("/creator/products");
  };

  // Map steps to components
  const renderStep = () => {
    switch (step) {
      case 1:
        return <ProductTypeSelection onSelect={handleProductTypeSelection} />;
      case 2:
        return (
          <BasicInfoForm
            initialData={formData.basic}
            onSubmit={handleBasicInfoSubmit}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <PricingForm
            initialData={formData.pricing}
            onSubmit={handlePricingSubmit}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <MembershipAreaForm
            initialData={formData.membership}
            onSubmit={handleMembershipSubmit}
            onBack={() => setStep(3)}
          />
        );
      case 5:
        return (
          <ContentCreationForm
            onSubmit={handleContentSubmit}
            onBack={() => setStep(4)}
          />
        );
      case 6:
        return (
          <RegistrationSummary
            formData={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(5)}
          />
        );
      case 7:
        return <SuccessScreen productData={formData} onDone={handleFinish} />;
      default:
        return <ProductTypeSelection onSelect={handleProductTypeSelection} />;
    }
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
              <span className="font-medium">Step {step}</span> of {totalSteps}
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

      {/* Step title */}
      {step < 7 && (
        <div className="mb-4">
          <StepTitle step={step} productType={productType} />
        </div>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductCreationFlow;
