import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

interface MembershipAreaFormProps {
  initialData: {
    clubName?: string;
    customUrl?: string;
    useExternalMembership?: boolean;
    externalMembershipUrl?: string;
  } | null;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const MembershipAreaForm: React.FC<MembershipAreaFormProps> = ({
  initialData,
  onSubmit,
  onBack,
}) => {
  const [form, setForm] = useState({
    clubName: initialData?.clubName || "",
    customUrl: initialData?.customUrl || "",
    useExternalMembership: initialData?.useExternalMembership || false,
    externalMembershipUrl: initialData?.externalMembershipUrl || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleToggleExternalMembership = () => {
    setForm({
      ...form,
      useExternalMembership: !form.useExternalMembership,
    });
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
          <h2 className="text-2xl font-bold">Membership Area</h2>
          <p className="text-gray-500">
            Create a space where your customers can access their purchased
            products.
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
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                The membership area is where your customers will access your
                product content after purchase. You can customize it to match
                your brand.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="clubName"
              className="block text-sm font-medium mb-1"
            >
              Membership Area Name
            </label>
            <input
              id="clubName"
              type="text"
              value={form.clubName}
              onChange={(e) => setForm({ ...form, clubName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter a name for your membership area"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a short, memorable name related to your product or brand.
            </p>
          </div>

          <div>
            <label
              htmlFor="customUrl"
              className="block text-sm font-medium mb-1"
            >
              Custom URL
            </label>
            <div className="flex items-center">
              <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-md text-gray-500">
                edicionpersuasiva.com/club/
              </span>
              <input
                id="customUrl"
                type="text"
                value={form.customUrl}
                onChange={(e) =>
                  setForm({ ...form, customUrl: e.target.value })
                }
                className="flex-1 px-3 py-2 border rounded-r-md"
                placeholder="your-club-name"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              URLs must contain at least 3 and at most 63 characters. Spaces and
              special characters are not allowed.
            </p>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium">
                  External Membership Area
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Already have a membership platform? You can use it instead.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.useExternalMembership}
                  onChange={handleToggleExternalMembership}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {form.useExternalMembership && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <label
                  htmlFor="externalUrl"
                  className="block text-sm font-medium mb-1"
                >
                  External Membership URL
                </label>
                <input
                  id="externalUrl"
                  type="url"
                  value={form.externalMembershipUrl}
                  onChange={(e) =>
                    setForm({ ...form, externalMembershipUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://your-membership-site.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full URL where your customers will access your
                  content after purchase.
                </p>
              </motion.div>
            )}
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

export default MembershipAreaForm;
