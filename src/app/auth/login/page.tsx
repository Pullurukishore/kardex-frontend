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
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Redirects are handled in AuthContext after login; avoid duplicate push here
  useEffect(() => {
    // no-op
  }, [isAuthenticated]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      
      // Show success state
      setLoginSuccess(true);
      
      toast({
        title: "🎉 Login Successful!",
        description: "Redirecting...",
        duration: 1500,
      });
      
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
      setLoginSuccess(false);
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
        <CardContent className="p-8 bg-white relative">
          {/* Success Overlay */}
          {loginSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Successful!</h3>
                <p className="text-gray-600">Redirecting to dashboard...</p>
                <div className="mt-4">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#507295] to-[#aac01d] rounded-full animate-pulse"></div>
                  </div>
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
                } text-white`}
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Login Successful!
                  </>
                ) : isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="animate-pulse">Signing in...</span>
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
