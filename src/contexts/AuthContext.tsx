'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie, deleteCookie, setCookie } from 'cookies-next';
import { toast } from 'sonner';
import { authService, isTokenExpired } from '@/services/auth.service';
import { UserRole, type User } from '@/types/user.types';
import { isBrowser, safeLocalStorage, safeSessionStorage } from '@/lib/browser';

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
        return '/service-person/dashboard';
      default:
        return '/auth/login';
    }
  };

  const enforceRoleAccess = (role: UserRole) => {
    const allowedPath = getRoleBasedRedirect(role);
    if (pathname.startsWith('/admin') && role !== UserRole.ADMIN) router.replace(allowedPath);
    if (pathname.startsWith('/zone') && role !== UserRole.ZONE_USER) router.replace(allowedPath);
    if (pathname.startsWith('/service-person') && role !== UserRole.SERVICE_PERSON) router.replace(allowedPath);
  };

  const loadUser = useCallback(async (currentPath?: string): Promise<User | null> => {
    const pathToCheck = currentPath || pathname;
    if (pathToCheck.startsWith('/auth/')) {
      setIsLoading(false);
      return null;
    }
    try {
      const token = getCookie('accessToken') || getCookie('token');
      console.log('LoadUser - Token found:', !!token);
      if (token) setAccessToken(token as string);

      console.log('LoadUser - Calling getCurrentUser...');
      const userData = await authService.getCurrentUser();
      console.log('LoadUser - User data received:', userData);
      
      if (!userData) {
        console.log('LoadUser - No user data received');
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

      console.log('LoadUser - Safe user created:', safeUser);
      setUser(safeUser);

      setCookie('userRole', safeUser.role, {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax',
      });

      // Only enforce role access if we're not on auth pages
      if (!pathToCheck.startsWith('/auth/')) {
        console.log('LoadUser - Enforcing role access for:', safeUser.role);
        enforceRoleAccess(safeUser.role);
      }

      return safeUser;
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authCheckInProgress = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckInProgress.current) return;
      
      try {
        authCheckInProgress.current = true;
        setIsLoading(true);
        
        // If user is already set in state, don't clear it immediately
        if (user) {
          console.log('CheckAuth - User already in state:', user.email, user.role);
          setIsLoading(false);
          return;
        }
        
        const role = getCookie('userRole') as UserRole | undefined;
        console.log('CheckAuth - Role from cookie:', role);
        
        if (!role) {
          console.log('CheckAuth - No role found, checking if we have a token...');
          const token = getCookie('accessToken') || getCookie('token');
          
          if (token) {
            console.log('CheckAuth - Token found but no role, trying to load user...');
            try {
              const userData = await loadUser(pathname);
              if (userData) {
                console.log('CheckAuth - User loaded successfully from token');
                return;
              }
            } catch (err) {
              console.error('CheckAuth - Failed to load user from token:', err);
            }
          }
          
          console.log('CheckAuth - No valid authentication found');
          setUser(null);
          setAccessToken(null);
          return;
        }

        // Only proceed if we have a valid role
        if (Object.values(UserRole).includes(role)) {
          try {
            const userData = await loadUser(pathname);
            console.log('CheckAuth - User data loaded:', userData);
            
            if (userData) {
              console.log('CheckAuth - User authenticated successfully');
              return;
            }
          } catch (err) {
            console.error('CheckAuth - Failed to load user:', err);
          }
        }
        
        // If we get here, either we couldn't load user data or role was invalid
        console.log('CheckAuth - Clearing auth state due to failed validation');
        await clearAuthState();
      } catch (error) {
        console.error('Auth check error:', error);
        await clearAuthState();
      } finally {
        setIsLoading(false);
        authCheckInProgress.current = false;
      }
    };
    
    // Only run auth check in browser and if we're not on auth pages
    if (isBrowser && !pathname.startsWith('/auth/')) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      authCheckInProgress.current = false;
    };
  }, [pathname, user]);

  const clearAuthState = async () => {
    setUser(null);
    setAccessToken(null);
    setError(null);
    
    // Clear cookies
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('userRole');
    
    // Clear storage
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('refresh_token');
    safeSessionStorage.removeItem('currentUser');
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('AuthContext: Starting login process...');
      const response = await authService.login({ email, password });
      console.log('AuthContext: Login response received:', response);

      if (!response || !response.user || !response.accessToken) {
        throw new Error('Invalid login response from server');
      }

      const safeUser: User = {
        id: response.user.id,
        email: response.user.email || email,
        name: response.user.name || response.user.email?.split('@')[0] || 'User',
        role: response.user.role || 'customer',
        isActive: response.user.isActive ?? true,
        tokenVersion: response.user.tokenVersion || '0',
        lastPasswordChange: response.user.lastPasswordChange || new Date().toISOString(),
        ...(response.user.phone && { phone: response.user.phone }),
        ...(response.user.companyName && { companyName: response.user.companyName }),
        ...(response.user.zoneId !== undefined && { zoneId: coerceOptionalNumber((response.user as any).zoneId) }),
        ...(response.user.customerId !== undefined && { customerId: coerceOptionalNumber((response.user as any).customerId) }),
      };

      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax' as const,
      };

      // Set cookies
      setCookie('accessToken', response.accessToken, { ...cookieOptions, maxAge: 60 * 60 * 24 });
      setCookie('refreshToken', response.refreshToken || '', { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
      setCookie('userRole', safeUser.role, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });

      // Update state immediately to prevent race conditions
      setAccessToken(response.accessToken);
      setUser(safeUser);
      console.log('AuthContext: User state updated immediately:', safeUser);

      console.log('AuthContext: Login successful, preparing redirect...');
      
      // Show success toast
      toast.success(`Welcome back, ${safeUser.name}!`, {
        description: `You are logged in as ${safeUser.role.toLowerCase().replace('_', ' ')}`,
        duration: 3000,
      });

      // Redirect immediately without delay to prevent race conditions
      const redirectPath = getRoleBasedRedirect(safeUser.role);
      console.log('AuthContext: Redirecting to:', redirectPath);
      router.replace(redirectPath);

      return { success: true, user: safeUser };
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
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
      const cookieOptions = {
        path: '/',
        ...(typeof window !== 'undefined' && { domain: window.location.hostname }),
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax' as const,
      };

      deleteCookie('accessToken', cookieOptions);
      deleteCookie('refreshToken', cookieOptions);
      deleteCookie('userRole', cookieOptions);

      setUser(null);
      setAccessToken(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
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

      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax' as const,
      };

      setCookie('accessToken', accessToken, cookieOptions);
      setCookie('refreshToken', refreshToken, cookieOptions);

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
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthProvider;
