// src/lib/hooks/use-products.ts
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  published: boolean;
  featuredImage?: string;
  categories?: string;
  language?: string;
  primaryCountry?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    purchases: number;
    modules: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  creatorOnly?: boolean;
  published?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useProducts(filters: ProductFilters = {}) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (newFilters: ProductFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const allFilters = { ...filters, ...newFilters };
      
      Object.entries(allFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
  };
}

export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const result = await response.json();
      setProduct(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

// src/lib/hooks/use-product-actions.ts


// src/lib/hooks/use-purchases.ts
