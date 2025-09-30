"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    
    console.log('LoginPage: Starting login submission for:', values.email);
    
    try {
      const result = await login(values.email, values.password);
      
      console.log('LoginPage: Login result received:', {
        success: result.success,
        hasUser: !!result.user,
        userEmail: result.user?.email,
        error: result.error
      });
      
      if (result.success) {
        console.log('LoginPage: Login successful, showing success state');
        // Show success state before redirect
        setLoginSuccess(true);
        
        toast({
          title: "🎉 Login Successful!",
          description: "Welcome! Redirecting to dashboard...",
          duration: 3000,
        });
        
        // Keep success state visible for 2 seconds before redirect
        setTimeout(() => {
          setLoginSuccess(false);
        }, 2000);
      } else {
        console.error('LoginPage: Login failed:', result.error);
      }
    } catch (error: any) {
      console.error('LoginPage: Login exception:', error);
      toast({
        title: "Login failed",
        description:
          error?.response?.data?.message ||
          "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      console.log('LoginPage: Login submission finished');
      setIsSubmitting(false);
    }
  };

  // Show loading screen if user is already authenticated
  if (isAuthenticated && user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#507295]">
        <div className="text-center p-8">
          <div className="mb-6">
            <div className="mb-2">
              <Image
                src="/kardex.png"
                alt="Kardex Logo"
                width={200}
                height={80}
                className="mx-auto"
                priority
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Loader2 className="h-12 w-12 text-white mx-auto animate-spin" />
          </div>
          
          <p className="text-white/70 text-sm">
            Welcome! Redirecting to your dashboard...
          </p>
          
          <div className="mt-4 w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-white to-[#aac01d] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#507295] via-[#5a7ba0] to-[#4a6b8a]"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#aac01d]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#507295]/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#aac01d]/10 to-[#507295]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(172,192,29,0.1) 1px, transparent 1px),
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
          `,
          backgroundSize: '60px 60px, 40px 40px, 120px 120px',
          backgroundPosition: '0 0, 30px 30px, 0 0'
        }}></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#aac01d]/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-white/15 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#aac01d]/20 rounded-full animate-bounce" style={{ animationDelay: '3s', animationDuration: '3.5s' }}></div>
      </div>
      
      {/* Glass Morphism Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 backdrop-blur-[0.5px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Header Section */}
          <CardHeader className="text-center bg-gradient-to-b from-white to-gray-50/50 p-8 pb-6">
            <div className="mb-6">
              <Image
                src="/kardex.png"
                alt="Kardex Logo"
                width={200}
                height={80}
                className="mx-auto drop-shadow-sm"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-[#507295] mb-2">
              Welcome 
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          {/* Form Section */}
          <CardContent className="p-8 relative">
            {/* Success Overlay */}
            {loginSuccess && (
              <div className="absolute inset-0 bg-white/98 backdrop-blur-md flex items-center justify-center z-20 rounded-3xl">
                <div className="text-center p-8">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome Back!</h3>
                  <p className="text-gray-600 mb-6">Login successful. Redirecting to your dashboard...</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading Overlay */}
            {(isLoading || isSubmitting) && !loginSuccess && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-10 rounded-3xl">
                <div className="text-center p-8">
                  <div className="mb-6">
                    <div className="relative w-16 h-16 mx-auto">
                      <Loader2 className="h-16 w-16 text-[#507295] animate-spin" />
                      <div className="absolute inset-0 border-4 border-[#aac01d]/20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {isSubmitting ? "Authenticating..." : "Loading..."}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {isSubmitting 
                      ? "Verifying your credentials..." 
                      : "Preparing your dashboard..."}
                  </p>
                  <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#507295] via-[#aac01d] to-[#507295] rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-[#507295] focus:ring-0 transition-colors duration-200 bg-gray-50/50 focus:bg-white"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs text-[#507295] hover:text-[#aac01d] transition-colors duration-200 font-medium"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            type="password"
                            className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-[#507295] focus:ring-0 transition-colors duration-200 bg-gray-50/50 focus:bg-white"
                            disabled={isLoading}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Remember Me */}
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-2 border-gray-300 text-[#aac01d] focus:ring-[#aac01d] focus:ring-2 transition-colors duration-200"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-600 font-normal cursor-pointer">
                        Remember me 
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || loginSuccess}
                  className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    loginSuccess 
                      ? "bg-green-500 hover:bg-green-500 shadow-green-200" 
                      : "bg-gradient-to-r from-[#507295] to-[#aac01d] hover:from-[#4a6b8a] hover:to-[#96b216] shadow-lg hover:shadow-xl"
                  } text-white shadow-lg`}
                >
                  {loginSuccess ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Welcome Back!</span>
                    </>
                  ) : isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>{isSubmitting ? "Signing In..." : "Loading..."}</span>
                    </>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="bg-gradient-to-b from-gray-50/50 to-gray-100/50 p-6 text-center">
            <div className="w-full">
              <p className="text-sm text-gray-600">
                New to Kardex?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-[#507295] hover:text-[#aac01d] transition-colors duration-200"
                >
                  Create an account
                </Link>
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Secure login powered by advanced encryption
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-xs">
            © 2024 Kardex. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
