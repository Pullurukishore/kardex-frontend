import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  role: string;
  zoneId?: string;
  name: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real app, you would fetch the user from your auth provider
    const fetchUser = async () => {
      try {
        // Simulate API call to get current user
        const mockUser: User = {
          id: 1,
          role: 'ZONE_USER',
          zoneId: '1',
          name: 'Zone Manager',
          email: 'zone.manager@example.com'
        };
        setUser(mockUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};

export default useAuth;
