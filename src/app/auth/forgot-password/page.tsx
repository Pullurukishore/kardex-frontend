"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api/api-client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    console.log('ForgotPasswordPage: Starting password reset request for:', values.email);
    
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: values.email
      });
      
      console.log('ForgotPasswordPage: Password reset request result:', response.data);
      
      if (response.data.success) {
        console.log('ForgotPasswordPage: Password reset email sent successfully');
        setSubmittedEmail(values.email);
        setEmailSent(true);
        
        toast({
          title: "📧 Reset Email Sent!",
          description: "Check your email for password reset instructions.",
          duration: 5000,
        });
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('ForgotPasswordPage: Password reset request failed:', error);
      toast({
        title: "Request failed",
        description:
          error?.response?.data?.message ||
          "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('ForgotPasswordPage: Password reset request finished');
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setEmailSent(false);
    setSubmittedEmail("");
    form.reset();
  };

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
        {/* Main Card */}
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
              {emailSent ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {emailSent 
                ? "We've sent password reset instructions to your email"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>

          {/* Content Section */}
          <CardContent className="p-8 relative">
            {emailSent ? (
              /* Success State */
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Email Sent Successfully!</h3>
                <p className="text-gray-600 mb-2">
                  We've sent password reset instructions to:
                </p>
                <p className="text-[#507295] font-semibold mb-6">
                  {submittedEmail}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure the email address is correct</li>
                    <li>• The link expires in 1 hour</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleBackToLogin}
                    variant="outline"
                    className="w-full h-12 font-semibold rounded-xl border-2 border-[#507295] text-[#507295] hover:bg-[#507295] hover:text-white transition-all duration-300"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Send Another Email
                  </Button>
                  
                  <Link href="/auth/login">
                    <Button
                      className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-[#507295] to-[#aac01d] hover:from-[#4a6b8a] hover:to-[#96b216] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Loading Overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-10 rounded-3xl">
                    <div className="text-center p-8">
                      <div className="mb-6">
                        <div className="relative w-16 h-16 mx-auto">
                          <Loader2 className="h-16 w-16 text-[#507295] animate-spin" />
                          <div className="absolute inset-0 border-4 border-[#aac01d]/20 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Sending Reset Email...
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Please wait while we send your password reset link
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
                                placeholder="Enter your email address"
                                type="email"
                                className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-[#507295] focus:ring-0 transition-colors duration-200 bg-gray-50/50 focus:bg-white"
                                disabled={isSubmitting}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#507295] to-[#aac01d] hover:from-[#4a6b8a] hover:to-[#96b216] text-white shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          <span>Sending Reset Email...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5 mr-2" />
                          <span>Send Reset Email</span>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="bg-gradient-to-b from-gray-50/50 to-gray-100/50 p-6 text-center">
            <div className="w-full">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-[#507295] hover:text-[#aac01d] transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Secure password reset powered by advanced encryption
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
