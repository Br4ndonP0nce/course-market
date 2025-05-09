// app/debug/session/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function SessionDebugPage() {
  const { user, isLoaded } = useUser();
  const [sessionData, setSessionData] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded) return;

      try {
        // Fetch session data
        const sessionResponse = await fetch("/api/debug/session");
        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          setSessionData(data);
        }

        // Fetch database users
        const dbResponse = await fetch("/api/debug/users");
        if (dbResponse.ok) {
          const data = await dbResponse.json();
          setDbUsers(data);
        }
      } catch (error) {
        console.error("Error fetching debug data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isLoaded]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading session data...</p>
        </div>
      </div>
    );
  }

  // Find current user in DB users
  const currentUserInDb =
    user && dbUsers?.users
      ? dbUsers.users.find((dbUser: any) => dbUser.clerkId === user.id)
      : null;

  // Get role from metadata - ensure it's a string
  const roleFromMetadata =
    user?.unsafeMetadata && typeof user.unsafeMetadata === "object"
      ? String(user.unsafeMetadata.role || "")
      : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Session Debug Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Clerk User Status</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">User ID:</span>{" "}
              {user?.id || "Not signed in"}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {user?.primaryEmailAddress?.emailAddress || "N/A"}
            </p>
            <p>
              <span className="font-medium">Name:</span>{" "}
              {user ? `${user.firstName || ""} ${user.lastName || ""}` : "N/A"}
            </p>
            <p>
              <span className="font-medium">Role in Metadata:</span>{" "}
              {roleFromMetadata || "Not set"}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Database User Status</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">User in Database:</span>{" "}
              {currentUserInDb ? "Yes" : "No"}
            </p>
            {currentUserInDb && (
              <>
                <p>
                  <span className="font-medium">DB User ID:</span>{" "}
                  {currentUserInDb.id}
                </p>
                <p>
                  <span className="font-medium">Role in Database:</span>{" "}
                  {currentUserInDb.role}
                </p>
                <p>
                  <span className="font-medium">Created At:</span>{" "}
                  {new Date(currentUserInDb.createdAt).toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Session Metadata Details
          </h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm">
              {sessionData
                ? JSON.stringify(sessionData, null, 2)
                : "No session data"}
            </pre>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Database Users</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm">
              {dbUsers ? JSON.stringify(dbUsers, null, 2) : "No database data"}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Diagnosis</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-100">
            <h3 className="font-medium text-lg mb-2">Authentication Status</h3>
            {user ? (
              <p className="text-green-600">
                ✓ You are authenticated with Clerk
              </p>
            ) : (
              <p className="text-red-600">
                ✗ You are not authenticated with Clerk
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-gray-100">
            <h3 className="font-medium text-lg mb-2">Role Setting Status</h3>
            {roleFromMetadata ? (
              <p className="text-green-600">
                ✓ Role is set in Clerk metadata: {roleFromMetadata}
              </p>
            ) : (
              <p className="text-red-600">✗ No role set in Clerk metadata</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-gray-100">
            <h3 className="font-medium text-lg mb-2">Database Sync Status</h3>
            {currentUserInDb ? (
              <>
                <p className="text-green-600">✓ User exists in database</p>
                {currentUserInDb.role === roleFromMetadata ? (
                  <p className="text-green-600">
                    ✓ Database role matches Clerk metadata
                  </p>
                ) : (
                  <p className="text-red-600">
                    ✗ Database role ({String(currentUserInDb.role)}) does not
                    match Clerk metadata ({roleFromMetadata})
                  </p>
                )}
              </>
            ) : (
              <p className="text-red-600">✗ User does not exist in database</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-gray-100">
            <h3 className="font-medium text-lg mb-2">Expected Behavior</h3>
            {!user && (
              <p>
                You should be redirected to sign-in page when trying to access
                protected routes.
              </p>
            )}
            {user && !roleFromMetadata && (
              <p>
                You should be redirected to onboarding page when trying to
                access protected routes.
              </p>
            )}
            {user && roleFromMetadata === "CREATOR" && (
              <p>
                You should have access to creator routes but be blocked from
                student routes.
              </p>
            )}
            {user && roleFromMetadata === "STUDENT" && (
              <p>
                You should have access to student routes but be blocked from
                creator routes.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <a
          href="/onboarding"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Onboarding
        </a>
        <a
          href="/creator/dashboard"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Try Creator Dashboard
        </a>
        <a
          href="/student/dashboard"
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Try Student Dashboard
        </a>
      </div>
    </div>
  );
}
