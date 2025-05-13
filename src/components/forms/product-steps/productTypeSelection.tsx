import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Book, Package, Users } from "lucide-react";

interface ProductTypeSelectionProps {
  onSelect: (type: string) => void;
}

const ProductTypeSelection: React.FC<ProductTypeSelectionProps> = ({
  onSelect,
}) => {
  const productTypes = [
    {
      id: "course",
      icon: <BookOpen className="h-12 w-12 text-blue-500" />,
      title: "Online Course",
      description:
        "Your lessons and other materials in a structured environment",
    },
    {
      id: "subscription",
      icon: <Users className="h-12 w-12 text-green-500" />,
      title: "Subscription",
      description: "Subscription for online course and membership area",
    },
    {
      id: "ebook",
      icon: <Book className="h-12 w-12 text-purple-500" />,
      title: "eBook",
      description: "Your book or text in PDF or ePub format",
    },
    {
      id: "physical",
      icon: <Package className="h-12 w-12 text-orange-500" />,
      title: "Physical Product",
      description: "Books or other complementary items",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What would you like to sell?</h1>
        <p className="text-gray-500">Choose a format to create your product</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {productTypes.map((type) => (
          <motion.div
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(type.id)}
            className="cursor-pointer border rounded-lg p-6 hover:border-blue-500 transition-colors flex flex-col items-center text-center"
          >
            <div className="rounded-full bg-blue-50 p-4 mb-4">{type.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
            <p className="text-gray-500">{type.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProductTypeSelection;
