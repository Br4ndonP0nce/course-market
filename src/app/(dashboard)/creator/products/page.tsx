import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { ProductsTable } from "@/components/dashboard/productsTable";
import { ProductsFilter } from "@/components/dashboard/productsFilter";

export default function CreatorProductsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Products"
          text="Manage your digital products"
        />

        <Link href="/creator/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <ProductsFilter />
      <ProductsTable />
    </div>
  );
}
