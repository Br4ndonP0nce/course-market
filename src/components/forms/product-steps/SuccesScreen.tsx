import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  Share2,
  Settings,
  BookOpen,
} from "lucide-react";
import confetti from "canvas-confetti";

interface SuccessScreenProps {
  productData: {
    basic: any;
  };
  onDone: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  productData,
  onDone,
}) => {
  // Trigger confetti animation on component mount
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const colors = ["#4F46E5", "#10B981", "#3B82F6"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // More intense burst at the beginning
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center space-y-8 py-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto"
      >
        <div className="mx-auto rounded-full bg-green-100 p-3 w-20 h-20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your product has been created!</h1>
        <p className="text-xl text-gray-600">
          {productData.basic?.title || "Your new product"} is now ready to be
          published.
        </p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg text-left">
        <h2 className="text-lg font-semibold mb-3">Next steps:</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Complete your product setup</h3>
              <p className="text-sm text-gray-600">
                Add more details, configure settings, and customize your product
                page.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Upload your content</h3>
              <p className="text-sm text-gray-600">
                Add videos, PDFs, or other materials to your course or product.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1 mt-0.5">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Start promoting</h3>
              <p className="text-sm text-gray-600">
                Share your product with your audience and start making sales.
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium flex items-center justify-center gap-2"
        >
          Go to Product Dashboard
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          Create Another Product
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SuccessScreen;
