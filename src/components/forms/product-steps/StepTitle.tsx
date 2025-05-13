import React from "react";
import { motion } from "framer-motion";

interface StepTitleProps {
  step: number;
  productType: string | null;
}

const StepTitle: React.FC<StepTitleProps> = ({ step, productType }) => {
  const titles = {
    1: "Choose Product Type",
    2: "Basic Information",
    3: "Pricing and Payment",
    4: "Membership Area",
    5: `${productType === "course" ? "Course" : "Product"} Content`,
    6: "Complete Registration",
  };

  return (
    <motion.h1
      className="text-xl text-center font-bold text-gray-700"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {titles[step as keyof typeof titles] || "Create Your Product"}
    </motion.h1>
  );
};

export default StepTitle;
