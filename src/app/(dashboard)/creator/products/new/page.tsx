import { CreateProductForm } from "@/components/forms/createProductForm";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import ProductCreationFlow from "@/components/dashboard/productCreationFlow";
export default function NewProductPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        heading="Create New Product"
        text="Add a new digital product to your catalog"
      />
      <div className="grid gap-4">
        <ProductCreationFlow />
      </div>
    </div>
  );
}
