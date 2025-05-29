import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Purchase {
  id: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    featuredImage?: string;
    creator: {
      name: string;
    };
  };
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/purchases");
      
      if (!response.ok) {
        throw new Error("Failed to fetch purchases");
      }

      const result = await response.json();
      setPurchases(result.purchases);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
  };
}

export function usePurchaseActions() {
  const [loading, setLoading] = useState(false);

  const createPurchase = async (productId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create purchase");
      }

      const result = await response.json();
      toast.success("Purchase initiated successfully!");
      
      return result.purchase;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completePurchase = async (purchaseId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete purchase");
      }

      const result = await response.json();
      toast.success("Purchase completed! You're now enrolled!");
      
      return result.purchase;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll in course");
      }

      toast.success("Successfully enrolled in course!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPurchase,
    completePurchase,
    enrollInCourse,
    loading,
  };
}