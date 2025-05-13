"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PricingFormProps {
  initialData: {
    currency?: string;
    refundPeriod?: string;
    paymentMethod?: string;
    price?: string;
  } | null;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

interface TaxSimulation {
  country: string;
  rate: string;
  price: string;
  tax: string;
  total: string;
}

const PricingForm: React.FC<PricingFormProps> = ({
  initialData,
  onSubmit,
  onBack,
}) => {
  const [form, setForm] = useState({
    currency: initialData?.currency || "USD",
    refundPeriod: initialData?.refundPeriod || "7",
    paymentMethod: initialData?.paymentMethod || "oneTime",
    price: initialData?.price || "",
  });

  const [showTaxSimulation, setShowTaxSimulation] = useState(!!form.price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Calculate tax simulation for demo purposes
  const calculateTax = (): TaxSimulation | null => {
    if (!form.price) return null;

    const price = parseFloat(form.price);
    const taxRate = form.currency === "USD" ? 0.1 : 0.16; // Example tax rates
    const taxAmount = price * taxRate;
    const totalPrice = price + taxAmount;

    return {
      country: form.currency === "USD" ? "United States" : "Mexico",
      rate: `${(taxRate * 100).toFixed(0)}%`,
      price: `${form.currency} ${price.toFixed(2)}`,
      tax: `${form.currency} ${taxAmount.toFixed(2)}`,
      total: `${form.currency} ${totalPrice.toFixed(2)}`,
    };
  };

  const taxSimulation = calculateTax();

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
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-gray-500">
            Define the base currency, product value, and sales strategy.
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
            <label
              htmlFor="currency"
              className="block text-sm font-medium mb-1"
            >
              Currency
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="USD">US Dollar</option>
              <option value="MXN">Mexican Peso</option>
              <option value="EUR">Euro</option>
              <option value="GBP">British Pound</option>
              <option value="BRL">Brazilian Real</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If you sell to other countries, we'll use this currency to convert
              your money
            </p>
          </div>

          <div>
            <label
              htmlFor="refundPeriod"
              className="block text-sm font-medium mb-1"
            >
              Refund request period
            </label>
            <select
              id="refundPeriod"
              value={form.refundPeriod}
              onChange={(e) =>
                setForm({ ...form, refundPeriod: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This is the time the buyer has to request a refund of your
              product. In the U.S., the minimum is 7 days, and in the European
              Union, 15 days.
            </p>
          </div>

          <div>
            <label
              htmlFor="paymentMethod"
              className="block text-sm font-medium mb-1"
            >
              Payment method
            </label>
            <select
              id="paymentMethod"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="oneTime">One-time payment</option>
              <option value="subscription">Subscription</option>
              <option value="installments">Installment payments</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Once this price is created, it will not be possible to change this
              option.
            </p>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Value
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-gray-50 text-gray-500">
                {form.currency === "USD"
                  ? "$"
                  : form.currency === "MXN"
                  ? "MX$"
                  : form.currency === "EUR"
                  ? "€"
                  : form.currency === "GBP"
                  ? "£"
                  : "R$"}
              </span>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: e.target.value });
                  if (e.target.value) {
                    setShowTaxSimulation(true);
                  } else {
                    setShowTaxSimulation(false);
                  }
                }}
                className="w-full px-3 py-2 border rounded-r-md"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {showTaxSimulation && taxSimulation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <h3 className="font-medium mb-2">Simulation</h3>
              <p className="text-sm text-gray-500 mb-2">
                Other taxes not included
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Country</th>
                      <th className="px-4 py-2 text-left">Tax Rate</th>
                      <th className="px-4 py-2 text-left">Value</th>
                      <th className="px-4 py-2 text-left">Tax</th>
                      <th className="px-4 py-2 text-left">Buyer's price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-t">
                        {taxSimulation.country}
                      </td>
                      <td className="px-4 py-2 border-t">
                        {taxSimulation.rate}
                      </td>
                      <td className="px-4 py-2 border-t">
                        {taxSimulation.price}
                      </td>
                      <td className="px-4 py-2 border-t">
                        {taxSimulation.tax}
                      </td>
                      <td className="px-4 py-2 border-t font-medium">
                        {taxSimulation.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
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

export default PricingForm;
