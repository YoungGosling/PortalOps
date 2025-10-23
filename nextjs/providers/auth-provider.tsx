'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import type { User, LoginRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  isServiceAdmin: () => boolean;
  hasRole: (role: 'Admin' | 'ServiceAdmin') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      
      // Redirect to signin page if token is invalid or expired
      // Note: The API client will handle 401 errors and redirect automatically
      // This is a fallback for other error cases
      if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
        router.push('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Azure AD session
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setLoading(true);
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      // User is authenticated via Azure AD
      // Fetch user data from backend (which will sync Azure user automatically)
      const fetchAzureUser = async () => {
        try {
          setLoading(true);
          // Backend will recognize Azure ID token and sync user automatically
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch Azure user from backend:', error);
          // Fallback: use Azure session data with empty roles
          const azureUser: User = {
            id: session.user?.email || '',
            name: session.user?.name || '',
            email: session.user?.email || '',
            department: undefined,
            roles: [], // Admin needs to assign roles in Employee Directory
            assignedProductIds: [],
          };
          setUser(azureUser);
        } finally {
          setLoading(false);
        }
      };
      
      fetchAzureUser();
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // No Azure session, check for regular token-based auth
      fetchUser();
    }
  }, [session, sessionStatus]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.login(credentials);
      
      // Store token in both localStorage and cookie
      localStorage.setItem('access_token', response.accessToken);
      document.cookie = `access_token=${response.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
      
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    // Clear cookie by setting it to expire immediately
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/signin');
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const isAdmin = () => {
    return user?.roles?.includes('Admin') ?? false;
  };

  const isServiceAdmin = () => {
    return user?.roles?.includes('ServiceAdmin') ?? false;
  };

  const hasRole = (role: 'Admin' | 'ServiceAdmin') => {
    return user?.roles?.includes(role) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isServiceAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

