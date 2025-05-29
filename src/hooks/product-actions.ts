import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category: string[];
  language: string;
  primaryCountry: string;
  featuredImage?: string;
  published?: boolean;
}

export function useProductActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createProduct = async (data: CreateProductData) => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      const product = await response.json();
      toast.success("Product created successfully!");
      
      // Redirect to product edit page
      router.push(`/creator/products/${product.id}`);
      
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId: string, data: Partial<CreateProductData>) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      const product = await response.json();
      toast.success("Product updated successfully!");
      
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully!");
      router.push("/creator/products");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (productId: string, published: boolean) => {
    return updateProduct(productId, { published });
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    togglePublished,
    loading,
  };
}