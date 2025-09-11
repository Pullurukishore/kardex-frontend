"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo =
        new URLSearchParams(window.location.search).get("redirectTo") ||
        "/dashboard";
      router.push(redirectTo);
    }
  }, [isAuthenticated, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast({
        title: "Login successful",
        description: "You will be redirected to the dashboard shortly...",
      });
      
      // Add a 2-second delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      toast({
        title: "Login failed",
        description:
          error?.response?.data?.message ||
          "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#507295]">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-lg overflow-hidden">
        {/* Header with white background */}
        <CardHeader className="text-center bg-white p-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-[#507295]">
            Kardex <span className="text-[#aac01d]">Remstar</span>
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Intelligent Storage Solutions
          </CardDescription>
        </CardHeader>

        {/* Form Section */}
        <CardContent className="p-8 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginFormValues, "email">;
                }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        className="border-gray-300 focus:ring-2 focus:ring-[#507295]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-[#507295] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        className="border-gray-300 focus:ring-2 focus:ring-[#507295]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Remember Me */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#aac01d] focus:ring-[#aac01d]"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">Remember me</FormLabel>
                  </FormItem>
                )}
              />
              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full bg-[#aac01d] text-white font-semibold py-2 rounded-md hover:bg-[#96b216] transition"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        {/* Footer */}
        <CardFooter className="bg-gray-50 p-6">
          <p className="text-center text-sm text-gray-700">
            Don’t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-[#507295] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
