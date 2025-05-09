// lib/auth.ts
import { auth } from "@clerk/nextjs/server";

// Define types for metadata
interface UserMetadata {
  role?: "CREATOR" | "STUDENT" | "ADMIN";
}

/**
 * Check if the current user has the specified role
 */
export async function checkRole(role: "CREATOR" | "STUDENT" | "ADMIN") {
  const { sessionClaims } = await auth();
  
  // Type assertion to help TypeScript understand the structure
  const metadata = sessionClaims?.metadata as UserMetadata | undefined;
  
  return metadata?.role === role;
}

/**
 * Get the current user's role from session claims
 */
export async function getUserRole() {
  const { sessionClaims } = await auth();
  
  // Type assertion to help TypeScript understand the structure
  const metadata = sessionClaims?.metadata as UserMetadata | undefined;
  
  return metadata?.role;
}

/**
 * Check if the user has any of the allowed roles
 */
export async function hasAllowedRole(allowedRoles: ("CREATOR" | "STUDENT" | "ADMIN")[]) {
  const { sessionClaims } = await auth();
  
  // Type assertion to help TypeScript understand the structure
  const metadata = sessionClaims?.metadata as UserMetadata | undefined;
  const userRole = metadata?.role;
  
  if (!userRole) return false;
  
  return allowedRoles.includes(userRole);
}