import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Video,
  FileText,
  Music,
  BookOpen,
  CheckSquare,
} from "lucide-react";

interface RegistrationSummaryProps {
  formData: {
    basic: any;
    pricing: any;
    membership: any;
    content: any;
  };
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const RegistrationSummary: React.FC<RegistrationSummaryProps> = ({
  formData,
  isSubmitting,
  onSubmit,
  onBack,
}) => {
  const { basic, pricing, membership, content } = formData;

  // Count total modules and lessons
  const totalModules = content?.modules?.length || 0;
  const totalLessons =
    content?.modules?.reduce(
      (acc: number, module: any) => acc + module.lessons.length,
      0
    ) || 0;

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "PDF":
        return <FileText className="h-4 w-4" />;
      case "AUDIO":
        return <Music className="h-4 w-4" />;
      case "TEXT":
        return <BookOpen className="h-4 w-4" />;
      case "QUIZ":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (currency: string, amount: string) => {
    const formattedAmount = parseFloat(amount).toLocaleString("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    });
    return formattedAmount;
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
          <h2 className="text-2xl font-bold">Registration Summary</h2>
          <p className="text-gray-500">
            Review your product information before publishing
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

      <div className="space-y-6">
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Please review all the information below carefully. You'll be able
              to edit most details after creating your product, but some
              settings like payment method cannot be changed later.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Basic Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Product Title</dt>
                <dd className="font-medium">
                  {basic?.title || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm">
                  {basic?.description
                    ? basic.description.length > 100
                      ? `${basic.description.substring(0, 100)}...`
                      : basic.description
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Language</dt>
                <dd>{basic?.language || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Main Market</dt>
                <dd>{basic?.primaryCountry || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Categories</dt>
                <dd>
                  {basic?.category && basic.category.length > 0
                    ? basic.category.join(", ")
                    : "None selected"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pricing Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Pricing
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Currency</dt>
                <dd className="font-medium">{pricing?.currency || "USD"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Price</dt>
                <dd className="font-medium text-lg">
                  {pricing?.price
                    ? formatCurrency(pricing.currency, pricing.price)
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Payment Method</dt>
                <dd>
                  {pricing?.paymentMethod === "oneTime"
                    ? "One-time payment"
                    : pricing?.paymentMethod === "subscription"
                    ? "Subscription"
                    : pricing?.paymentMethod === "installments"
                    ? "Installment payments"
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Refund Period</dt>
                <dd>
                  {pricing?.refundPeriod
                    ? `${pricing.refundPeriod} days`
                    : "Not specified"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Membership Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Membership Area
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Membership Area Name</dt>
                <dd className="font-medium">
                  {membership?.clubName || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Custom URL</dt>
                <dd className="text-sm break-all">
                  {membership?.customUrl
                    ? `coursehub.com/club/${membership.customUrl}`
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">External Membership</dt>
                <dd>
                  {membership?.useExternalMembership
                    ? "Yes - " +
                      (membership.externalMembershipUrl || "URL not specified")
                    : "No - Using CourseHub membership area"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Content Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Check className="text-green-500 mr-2 h-5 w-5" />
              Course Content
            </h3>

            {totalModules > 0 ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Total Modules</dt>
                  <dd className="font-medium">{totalModules}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Total Lessons</dt>
                  <dd className="font-medium">{totalLessons}</dd>
                </div>
                <div className="pt-2">
                  <dt className="text-sm text-gray-500 mb-2">
                    Content Overview
                  </dt>
                  <dd>
                    <div className="max-h-36 overflow-y-auto pr-2 space-y-3">
                      {content?.modules?.map((module: any) => (
                        <div key={module.id} className="text-sm">
                          <p className="font-medium">{module.title}</p>
                          {module.lessons.length > 0 && (
                            <ul className="mt-1 ml-4 space-y-1 text-gray-600">
                              {module.lessons.map((lesson: any) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center gap-1"
                                >
                                  {getContentTypeIcon(lesson.contentType)}
                                  <span>{lesson.title}</span>
                                  {lesson.isPreview && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-2">
                                      Preview
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No course content added yet. You can add modules and lessons
                after creating the product.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <p className="text-sm text-gray-500">
            By creating this product, you agree to our Terms of Service and
            Content Policy.
          </p>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`flex items-center px-6 py-3 rounded-md text-white font-medium ${
              isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Product...
              </>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RegistrationSummary;
