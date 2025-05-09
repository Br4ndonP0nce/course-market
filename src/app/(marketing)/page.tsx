// app/(marketing)/page.tsx
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TrendingCourses } from "@/components/marketing/trendingcourses";
import { Testimonials } from "@/components/marketing/trendingcourses";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Share your knowledge. <br /> Earn from your expertise.
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Create, market, and sell digital products in minutes. Join
                thousands of creators earning online.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/creator/dashboard">
                <Button size="lg" className="font-medium">
                  Start creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="lg">
                  Explore courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <div className="mb-4 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10"
                >
                  <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
                  <path d="M12 13v9" />
                  <path d="M5 13v2a2 2 0 0 0 2 2h3" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Create Once, Sell Forever
              </h3>
              <p className="text-gray-500">
                Build your digital product once and generate passive income for
                years to come.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <div className="mb-4 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Global Audience</h3>
              <p className="text-gray-500">
                Reach students from around the world and scale your impact
                beyond borders.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-8 shadow-sm">
              <div className="mb-4 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10"
                >
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Hassle-free Payments</h3>
              <p className="text-gray-500">
                Secure payment processing with instant payouts and detailed
                analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Get your digital product to market in three simple steps.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold">Create</h3>
              <p className="text-gray-500">
                Upload your content, set your price, and customize your product
                page.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold">Share</h3>
              <p className="text-gray-500">
                Share your product with your audience or leverage our
                marketplace.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold">Earn</h3>
              <p className="text-gray-500">
                Get paid instantly when customers purchase your digital
                products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Courses Section */}
      <TrendingCourses />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to start earning from your expertise?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl">
                Join thousands of creators who are monetizing their knowledge
                with CourseHub.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button variant="secondary" size="lg">
                  Start for free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
