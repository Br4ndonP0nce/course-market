// app/onboarding/page.tsx - Updated version
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user already has a role when page loads
  useEffect(() => {
    async function checkUserRole() {
      if (!isLoaded || !user) return;

      setIsChecking(true);

      try {
        // Check session status
        const response = await fetch("/api/debug/session-status");
        const data = await response.json();

        console.log("Session status:", data);

        // If user already has a role in either Clerk or database
        const clerkRole = data.clerkUserData?.unsafeMetadata?.role;
        const dbRole = data.databaseUser?.role;

        if (clerkRole || dbRole) {
          console.log(`User already has role: ${clerkRole || dbRole}`);

          // If role is only in database, update Clerk
          if (dbRole && !clerkRole) {
            console.log("Syncing role from database to Clerk");
            // Use a direct API call to update role in clerk to avoid redirect
            await fetch("/api/auth/sync-role", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ role: dbRole }),
            });
          }

          // Redirect to appropriate dashboard
          const role = clerkRole || dbRole;
          if (role === "CREATOR") {
            router.replace("/creator/dashboard");
          } else {
            router.replace("/student/dashboard");
          }
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkUserRole();
  }, [isLoaded, user, router]);

  // Trigger confetti when success state changes to true
  useEffect(() => {
    if (success) {
      // Trigger confetti explosion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Use router.replace instead of window.location for a clean redirect
      const timer = setTimeout(() => {
        router.replace("/student/dashboard");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleStartLearning = async () => {
    if (!user) {
      setError("User not found. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sync with database first
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "STUDENT" }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Wait for the role to be set in the database
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Sync the role to Clerk using our new API
      const syncResponse = await fetch("/api/auth/sync-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "STUDENT" }),
      });

      if (!syncResponse.ok) {
        throw new Error("Failed to sync role");
      }

      // Set success state to trigger confetti and redirect
      setSuccess(true);
    } catch (error: any) {
      console.error("Onboarding error:", error);
      setError(`Something went wrong: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg transform transition-all">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Edicion Persuasiva!
          </h1>

          <div className="rounded-lg bg-indigo-100 p-5 mb-8">
            <img
              src="/onboarding-illustration.svg"
              alt="Learning Illustration"
              className="h-48 mx-auto mb-4"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = "none";
              }}
            />
            <h2 className="text-lg font-semibold mb-2">
              Ready to expand your knowledge?
            </h2>
            <p className="text-gray-600 mb-4">
              Your learning journey starts here. Explore our courses and grow
              your skills at your own pace.
            </p>
          </div>

          {/* Display any errors */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleStartLearning}
            disabled={isLoading || success}
            className={`w-full py-3 px-6 text-white rounded-lg font-medium text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading || success
                ? "bg-indigo-400"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Setting up your account...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                All Set! Redirecting...
              </span>
            ) : (
              "Start Learning Now"
            )}
          </button>

          <p className="mt-6 text-sm text-gray-500">
            By clicking "Start Learning Now", you're ready to begin your
            learning journey!
          </p>
        </div>
      </div>
    </div>
  );
}
