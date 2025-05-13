// app/debug/auth-data/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthDataPage() {
  const { user, isLoaded } = useUser();
  const [authData, setAuthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    async function fetchAuthData() {
      try {
        const response = await fetch("/api/debug/auth-data");
        const data = await response.json();
        setAuthData(data);
      } catch (error) {
        console.error("Error fetching auth data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuthData();
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Data Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Client-Side Data</h2>
          <div className="text-sm">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {user
                ? JSON.stringify(
                    {
                      id: user.id,
                      emailAddress: user.primaryEmailAddress?.emailAddress,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      metadata: {
                        public: user.publicMetadata,
                        unsafe: user.unsafeMetadata,
                      },
                    },
                    null,
                    2
                  )
                : "Not signed in"}
            </pre>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Server-Side Data</h2>
          <div className="text-sm">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {authData
                ? JSON.stringify(authData, null, 2)
                : "No data available"}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="text-xl font-semibold mb-4">User Role Analysis</h2>

        {authData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2">Session Claims Role</h3>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-mono">
                  {JSON.stringify(
                    authData.auth.sessionClaims?.metadata?.role
                  ) || "undefined"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2">Current User Role</h3>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-mono">
                  {JSON.stringify(authData.currentUser?.unsafeMetadata?.role) ||
                    "undefined"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2">Clerk User Role</h3>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-mono">
                  {JSON.stringify(
                    authData.clerkUserData?.unsafeMetadata?.role
                  ) || "undefined"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Button onClick={() => window.location.reload()}>Refresh Data</Button>
      </div>
    </div>
  );
}
