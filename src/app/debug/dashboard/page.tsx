// app/debug/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function DebugDashboard() {
  const { user, isLoaded } = useUser();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testUser, setTestUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch database status
        const dbResponse = await fetch("/api/debug/db-test");
        if (dbResponse.ok) {
          const data = await dbResponse.json();
          setDbStatus(data);
        } else {
          setDbStatus({ status: "error", error: `HTTP ${dbResponse.status}` });
        }

        // Fetch webhook status
        const webhookResponse = await fetch("/api/debug/webhook");
        if (webhookResponse.ok) {
          const data = await webhookResponse.json();
          setWebhookStatus(data);
        } else {
          setWebhookStatus({
            status: "error",
            error: `HTTP ${webhookResponse.status}`,
          });
        }

        // Fetch user data if available
        if (user?.id) {
          try {
            const userResponse = await fetch("/api/debug/users");
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.users) {
                const currentUser = userData.users.find(
                  (u: any) => u.clerkId === user.id
                );
                setTestUser(currentUser || { status: "not_found" });
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching debug data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Function to create a test user
  const createTestUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/debug/create-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "Test User",
          role: "STUDENT",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestUser(data.user);
        alert("Test user created successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(
          `Failed to create test user: ${
            errorData.error || response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error creating test user:", error);
      alert(
        `Error creating test user: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Debug Dashboard</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading system status...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Authentication Status
            </h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">User Logged In:</span>{" "}
                {user ? "Yes" : "No"}
              </p>
              {user && (
                <>
                  <p>
                    <span className="font-medium">Clerk User ID:</span>{" "}
                    {user.id}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      "N/A"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            {dbStatus ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Connection:</span>
                  <span
                    className={`ml-2 ${
                      dbStatus.connection === "ok"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dbStatus.connection === "ok"
                      ? "✓ Connected"
                      : "✗ Failed to connect"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">User Table:</span>
                  <span
                    className={`ml-2 ${
                      dbStatus.tableExists ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {dbStatus.tableExists ? "✓ Exists" : "✗ Not found"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Write Test:</span>
                  <span
                    className={`ml-2 ${
                      dbStatus.writeTest === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dbStatus.writeTest === "success"
                      ? "✓ Passed"
                      : `✗ ${dbStatus.writeTest || "Failed"}`}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Database URL:</span>{" "}
                  {dbStatus.databaseUrl || "N/A"}
                </p>
                {dbStatus.error && (
                  <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
                    <p className="font-medium">Error:</p>
                    <p className="text-sm mt-1">{dbStatus.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Unable to fetch database status</p>
            )}
          </div>

          {/* Webhook Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Webhook Status</h2>
            {webhookStatus ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Last Webhook Received:</span>
                  <span className="ml-2">
                    {webhookStatus.receivedAt || "None yet"}
                  </span>
                </p>

                {webhookStatus.lastPayload ? (
                  <>
                    <p>
                      <span className="font-medium">Event Type:</span>{" "}
                      {webhookStatus.lastPayload.eventType || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {webhookStatus.lastError ? "✗ Error" : "✓ Success"}
                    </p>

                    <div className="mt-4">
                      <p className="font-medium">Last Payload:</p>
                      <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-auto max-h-60">
                        {JSON.stringify(webhookStatus.lastPayload, null, 2)}
                      </pre>
                    </div>

                    {webhookStatus.lastError && (
                      <div className="mt-4">
                        <p className="font-medium">Error:</p>
                        <pre className="mt-1 p-3 bg-red-100 rounded text-sm overflow-auto max-h-60">
                          {webhookStatus.lastError}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <p>No webhook data received yet</p>
                )}
              </div>
            ) : (
              <p>Unable to fetch webhook status</p>
            )}
          </div>

          {/* User Record Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Record Status</h2>
            {user ? (
              <div className="space-y-4">
                {testUser ? (
                  <div>
                    {testUser.status === "not_found" ? (
                      <p className="text-red-600">
                        ✗ Your user record was not found in the database
                      </p>
                    ) : (
                      <>
                        <p className="text-green-600">
                          ✓ Your user record exists in the database
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <p>
                            <span className="font-medium">Database ID:</span>{" "}
                            {testUser.id}
                          </p>
                          <p>
                            <span className="font-medium">Clerk ID:</span>{" "}
                            {testUser.clerkId}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span>{" "}
                            {testUser.email}
                          </p>
                          <p>
                            <span className="font-medium">Role:</span>{" "}
                            {testUser.role}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p>User record status not available</p>
                )}

                <div className="mt-4">
                  {!testUser || testUser.status === "not_found" ? (
                    <button
                      onClick={createTestUser}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? "Creating..." : "Create Test User Record"}
                    </button>
                  ) : (
                    <p className="text-sm bg-gray-100 p-3 rounded">
                      Your user record exists in the database. If you're having
                      issues with role-based access, check the middleware
                      configuration and ensure it's properly checking roles.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p>Please log in to check your user record status</p>
            )}
          </div>

          {/* Navigation links */}
          <div className="flex justify-center space-x-4 mt-8">
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
            <a
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
