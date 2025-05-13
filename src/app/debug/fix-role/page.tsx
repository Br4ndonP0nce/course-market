// app/debug/fix-role/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FixRolePage() {
  const { user, isLoaded } = useUser();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [clerkRole, setClerkRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    async function checkRoles() {
      if (!isLoaded || !user) return;

      try {
        // Fetch session status
        const response = await fetch("/api/debug/session-status");
        const data = await response.json();

        // Extract roles
        setDbRole(data.databaseUser?.role || null);
        setClerkRole(data.clerkUserData?.unsafeMetadata?.role || null);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkRoles();
  }, [isLoaded, user]);

  const handleFixRole = async () => {
    setIsFixing(true);

    try {
      // This will handle the fix and redirect
      window.location.href = "/api/auth/fix-role";
    } catch (error) {
      console.error("Error fixing role:", error);
      setIsFixing(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Signed In</h1>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    );
  }

  const hasRoleMismatch = dbRole !== clerkRole;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">User Role Diagnostic</h1>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">User ID:</span>
            <span className="text-gray-600">{user.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Database Role:</span>
            <span
              className={`font-medium ${
                dbRole ? "text-green-600" : "text-red-600"
              }`}
            >
              {dbRole || "Not set"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Clerk Metadata Role:</span>
            <span
              className={`font-medium ${
                clerkRole ? "text-green-600" : "text-red-600"
              }`}
            >
              {clerkRole || "Not set"}
            </span>
          </div>

          <div className="pt-2 border-t">
            <div
              className={`p-3 rounded-md ${
                hasRoleMismatch
                  ? "bg-red-50 text-red-800"
                  : "bg-green-50 text-green-800"
              }`}
            >
              {hasRoleMismatch
                ? "There is a mismatch between your database role and Clerk metadata!"
                : "Your roles are synchronized correctly."}
            </div>
          </div>
        </div>

        {hasRoleMismatch && (
          <Button
            onClick={handleFixRole}
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Fix Role Mismatch"
            )}
          </Button>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p>
            This tool helps diagnose and fix issues with your user role
            synchronization between the database and Clerk authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
