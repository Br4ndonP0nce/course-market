// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook/clerk',
  '/api/webhook/stripe',
  '/api/auth/(.*)',
  '/api/debug/(.*)',
  '/debug/(.*)',
  '/product(.*)',
  '/courses',
  '/pricing',
  '/about',
  '/contact',
  '/blog',
]);

// Define routes for different roles
const isCreatorRoute = createRouteMatcher(['/creator(.*)']);
const isStudentRoute = createRouteMatcher(['/student(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding']);

// Detect generic dashboard route that needs to be redirected
const isGenericDashboardRoute = createRouteMatcher(['/dashboard']);

export default clerkMiddleware(async (auth, req) => {
  // Get auth data with await
  const { userId, sessionClaims } = await auth();

  console.log(`🔒 Middleware check for URL: ${req.url}`);
  
  // Skip most checks for public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // If not logged in and not public route, redirect to sign-in
  if (!userId) {
    console.log('🔒 Redirecting to sign-in (not authenticated)');
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  
  // At this point, user is logged in
  
  // Get role from metadata
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const role = metadata?.role;
  
  console.log(`👤 User ${userId} has role in session claims: ${role || "none"}`);
  
  // Handle generic dashboard redirect
  if (isGenericDashboardRoute(req)) {
    console.log("🔄 Generic dashboard detected, redirecting...");
    
    // If role is available in session claims
    if (role) {
      if (role === "CREATOR") {
        console.log("👨‍🏫 Creator role, redirecting to creator dashboard");
        return NextResponse.redirect(new URL('/creator/dashboard', req.url));
      } else {
        console.log("👨‍🎓 Student role, redirecting to student dashboard");
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
    } else {
      // If no role in session claims, redirect to onboarding
      console.log("🆕 No role in session claims, redirecting to refresh then onboarding");
      return NextResponse.redirect(new URL('/api/auth/refresh?redirect=/onboarding', req.url));
    }
  }
  
  // If going to onboarding but already has a role, redirect to appropriate dashboard
  if (isOnboardingRoute(req) && role) {
    console.log(`User already has role ${role}, redirecting to appropriate dashboard`);
    
    if (role === "CREATOR") {
      return NextResponse.redirect(new URL('/creator/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/student/dashboard', req.url));
    }
  }
  
  // If trying to access creator routes but not a creator
  if (isCreatorRoute(req) && role !== "CREATOR") {
    console.log(`🚫 User with role ${role} trying to access creator route`);
    return NextResponse.redirect(new URL('/student/dashboard', req.url));
  }
  
  // If logged in and going to sign-in or sign-up, redirect to dashboard
  if (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up') {
    console.log('👤 Already logged in, redirecting to dashboard');
    
    if (role) {
      if (role === "CREATOR") {
        return NextResponse.redirect(new URL('/creator/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
    } else {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};