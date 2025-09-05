import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user.types';

export const useAuthGuard = (requiredRoles?: UserRole | UserRole[], redirectPath = '/auth/login') => {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`${redirectPath}?callbackUrl=${callbackUrl}`);
      return;
    }

    // Check roles if required
    if (requiredRoles && !hasPermission(requiredRoles)) {
      // Redirect to dashboard based on user role
      const defaultPath = user?.role === UserRole.ADMIN ? '/admin/dashboard' : '/';
      router.push(defaultPath);
    }
  }, [isAuthenticated, isLoading, requiredRoles, router, redirectPath, hasPermission, user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasPermission,
  };
};

export default useAuthGuard;
