// lib/hooks/use-current-user.ts
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

// Define types
interface DbUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: "CREATOR" | "STUDENT" | "ADMIN";
}

interface UserMetadata {
  role?: "CREATOR" | "STUDENT" | "ADMIN";
}

export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDbUser() {
      if (!clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setDbUser(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchDbUser();
    }
  }, [clerkUser, isLoaded]);

  // Use type assertion to safely access role
  const metadata = clerkUser?.unsafeMetadata as UserMetadata | undefined;
  const role = metadata?.role;

  return {
    clerkUser,
    dbUser,
    role,
    isLoading: !isLoaded || isLoading,
  };
}