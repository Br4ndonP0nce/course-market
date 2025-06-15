"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Globe,
  Users,
  PlayCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProductStats {
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  studentCount: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  published: boolean;
  featuredImage: string | null;
  categories: string | null;
  createdAt: Date;
  updatedAt: Date;
  stats: ProductStats;
}

interface RealProductsTableProps {
  products: Product[];
}

export function RealProductsTable({ products }: RealProductsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getCompletionPercentage = (stats: ProductStats) => {
    if (stats.totalLessons === 0) return 0;
    return Math.round((stats.completedLessons / stats.totalLessons) * 100);
  };

  const getStatusBadge = (product: Product) => {
    const completionPercentage = getCompletionPercentage(product.stats);

    if (!product.published) {
      if (completionPercentage === 100 && product.stats.totalLessons > 0) {
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            Ready to Publish
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Draft
        </Badge>
      );
    }

    return <Badge className="bg-green-500 text-white">Published</Badge>;
  };

  const handleDelete = async (productId: string, productTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully");
      // Refresh the page to update the product list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublishStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      toast.success(
        `Product ${!currentStatus ? "published" : "unpublished"} successfully`
      );
      window.location.reload();
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No products yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first digital product to start building your course
            library and earning revenue.
          </p>
          <Link
            href="/creator/products/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const completionPercentage = getCompletionPercentage(
                product.stats
              );
              const categories = product.categories
                ? product.categories.split(",")
                : [];

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {product.featuredImage ? (
                          <img
                            src={product.featuredImage}
                            alt={product.title}
                            className="w-16 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-medium text-green-600">
                            {formatPrice(product.price)}
                          </span>
                          {categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {categories.slice(0, 2).map((category) => (
                                <Badge
                                  key={category}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {category.trim()}
                                </Badge>
                              ))}
                              {categories.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {getStatusBadge(product)}
                      {product.stats.totalLessons > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Content</span>
                            <span className="font-medium">
                              {completionPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <PlayCircle className="w-4 h-4" />
                        <span>
                          {product.stats.completedLessons}/
                          {product.stats.totalLessons} lessons
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDuration(product.stats.totalDuration)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.stats.totalModules} modules
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {product.stats.studentCount}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(
                            product.price * product.stats.studentCount
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.stats.studentCount} ×{" "}
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {/* Content Management */}
                      <Link
                        href={`/creator/products/${product.id}/content`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Manage Content"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>

                      {/* Edit Product */}
                      <Link
                        href={`/creator/products/${product.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* View/Preview */}
                      {product.published ? (
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Live"
                        >
                          <Globe className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/creator/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Publish/Unpublish */}
                      <button
                        onClick={() =>
                          togglePublishStatus(product.id, product.published)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          product.published
                            ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title={product.published ? "Unpublish" : "Publish"}
                      >
                        {product.published ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        disabled={
                          deletingId === product.id ||
                          product.stats.studentCount > 0
                        }
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          product.stats.studentCount > 0
                            ? "Cannot delete product with students"
                            : "Delete Product"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
