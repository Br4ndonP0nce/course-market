// middleware.ts - Update to respect nocheck parameter
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  '/become-creator',
  '/api/lessons/(.*)/processing-update',
  '/api/lessons/(.*)/processing-complete',
  '/api/lessons/(.*)/task-id',
]);

// Define routes for different roles
const isCreatorRoute = createRouteMatcher(['/creator(.*)']);
const isStudentRoute = createRouteMatcher(['/student(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding']);

// Detect generic dashboard route that needs to be redirected
const isGenericDashboardRoute = createRouteMatcher(['/dashboard']);

export default clerkMiddleware(async (auth, req) => {
  // Get auth data with await
  const { userId } = await auth();
  const url = new URL(req.url);
  
  console.log(`🔒 Middleware check for URL: ${req.url}`);
  
  // Check if nocheck parameter is present - if so, skip role checks
  const nocheck = url.searchParams.get('nocheck') === 'true';
  if (nocheck) {
    console.log('🔄 nocheck parameter detected, skipping role checks');
    // Remove the nocheck parameter for cleaner URLs
    url.searchParams.delete('nocheck');
    // Forward to the URL without the nocheck parameter
    return NextResponse.rewrite(url);
  }
  
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
  
  // Handle generic dashboard redirect
  if (isGenericDashboardRoute(req)) {
    console.log("🔄 Generic dashboard detected, redirecting to role check");
    return NextResponse.redirect(new URL('/api/auth/check-role?redirect=/dashboard', req.url));
  }
  
  // Only check creator routes - we can be permissive for student routes
  if (isCreatorRoute(req)) {
    console.log("👨‍🏫 Creator route detected, redirecting to role check");
    return NextResponse.redirect(new URL(`/api/auth/check-role?redirect=${encodeURIComponent(req.url)}`, req.url));
  }
  
  // If logged in and going to sign-in or sign-up, redirect to dashboard check
  if (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up') {
    console.log('👤 Already logged in, redirecting to dashboard');
    return NextResponse.redirect(new URL('/api/auth/check-role?redirect=/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};