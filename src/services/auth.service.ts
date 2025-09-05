import { UserRole } from '@/types/user.types';
import api from '@/lib/api/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
  companyName?: string;
  zoneId?: string;
}

export interface AuthResponseUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  phone?: string | null;
  zoneId?: string | null;
  customerId?: string | null;
  companyName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  isActive?: boolean;
  refreshToken?: string | null;
  refreshTokenExpires?: string | null;
  tokenVersion?: string;
  otp?: string | null;
  otpExpiresAt?: string | null;
  failedLoginAttempts?: number;
  accountLockedUntil?: string | null;
  lastFailedLogin?: string | null;
  lastPasswordChange?: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  lastActiveAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  customer?: any | null;
  token?: string;
  accessToken?: string; // Added accessToken property
}

export interface AuthResponse {
  user: AuthResponseUser;
  accessToken: string;
  refreshToken: string;
  token?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Sending login request with credentials:', { 
        email: credentials.email, 
        hasPassword: !!credentials.password 
      });
      
      const response = await api.post('/auth/login', credentials);
      console.log('Raw login response:', response);
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Handle case where response might be a string 'y' or similar
      if (typeof response.data === 'string') {
        console.warn('Unexpected string response from server:', response.data);
        throw new Error('Invalid server response format');
      }
      
      const { token, refreshToken, ...user } = response.data;
      
      if (!token) {
        console.error('No token in response:', response.data);
        throw new Error('Authentication failed: No token received');
      }
      
      return {
        user,
        accessToken: token,
        refreshToken: refreshToken || ''
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<AuthResponseUser> {
    const { data } = await api.get<AuthResponseUser>('/auth/me');
    return {
      ...data,
      name: data.name || data.email.split('@')[0],
      isActive: data.isActive ?? true,
      tokenVersion: data.tokenVersion || '0',
      lastPasswordChange: data.lastPasswordChange || new Date().toISOString()
    };
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh-token');
    return data;
  },
};
