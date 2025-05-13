// app/become-creator/page.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form schema with validation
const creatorFormSchema = z.object({
  inviteCode: z.string().min(1, {
    message: "Invite code is required",
  }),
  bio: z.string().min(10, {
    message: "Bio must be at least 10 characters",
  }),
  website: z
    .string()
    .url({
      message: "Please enter a valid URL",
    })
    .optional()
    .or(z.literal("")),
});

type CreatorFormValues = z.infer<typeof creatorFormSchema>;

export default function BecomeCreator() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with default values
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      inviteCode: "",
      bio: "",
      website: "",
    },
  });

  async function onSubmit(values: CreatorFormValues) {
    if (!user) {
      toast.error("You must be logged in to become a creator");
      return;
    }

    setIsLoading(true);

    try {
      // Check if the invite code is valid
      if (values.inviteCode !== process.env.NEXT_PUBLIC_CREATOR_INVITE_CODE) {
        toast.error("Invalid invite code");
        setIsLoading(false);
        return;
      }

      // Update user role to CREATOR
      const response = await fetch("/api/auth/become-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: values.bio,
          website: values.website,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to become a creator");
      }

      toast.success("You are now a creator!");

      // Force a refresh of the Clerk session before redirecting
      await fetch("/api/auth/refresh?force=true");

      // Redirect to creator dashboard after a small delay
      setTimeout(() => {
        router.push("/creator/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Error becoming creator:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Become a Creator</h1>
          <p className="text-muted-foreground mt-2">
            Fill out the form below to apply for creator status
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Invite Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your invite code"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The invite code provided to you by the platform
                    administrator
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About You</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself and your expertise"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be displayed on your creator profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your personal or professional website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
