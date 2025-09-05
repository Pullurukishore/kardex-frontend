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

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      if (!response?.user || !response.accessToken) {
        throw new Error('Invalid login response from server');
      }

      setCookie('accessToken', response.accessToken, { path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      setCookie('refreshToken', response.refreshToken, { path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

      setAccessToken(response.accessToken);

      const safeUser: User = {
        ...response.user,
        name: response.user.name || response.user.email?.split('@')[0] || 'User',
        isActive: response.user.isActive ?? true,
        tokenVersion: response.user.tokenVersion || '0',
        lastPasswordChange: response.user.lastPasswordChange || new Date().toISOString(),
      };

      setUser(safeUser);

      // Decode the access token to get the role if not present in user object
      let userRole = safeUser.role;
      if (!userRole && response.accessToken) {
        try {
          const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
          userRole = payload.role || userRole;
        } catch (e) {
          console.warn('Failed to decode access token:', e);
        }
      }

      if (userRole) {
        setCookie('userRole', userRole, { 
          path: '/', 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days to match refresh token
        });
      } else {
        console.error('No role found in user object or JWT token');
      }

      toast.success(`Welcome back, ${safeUser.name}!`, {
        description: `You are logged in as ${safeUser.role.toLowerCase().replace('_', ' ')}`,
      });

      // Get the redirect path based on user role
      const redirectPath = getRoleBasedRedirect(safeUser.role);
      
      // Only redirect if we're not already on the correct path
      if (pathname !== redirectPath) {
        console.log(`Redirecting to: ${redirectPath}`);
        router.replace(redirectPath);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
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
      setUser(null);
      setAccessToken(null);
      deleteCookie('accessToken');
      deleteCookie('refreshToken');
      deleteCookie('userRole');
      router.replace('/auth/login');
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

      setUser(user);

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
