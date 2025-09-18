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
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      const getRoleBasedRedirect = (role: string): string => {
        switch (role) {
          case 'ADMIN':
            return '/admin/dashboard';
          case 'ZONE_USER':
            return '/zone/dashboard';
          case 'SERVICE_PERSON':
            return '/service-person/dashboard';
          default:
            return '/auth/login';
        }
      };
      
      router.replace(getRoleBasedRedirect(user.role));
    }
  }, [isAuthenticated, user, isLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        // Show success state before redirect
        setLoginSuccess(true);
        
        toast({
          title: "🎉 Login Successful!",
          description: "Welcome back! Redirecting to dashboard...",
          duration: 3000,
        });
        
        // Keep success state visible for 2 seconds before redirect
        setTimeout(() => {
          setLoginSuccess(false);
        }, 2000);
      }
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

  // Show loading screen if user is already authenticated
  if (isAuthenticated && user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#507295]">
        <div className="text-center p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">
              Kardex <span className="text-[#aac01d]">Remstar</span>
            </h1>
            <p className="text-white/80">Intelligent Storage Solutions</p>
          </div>
          
          <div className="mb-4">
            <Loader2 className="h-12 w-12 text-white mx-auto animate-spin" />
          </div>
          
          <p className="text-white/70 text-sm">
            Welcome back! Redirecting to your dashboard...
          </p>
          
          <div className="mt-4 w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-white to-[#aac01d] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

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
        <CardContent className="p-8 bg-white relative">
          {/* Success Overlay */}
          {loginSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center p-6">
                <div className="mb-4">
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h3>
                <p className="text-gray-600 mb-4">Welcome back! Redirecting to your dashboard...</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading Overlay */}
          {(isLoading || isSubmitting) && !loginSuccess && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center p-6">
                <div className="mb-4">
                  <Loader2 className="h-16 w-16 text-[#507295] mx-auto animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isSubmitting ? "Authenticating..." : "Loading..."}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isSubmitting 
                    ? "Please wait while we verify your credentials..." 
                    : "Preparing your dashboard..."}
                </p>
                <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#507295] to-[#aac01d] rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          
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
                disabled={isLoading || isSubmitting || loginSuccess}
                className={`w-full font-semibold py-3 rounded-md transition-all duration-300 ${
                  loginSuccess 
                    ? "bg-green-500 hover:bg-green-500" 
                    : "bg-[#aac01d] hover:bg-[#96b216]"
                } text-white min-h-[48px]`}
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span className="font-medium">Login Successful!</span>
                  </>
                ) : isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span className="font-medium animate-pulse">
                      {isSubmitting ? "Authenticating..." : "Loading..."}
                    </span>
                  </>
                ) : (
                  <span className="font-medium">Sign In</span>
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
