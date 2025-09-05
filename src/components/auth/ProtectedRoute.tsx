'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES, type UserRole } from '@/lib/constants';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole | UserRole[];
  redirectTo?: string;
  showUnauthorizedMessage?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/',
  showUnauthorizedMessage = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Convert allowedRoles to array if it's a single role
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Store the attempted URL for redirecting after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/auth/login') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
      }
      router.push('/auth/login');
      return;
    }

    // If no specific roles required, allow access
    if (rolesArray.length === 0 || !rolesArray[0]) {
      return;
    }

    // Check if user has any of the allowed roles
    const hasRequiredRole = user && rolesArray.includes(user.role);

    if (!hasRequiredRole) {
      if (showUnauthorizedMessage) {
        toast({
          title: 'Unauthorized',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, rolesArray, user, redirectTo, showUnauthorizedMessage]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has any of the allowed roles (if roles are specified)
  if (rolesArray.length > 0 && rolesArray[0] && (!user || !rolesArray.includes(user.role))) {
    return null; // Will be redirected by the useEffect
  }

  return <>{children}</>;
}

// Helper components for common role-based routes
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={ROLES.ADMIN}>
      {children}
    </ProtectedRoute>
  );
}

export function ServicePersonRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={ROLES.SERVICE_PERSON}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={ROLES.CUSTOMER_OWNER}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to the stored URL or home if user is already authenticated
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
