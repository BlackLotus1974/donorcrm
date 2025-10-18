"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// Validation schema
const signUpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    const supabase = createClient();
    setIsLoading(true);
    setAuthError(null);

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // Check if email confirmation is required
      if (signUpData?.user && !signUpData?.session) {
        // Email confirmation required - redirect to success page
        console.log('Email confirmation required, redirecting to success page');
        window.location.href = "/auth/sign-up-success";
      } else if (signUpData?.session) {
        // No email confirmation required - user is logged in
        console.log('User logged in successfully, redirecting to onboarding');
        window.location.href = "/onboarding";
      } else {
        // Something unexpected happened
        console.log('Unexpected state:', signUpData);
        setAuthError('Sign up completed but unable to log in. Please try logging in manually.');
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <h2 className="font-semibold tracking-tight text-2xl">Sign Up</h2>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  aria-label="Password"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  aria-label="Confirm Password"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {authError && (
                <p className="text-sm text-red-500" role="alert">
                  {authError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
