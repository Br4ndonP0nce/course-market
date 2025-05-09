"use client";

import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - this would be fetched from API in a real app
const products = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    status: "published",
    price: 9900,
    sales: 42,
    createdAt: new Date("2023-04-25"),
  },
  {
    id: "2",
    title: "Data Science Fundamentals",
    status: "published",
    price: 7900,
    sales: 28,
    createdAt: new Date("2023-06-12"),
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    status: "draft",
    price: 5900,
    sales: 0,
    createdAt: new Date("2023-09-05"),
  },
  {
    id: "4",
    title: "Photography for Beginners",
    status: "published",
    price: 4900,
    sales: 15,
    createdAt: new Date("2023-07-18"),
  },
  {
    id: "5",
    title: "Advanced React Patterns",
    status: "draft",
    price: 6900,
    sales: 0,
    createdAt: new Date("2023-10-01"),
  },
];

export function ProductsTable() {
  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-slate-50/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Title
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Status
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Price
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Sales
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Created
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b transition-colors hover:bg-slate-50/50"
              >
                <td className="p-4 align-middle font-medium">
                  {product.title}
                </td>
                <td className="p-4 align-middle">
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      product.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.status}
                  </div>
                </td>
                <td className="p-4 align-middle">
                  ${(product.price / 100).toFixed(2)}
                </td>
                <td className="p-4 align-middle">{product.sales}</td>
                <td className="p-4 align-middle">
                  {product.createdAt.toLocaleDateString()}
                </td>
                <td className="p-4 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        <Link href={`/product/${product.id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        <Link href={`/creator/products/${product.id}/edit`}>
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
