'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect authenticated users to their dashboard
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
      } else {
        // Redirect unauthenticated users to login
        router.replace('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading spinner while determining authentication status
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#507295]">
      <div className="text-center p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Kardex <span className="text-[#aac01d]">Remstar</span>
          </h1>
          <p className="text-white/80">Intelligent Storage Solutions</p>
        </div>
        
        <div className="mb-4">
          <Loader2 className="h-12 w-12 text-white mx-auto animate-spin" />
        </div>
        
        <p className="text-white/70 text-sm">
          {isLoading ? 'Loading your dashboard...' : 'Redirecting...'}
        </p>
        
        <div className="mt-4 w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-white to-[#aac01d] rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
