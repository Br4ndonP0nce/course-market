//import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CreateProductForm } from "@/components/forms/createProductForm";
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

// components/dashboard/dashboard-header.tsx
interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}
