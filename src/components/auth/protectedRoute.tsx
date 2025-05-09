"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("CREATOR" | "STUDENT" | "ADMIN")[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }

    if (user && allowedRoles) {
      const userRole = user.unsafeMetadata?.role as string;
      if (!allowedRoles.includes(userRole as any)) {
        router.push("/");
      }
    }
  }, [user, isLoaded, allowedRoles, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
