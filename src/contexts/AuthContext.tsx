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

// Manual cookie helpers as fallback
const manualGetCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

const manualSetCookie = (name: string, value: string, options: any = {}) => {
  if (typeof document === 'undefined') return;
  
  // Try multiple cookie setting approaches for maximum compatibility
  const approaches = [
    // Approach 1: Simple cookie with minimal options
    () => {
      document.cookie = `${name}=${value}; path=/`;
      console.log('ManualSetCookie - Approach 1 (simple):', `${name}=${value}; path=/`);
    },
    
    // Approach 2: Cookie with expiration
    () => {
      const expires = new Date(Date.now() + (options.maxAge || 86400) * 1000);
      document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}`;
      console.log('ManualSetCookie - Approach 2 (with expires):', `${name}=${value}; path=/; expires=${expires.toUTCString()}`);
    },
    
    // Approach 3: Full options (original)
    () => {
      let cookieString = `${name}=${value}`;
      if (options.path) cookieString += `; path=${options.path}`;
      if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (!options.secure) cookieString += ``; // Skip secure in development
      if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
      document.cookie = cookieString;
      console.log('ManualSetCookie - Approach 3 (full options):', cookieString);
    }
  ];
  
  // Try each approach and check if cookies are set
  for (let i = 0; i < approaches.length; i++) {
    try {
      approaches[i]();
      // Check if cookie was set
      setTimeout(() => {
        if (document.cookie.includes(`${name}=`)) {
          console.log(`ManualSetCookie - Success with approach ${i + 1}`);
          return;
        } else if (i === approaches.length - 1) {
          console.error('ManualSetCookie - All approaches failed, cookies not persisting');
          // Try localStorage as absolute fallback
          localStorage.setItem(`cookie_${name}`, value);
          console.log(`ManualSetCookie - Stored in localStorage as fallback: cookie_${name}`);
        }
      }, 10);
    } catch (error) {
      console.error(`ManualSetCookie - Approach ${i + 1} failed:`, error);
    }
  }
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

  const loadUser = useCallback(async (currentPath?: string): Promise<User | null> => {
    const pathToCheck = currentPath || pathname;
    if (pathToCheck.startsWith('/auth/')) {
      return null;
    }
    try {
      const token = getCookie('accessToken') || getCookie('token') || 
                   manualGetCookie('accessToken') || manualGetCookie('token') ||
                   localStorage.getItem('cookie_accessToken');
      console.log('LoadUser - Token found:', !!token);
      
      if (!token) {
        console.log('LoadUser - No token available');
        return null;
      }

      console.log('LoadUser - Calling getCurrentUser...');
      const userData = await authService.getCurrentUser();
      console.log('LoadUser - User data received:', userData);
      
      if (!userData || !userData.email) {
        console.log('LoadUser - Invalid user data received');
        return null;
      }

      // Ensure consistent name handling with better validation
      let userName = userData.name?.trim();
      
      // Check if name is valid and not a placeholder
      if (!userName || userName === '' || userName === 'null' || userName === 'undefined' || userName === 'User') {
        userName = userData.email?.split('@')[0] || 'User';
      }
      
      console.log('LoadUser - User name processing:', {
        originalName: userData.name,
        processedName: userName,
        email: userData.email
      });
      
      const safeUser: User = {
        ...userData,
        name: userName,
        isActive: userData.isActive ?? true,
        tokenVersion: userData.tokenVersion || '0',
        lastPasswordChange: userData.lastPasswordChange || new Date().toISOString(),
        zoneId: coerceOptionalNumber((userData as any).zoneId),
        customerId: coerceOptionalNumber((userData as any).customerId),
      };

      console.log('LoadUser - Safe user created:', { email: safeUser.email, name: safeUser.name, role: safeUser.role });
      
      // Update state immediately to prevent race conditions
      setUser(safeUser);
      setAccessToken(token as string);

      // Store user role in cookie for persistence
      setCookie('userRole', safeUser.role, {
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Role-based access is now handled by server-side layout and middleware
      // Removed client-side enforceRoleAccess to prevent render-time redirects

      return safeUser;
    } catch (err) {
      console.error('Failed to load user:', err);
      // Don't clear user state here, let the caller handle it
      throw err;
    }
  }, [pathname]);

  const authCheckInProgress = useRef(false);
  const initialAuthCheck = useRef(false);
  const lastValidUser = useRef<User | null>(null);
  const isInitializing = useRef(true);

  // Initialize user from cookies on mount to prevent flash
  useEffect(() => {
    const initializeAuth = () => {
      if (!isBrowser) {
        isInitializing.current = false;
        return;
      }
      
      console.log('InitAuth - Starting initialization...');
      
      // Try multiple cookie retrieval methods including localStorage fallback
      const token = getCookie('accessToken') || getCookie('token') || 
                   manualGetCookie('accessToken') || manualGetCookie('token') ||
                   localStorage.getItem('cookie_accessToken');
      const role = (getCookie('userRole') || manualGetCookie('userRole') || 
                   localStorage.getItem('cookie_userRole')) as UserRole | undefined;
      
      // Debug all cookies
      if (typeof document !== 'undefined') {
        console.log('InitAuth - All cookies:', document.cookie);
      }
      
      console.log('InitAuth - Token:', !!token, 'Role:', role);
      console.log('InitAuth - Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      // If we have both token and role, try to restore user state immediately
      if (token && role) {
        console.log('InitAuth - Restoring user state from cookies');
        // Try to get cached user from session storage first
        const cachedUser = safeSessionStorage.getItem('currentUser');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (parsedUser && parsedUser.email && parsedUser.role === role) {
              console.log('InitAuth - Restored user from session storage:', parsedUser.email, parsedUser.name, parsedUser.role);
              setUser(parsedUser);
              setAccessToken(token as string);
              lastValidUser.current = parsedUser;
              // Set loading to false immediately since we have cached data
              setIsLoading(false);
              isInitializing.current = false;
              return;
            }
          } catch (e) {
            console.error('InitAuth - Failed to parse cached user:', e);
          }
        }
        
        // If no cached user but we have token and role, create a minimal user object
        // This prevents the flash of "User" before the real data loads
        console.log('InitAuth - No cached user, but have token and role');
        setAccessToken(token as string);
      }
      
      isInitializing.current = false;
    };
    
    initializeAuth();
  }, []); // Run only once on mount

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for initialization to complete
      if (isInitializing.current) {
        console.log('CheckAuth - Still initializing, waiting...');
        return;
      }
      
      // Prevent multiple simultaneous auth checks
      if (authCheckInProgress.current) {
        console.log('CheckAuth - Auth check already in progress, skipping');
        return;
      }
      
      try {
        authCheckInProgress.current = true;
        
        // If user is already authenticated and we've done initial check, don't re-check
        if (user && user.email && user.role && initialAuthCheck.current && !pathname.startsWith('/auth/')) {
          console.log('CheckAuth - User already authenticated:', user.email, user.name, user.role);
          setIsLoading(false);
          return;
        }
        
        // Don't show loading on auth pages to prevent flicker
        if (!pathname.startsWith('/auth/') && !user) {
          setIsLoading(true);
        }
        
        // Quick check for basic auth tokens first including localStorage fallback
        const token = getCookie('accessToken') || getCookie('token') || 
                     manualGetCookie('accessToken') || manualGetCookie('token') ||
                     localStorage.getItem('cookie_accessToken');
        const role = (getCookie('userRole') || manualGetCookie('userRole') || 
                     localStorage.getItem('cookie_userRole')) as UserRole | undefined;
        
        // Debug all cookies
        if (typeof document !== 'undefined') {
          console.log('CheckAuth - All cookies:', document.cookie);
        }
        
        console.log('CheckAuth - Token:', !!token, 'Role:', role, 'Current user:', !!user, 'User email:', user?.email, 'Pathname:', pathname);
        console.log('CheckAuth - Token value:', token ? token.substring(0, 20) + '...' : 'null');
        
        // If no token at all, clear state only if we currently have a user
        if (!token) {
          console.log('CheckAuth - No token found, clearing state and setting loading to false');
          if (user || accessToken) {
            console.log('CheckAuth - Clearing auth state due to missing token');
            await clearAuthState();
          }
          setIsLoading(false);
          initialAuthCheck.current = true;
          return;
        }
        
        // If we already have a valid user with the same role as the cookie, don't re-fetch
        if (user && user.email && user.role === role && token) {
          console.log('CheckAuth - User already valid, skipping re-fetch:', user.email, user.name, user.role);
          setAccessToken(token as string);
          setIsLoading(false);
          initialAuthCheck.current = true;
          return;
        }
        
        // If we have a token, try to load/validate user data
        try {
          console.log('CheckAuth - Loading user data from server...');
          const userData = await loadUser(pathname);
          if (userData) {
            console.log('CheckAuth - User loaded successfully:', userData.email, userData.name, userData.role);
            setAccessToken(token as string);
            lastValidUser.current = userData;
            // Cache user in session storage for faster restoration
            safeSessionStorage.setItem('currentUser', JSON.stringify(userData));
            initialAuthCheck.current = true;
            return;
          } else {
            console.log('CheckAuth - No user data returned');
            // Don't immediately clear state, try to use last valid user or cached user
            if (lastValidUser.current && token && role) {
              console.log('CheckAuth - Using last valid user to prevent flash');
              setUser(lastValidUser.current);
              setAccessToken(token as string);
              return;
            }
            
            // Try cached user from session storage
            const cachedUser = safeSessionStorage.getItem('currentUser');
            if (cachedUser && token && role) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                if (parsedUser && parsedUser.email && parsedUser.role === role) {
                  console.log('CheckAuth - Using cached user to prevent flash:', parsedUser.email, parsedUser.name);
                  setUser(parsedUser);
                  setAccessToken(token as string);
                  lastValidUser.current = parsedUser;
                  return;
                }
              } catch (e) {
                console.error('CheckAuth - Failed to parse cached user:', e);
              }
            }
            
            await clearAuthState();
          }
        } catch (err) {
          console.error('CheckAuth - Failed to load user:', err);
          // Only clear auth state if the error indicates invalid credentials
          if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response;
            if (response?.status === 401 || response?.status === 403) {
              console.log('CheckAuth - Invalid credentials, clearing auth state');
              await clearAuthState();
            } else {
              // For network errors, try to use cached user
              if (lastValidUser.current && token && role) {
                console.log('CheckAuth - Network error, using cached user');
                setUser(lastValidUser.current);
                setAccessToken(token as string);
                return;
              }
              
              // Try cached user from session storage
              const cachedUser = safeSessionStorage.getItem('currentUser');
              if (cachedUser && token && role) {
                try {
                  const parsedUser = JSON.parse(cachedUser);
                  if (parsedUser && parsedUser.email && parsedUser.role === role) {
                    console.log('CheckAuth - Network error, using cached user:', parsedUser.email, parsedUser.name);
                    setUser(parsedUser);
                    setAccessToken(token as string);
                    lastValidUser.current = parsedUser;
                    return;
                  }
                } catch (e) {
                  console.error('CheckAuth - Failed to parse cached user:', e);
                }
              }
            }
          } else {
            // For other errors, try to use cached user
            if (lastValidUser.current && token && role) {
              console.log('CheckAuth - Error occurred, using cached user');
              setUser(lastValidUser.current);
              setAccessToken(token as string);
              return;
            }
            
            // Try cached user from session storage
            const cachedUser = safeSessionStorage.getItem('currentUser');
            if (cachedUser && token && role) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                if (parsedUser && parsedUser.email && parsedUser.role === role) {
                  console.log('CheckAuth - Error occurred, using cached user:', parsedUser.email, parsedUser.name);
                  setUser(parsedUser);
                  setAccessToken(token as string);
                  lastValidUser.current = parsedUser;
                  return;
                }
              } catch (e) {
                console.error('CheckAuth - Failed to parse cached user:', e);
              }
            }
          }
        }
        
        initialAuthCheck.current = true;
      } catch (error) {
        console.error('Auth check error:', error);
        // Try to preserve user state on errors
        const token = getCookie('accessToken');
        if (lastValidUser.current && token) {
          console.log('CheckAuth - Preserving user state after error');
          setUser(lastValidUser.current);
          setAccessToken(token as string);
        } else {
          // Try cached user from session storage
          const cachedUser = safeSessionStorage.getItem('currentUser');
          const role = getCookie('userRole') as UserRole | undefined;
          if (cachedUser && token && role) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              if (parsedUser && parsedUser.email && parsedUser.role === role) {
                console.log('CheckAuth - Error occurred, using cached user:', parsedUser.email, parsedUser.name);
                setUser(parsedUser);
                setAccessToken(token as string);
                lastValidUser.current = parsedUser;
                return;
              }
            } catch (e) {
              console.error('CheckAuth - Failed to parse cached user:', e);
            }
          }
          
          if (!user) {
            await clearAuthState();
          }
        }
        initialAuthCheck.current = true;
      } finally {
        setIsLoading(false);
        authCheckInProgress.current = false;
      }
    };
    
    let timeoutIds: NodeJS.Timeout[] = [];
    
    // Only run auth check in browser and if we're not on auth pages
    if (isBrowser && !pathname.startsWith('/auth/')) {
      // Wait for initialization to complete before running auth check
      if (isInitializing.current) {
        const initWaitTimeout = setTimeout(() => {
          if (!isInitializing.current) {
            checkAuth();
          }
        }, 50);
        timeoutIds.push(initWaitTimeout);
      } else {
        // Add a small delay to prevent race conditions on page refresh
        const checkAuthTimeout = setTimeout(checkAuth, 50);
        timeoutIds.push(checkAuthTimeout);
        
        // Add a safety timeout to ensure loading doesn't get stuck
        const safetyTimeout = setTimeout(() => {
          console.log('CheckAuth - Safety timeout triggered, forcing loading to false');
          setIsLoading(false);
          initialAuthCheck.current = true;
        }, 3000); // 3 second safety timeout
        timeoutIds.push(safetyTimeout);
      }
    } else {
      // For auth pages, set loading to false after render to avoid hooks error
      const authPageTimeout = setTimeout(() => {
        setIsLoading(false);
        initialAuthCheck.current = true;
      }, 0);
      timeoutIds.push(authPageTimeout);
    }
    
    // Cleanup function
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      authCheckInProgress.current = false;
    };
  }, [pathname, loadUser]); // Add loadUser to dependencies but remove user to prevent loops

  const clearAuthState = async () => {
    setUser(null);
    setAccessToken(null);
    setError(null);
    lastValidUser.current = null;
    
    // Clear cookies
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('userRole');
    
    // Clear storage including localStorage fallbacks
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('refresh_token');
    safeLocalStorage.removeItem('cookie_accessToken');
    safeLocalStorage.removeItem('cookie_refreshToken');
    safeLocalStorage.removeItem('cookie_userRole');
    safeSessionStorage.removeItem('currentUser');
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('AuthContext: Starting login process for email:', email);
      console.log('AuthContext: Current cookies before login:', document.cookie);
      
      const response = await authService.login({ email, password });
      console.log('AuthContext: Login response received:', {
        hasUser: !!response?.user,
        hasAccessToken: !!response?.accessToken,
        userEmail: response?.user?.email,
        userRole: response?.user?.role,
        tokenLength: response?.accessToken?.length
      });

      if (!response || !response.user || !response.accessToken) {
        throw new Error('Invalid login response from server');
      }

      // Ensure consistent name handling with better validation
      let userName = response.user.name?.trim();
      
      // Check if name is valid and not a placeholder
      if (!userName || userName === '' || userName === 'null' || userName === 'undefined' || userName === 'User') {
        userName = response.user.email?.split('@')[0] || email.split('@')[0] || 'User';
      }
      
      console.log('AuthContext - Login - User name processing:', {
        originalName: response.user.name,
        processedName: userName,
        email: response.user.email || email
      });
      
      const safeUser: User = {
        id: response.user.id,
        email: response.user.email || email,
        name: userName,
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
        httpOnly: false, // Must be false for client-side access
      };

      console.log('AuthContext - Setting cookies with options:', cookieOptions);
      console.log('AuthContext - Setting accessToken:', response.accessToken?.substring(0, 20) + '...');

      // Set cookies with both methods to ensure they persist
      const tokenOptions = { 
        ...cookieOptions, 
        maxAge: 60 * 60 * 24, // 24 hours
        expires: new Date(Date.now() + 60 * 60 * 24 * 1000) // 24 hours from now
      };
      
      const roleOptions = { 
        ...cookieOptions, 
        maxAge: 60 * 60 * 24 * 7, // 7 days
        expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 7 days from now
      };

      // Set cookies using cookies-next
      setCookie('accessToken', response.accessToken, tokenOptions);
      setCookie('userRole', safeUser.role, roleOptions);
      
      if (response.refreshToken) {
        setCookie('refreshToken', response.refreshToken, roleOptions);
      }

      // Also set cookies manually as fallback
      manualSetCookie('accessToken', response.accessToken, tokenOptions);
      manualSetCookie('userRole', safeUser.role, roleOptions);
      
      if (response.refreshToken) {
        manualSetCookie('refreshToken', response.refreshToken, roleOptions);
      }

      // Verify cookies were set immediately
      console.log('AuthContext - Cookies set, verifying...');
      console.log('AuthContext - Current cookies after setting:', document.cookie);
      
      setTimeout(() => {
        const verifyToken = getCookie('accessToken') || manualGetCookie('accessToken');
        const verifyRole = getCookie('userRole') || manualGetCookie('userRole');
        console.log('AuthContext - Cookie verification - Token:', !!verifyToken, 'Role:', verifyRole);
        console.log('AuthContext - All cookies after timeout:', document.cookie);
        
        if (!verifyToken) {
          console.error('AuthContext - ERROR: Token not found after setting!');
          // Try to set cookies again with a simpler method
          document.cookie = `accessToken=${response.accessToken}; path=/; max-age=86400`;
          document.cookie = `userRole=${safeUser.role}; path=/; max-age=604800`;
          console.log('AuthContext - Fallback cookies set, checking again:', document.cookie);
        }
      }, 100);

      // Update state immediately to prevent race conditions
      setAccessToken(response.accessToken);
      setUser(safeUser);
      lastValidUser.current = safeUser;
      // Cache user in session storage for faster restoration
      safeSessionStorage.setItem('currentUser', JSON.stringify(safeUser));
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

      console.log('AuthContext: Login process completed successfully');
      return { success: true, user: safeUser };
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      console.error('AuthContext: Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      console.log('AuthContext: Login process finished, setting loading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear all auth-related cookies with all possible options to ensure they're removed
      const clearAllCookies = () => {
        const cookies = document.cookie.split(';');
        const domain = window.location.hostname;
        
        // Clear cookies with domain
        cookies.forEach(cookie => {
          const [name] = cookie.split('=').map(c => c.trim());
          if (name) {
            document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
      };

      try {
        // Clear cookies using deleteCookie with all possible options
        const domains = [
          window.location.hostname,
          `.${window.location.hostname}`,
          window.location.hostname.split('.').slice(-2).join('.'),
          `.${window.location.hostname.split('.').slice(-2).join('.')}`
        ];

        // Ensure we clear all variations of the cookies
        ['accessToken', 'refreshToken', 'token', 'userRole', 'auth_token', 'refresh_token'].forEach(cookieName => {
          // Clear with all possible domain variations
          domains.forEach(domain => {
            document.cookie = `${cookieName}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          });
          // Clear without domain
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });

        // Also try the deleteCookie function
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
        };

        ['accessToken', 'refreshToken', 'token', 'userRole', 'auth_token', 'refresh_token'].forEach(cookieName => {
          deleteCookie(cookieName, cookieOptions);
        });

        // Clear all cookies as a last resort
        clearAllCookies();
      } catch (e) {
        console.error('Error clearing cookies:', e);
      }

      // Clear local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Reset state
      setUser(null);
      setAccessToken(null);
      setError(null);

      // Redirect to login
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
