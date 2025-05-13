import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react";

interface BasicInfoFormProps {
  initialData: {
    title?: string;
    description?: string;
    language?: string;
    primaryCountry?: string;
    image?: File | null;
    category?: string[];
    imagePreview?: string;
  } | null;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  initialData,
  onSubmit,
  onBack,
}) => {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    language: initialData?.language || "English",
    primaryCountry: initialData?.primaryCountry || "United States",
    image: initialData?.image || null,
    category: initialData?.category || [],
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imagePreview || null
  );

  const categories = [
    "Health & Sports",
    "Finance & Investment",
    "Relationships",
    "Business & Career",
    "Spirituality",
    "Sexuality",
    "Entertainment",
    "Cooking & Gastronomy",
    "Languages",
    "Law",
    "Apps & Software",
    "Literature",
    "Home & Construction",
    "Personal Development",
    "Beauty & Fashion",
    "Animals & Plants",
    "Education",
    "Hobbies",
    "Design",
    "Internet",
    "Ecology & Environment",
    "Music & Arts",
    "Information Technology",
    "Others",
    "Digital Entrepreneurship",
  ];

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category || []
  );

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      if (selectedCategories.length < 3) {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setForm({ ...form, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm({ ...form, image: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedForm = { ...form, category: selectedCategories, imagePreview };
    onSubmit(updatedForm);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Basic Information</h2>
          <p className="text-gray-500">
            The data below is very important for your product. Fill them out
            carefully.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Product name
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your product name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be visible in all Marketplace places.
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md min-h-32"
              placeholder="Describe your product in detail"
              required
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">
                {form.description.length}/2000
              </span>
            </div>
            <p className="text-xs text-gray-500">
              This is the description of your product visible to buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium mb-1"
              >
                Product language
              </label>
              <select
                id="language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Portuguese">Portuguese</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Displayed at purchase time.
              </p>
            </div>

            <div>
              <label
                htmlFor="primaryCountry"
                className="block text-sm font-medium mb-1"
              >
                Main country for sales
              </label>
              <select
                id="primaryCountry"
                value={form.primaryCountry}
                onChange={(e) =>
                  setForm({ ...form, primaryCountry: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="United States">United States</option>
                <option value="Brazil">Brazil</option>
                <option value="Mexico">Mexico</option>
                <option value="Spain">Spain</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can also sell to other countries.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product image
            </label>
            <div className="border-2 border-dashed rounded-md p-4 text-center">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product"
                    className="max-h-48 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Drag and drop file here or
                    </p>
                    <label
                      htmlFor="file-upload"
                      className="mt-2 cursor-pointer bg-blue-50 text-blue-600 py-1 px-3 rounded-md hover:bg-blue-100"
                    >
                      Select a file
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The chosen image should be in JPG or PNG format and have a maximum
              size of 5 MB. Ideal dimensions: 600x600 pixels.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product category
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select up to 3 categories that your buyers will find your product
              more easily.
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    selectedCategories.includes(category)
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default BasicInfoForm;
