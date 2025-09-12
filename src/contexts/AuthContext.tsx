'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, deleteCookie, setCookie } from 'cookies-next';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { UserRole, type User } from '@/types/user.types';

export type LoginResponse = {
  success: boolean;
  user?: User;
  error?: string;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    zoneId?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const coerceOptionalNumber = (value: unknown): number | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const parsed = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isNaN(parsed as number) ? undefined : (parsed as number);
  };

  const getRoleBasedRedirect = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.ZONE_USER:
        return '/zone/dashboard';
      case UserRole.SERVICE_PERSON:
        return '/service/tickets';
      default:
        return '/auth/login';
    }
  };

  const enforceRoleAccess = (role: UserRole) => {
    const allowedPath = getRoleBasedRedirect(role);
    // ❌ If user tries to access a page outside their role, redirect
    if (pathname.startsWith('/admin') && role !== UserRole.ADMIN) {
      router.replace(allowedPath);
    } else if (pathname.startsWith('/zone') && role !== UserRole.ZONE_USER) {
      router.replace(allowedPath);
    } else if (pathname.startsWith('/service') && role !== UserRole.SERVICE_PERSON) {
      router.replace(allowedPath);
    }
  };

  const loadUser = useCallback(async (): Promise<User | null> => {
    // Skip if we're already on a public route
    if (pathname.startsWith('/auth/')) {
      setIsLoading(false);
      return null;
    }
    try {
      const token = getCookie('accessToken');
      if (token) setAccessToken(token as string);

      const userData = await authService.getCurrentUser();
      if (!userData) {
        setUser(null);
        return null;
      }

      const safeUser: User = {
        ...userData,
        name: userData.name || userData.email?.split('@')[0] || 'User',
        isActive: userData.isActive ?? true,
        tokenVersion: userData.tokenVersion || '0',
        lastPasswordChange: userData.lastPasswordChange || new Date().toISOString(),
        zoneId: coerceOptionalNumber((userData as any).zoneId),
        customerId: coerceOptionalNumber((userData as any).customerId),
      };

      setUser(safeUser);

      // ✅ Sync role cookie always
      setCookie('userRole', safeUser.role, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // ✅ Enforce role access on refresh
      enforceRoleAccess(safeUser.role);

      return safeUser;
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie('accessToken');
      if (!token) {
        if (!pathname.startsWith('/auth/')) router.replace('/auth/login');
        setIsLoading(false);
        return;
      }

      try {
        const userData = await loadUser();
        if (userData && pathname.startsWith('/auth/')) {
          const redirectPath = getRoleBasedRedirect(userData.role);
          router.replace(redirectPath);
        } else if (!userData && !pathname.startsWith('/auth/')) {
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (!pathname.startsWith('/auth/')) router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, loadUser]);

  const login = async (email: string, password: string) => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      console.time('login-api-call');
      const response = await authService.login({ email, password });
      console.timeEnd('login-api-call');
      
      if (!response || !response.user || !response.accessToken) {
        console.error('Invalid login response:', response);
        throw new Error('Invalid login response from server');
      }

      console.log('Login response:', {
        hasUser: !!response.user,
        hasToken: !!response.accessToken,
        userRole: response.user?.role
      });

      // Process user data first to ensure all required fields are set
      const safeUser: User = {
        id: response.user.id,
        email: response.user.email || email,
        name: response.user.name || response.user.email?.split('@')[0] || 'User',
        role: response.user.role || 'customer', // Default to 'customer' if role is missing
        isActive: response.user.isActive ?? true,
        tokenVersion: response.user.tokenVersion || '0',
        lastPasswordChange: response.user.lastPasswordChange || new Date().toISOString(),
        // Include any additional user fields that might be needed
        ...(response.user.phone && { phone: response.user.phone }),
        ...(response.user.companyName && { companyName: response.user.companyName }),
        ...(response.user.zoneId !== undefined && { zoneId: coerceOptionalNumber((response.user as any).zoneId) }),
        ...(response.user.customerId !== undefined && { customerId: coerceOptionalNumber((response.user as any).customerId) }),
      };

      console.log('Processed user:', safeUser);

      // Set cookies with proper values
      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      console.log('Setting cookies with options:', {
        ...cookieOptions,
        accessTokenMaxAge: '15m',
        refreshTokenMaxAge: '7d',
        userRoleMaxAge: '7d',
      });

      setCookie('accessToken', response.accessToken, {
        ...cookieOptions,
        maxAge: 60 * 15, // 15 minutes to match access token TTL
      });
      
      setCookie('refreshToken', response.refreshToken || '', {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days for refresh token
      });

      // Update state
      setAccessToken(response.accessToken);
      setUser(safeUser);

      // Set role cookie
      setCookie('userRole', safeUser.role, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days to match refresh token
      });

      console.timeEnd('login-setup');
      console.log('Auth state updated', { hasToken: true, hasUser: true, isAuthenticated: true });

      // Show success message
      toast.success(`Welcome back, ${safeUser.name}!`, {
        description: `You are logged in as ${safeUser.role.toLowerCase().replace('_', ' ')}`,
      });

      // Get the redirect path based on user role
      const redirectPath = getRoleBasedRedirect(safeUser.role);
      console.log(`Login successful, redirecting to: ${redirectPath}`);
      
      // Use replace instead of push to prevent adding to browser history
      router.replace(redirectPath);
      
      console.log(`Login process completed in ${performance.now() - startTime}ms`);
      
      return { success: true, user: safeUser };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all auth-related cookies
      const cookieOptions = {
        path: '/',
        domain: window.location.hostname,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const
      };
      
      // Clear all possible auth cookies
      deleteCookie('accessToken', cookieOptions);
      deleteCookie('refreshToken', cookieOptions);
      deleteCookie('token', cookieOptions);
      deleteCookie('userRole', cookieOptions);
      
      // Clear state
      setUser(null);
      setAccessToken(null);
      
      // Force a hard redirect to login without callbackUrl
      window.location.href = '/auth/login';
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    zoneId?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user, accessToken, refreshToken } = await authService.register(userData);

      setCookie('accessToken', accessToken, { path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      setCookie('refreshToken', refreshToken, { path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

      const registeredUser: User = {
        ...user,
        zoneId: coerceOptionalNumber((user as any).zoneId),
        customerId: coerceOptionalNumber((user as any).customerId),
        tokenVersion: user.tokenVersion || '0',
        name: user.name || user.email?.split('@')[0] || 'User',
      };

      setUser(registeredUser);

      toast.success('Account created successfully!', {
        description: `Welcome to the platform, ${user.name || user.email || 'User'}!`,
      });

      router.replace(getRoleBasedRedirect(user.role));
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    return Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        hasPermission,
        clearError,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthProvider;
