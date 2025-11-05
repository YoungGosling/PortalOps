'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { fetchLoginAction } from '@/api/authentication/login/action';
import { fetchUserProfileAction } from '@/api/authentication/me/action';
import { UnauthorizedError } from '@/lib/errors';
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

      const userData = await fetchUserProfileAction(token);
      // Transform to match User type (add assignedProductIds from assigned_services)
      const assignedProductIds = userData.assigned_services?.flatMap(
        (service) => service.products.map((product) => product.product_id)
      ) || [];
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        department: userData.department ?? undefined,
        department_id: userData.department_id ?? undefined,
        position: userData.position ?? undefined,
        hire_date: userData.hire_date ?? undefined,
        resignation_date: userData.resignation_date ?? undefined,
        roles: (userData.roles || []) as ('Admin' | 'ServiceAdmin')[],
        assignedProductIds,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      
      // Check if this is an authentication error (401)
      // Server actions serialize errors, so we check the name property instead of instanceof
      const isUnauthorized = error instanceof UnauthorizedError || 
                            (error as any)?.name === 'UnauthorizedError' ||
                            (error as Error)?.message?.includes('Failed to fetch user profile: Unauthorized');
      
      if (isUnauthorized) {
        console.log('Authentication expired, automatically signing out...');
        // Clear local storage and cookies
        localStorage.removeItem('access_token');
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        
        // If user has a NextAuth session, sign them out properly
        // This will clear the NextAuth session and redirect to signin
        if (session) {
          await signOut({ callbackUrl: '/signin', redirect: true });
        } else {
          // For traditional auth, just redirect
          if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
            router.push('/signin');
          }
        }
      } else {
        // Handle other errors
        localStorage.removeItem('access_token');
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        
        if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
          router.push('/signin');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Track if we've already fetched user data to prevent refetch on tab visibility change
  const hasFetchedUserRef = useRef(false);

  // Handle Azure AD session
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setLoading(true);
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      // Skip if already fetched to prevent refetch on tab focus/visibility change
      if (hasFetchedUserRef.current) {
        return;
      }

      // Check if session has valid tokens
      if (!session.tokens?.id_token || !session.tokens?.access_token) {
        console.error('Session has no valid tokens, signing out...');
        setUser(null);
        setLoading(false);
        router.push('/signin');
        return;
      }

      // User is authenticated via Azure AD
      // Fetch user data from backend (which will sync Azure user automatically)
      const fetchAzureUser = async () => {
        try {
          setLoading(true);
          // Backend will recognize Azure ID token and sync user automatically
          // Don't pass token - let fetchWithToken get it from NextAuth session
          const userData = await fetchUserProfileAction();
          // Transform to match User type (add assignedProductIds from assigned_services)
          const assignedProductIds = userData.assigned_services?.flatMap(
            (service) => service.products.map((product) => product.product_id)
          ) || [];
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            department: userData.department ?? undefined,
            department_id: userData.department_id ?? undefined,
            position: userData.position ?? undefined,
            hire_date: userData.hire_date ?? undefined,
            resignation_date: userData.resignation_date ?? undefined,
            roles: (userData.roles || []) as ('Admin' | 'ServiceAdmin')[],
            assignedProductIds,
          });
          hasFetchedUserRef.current = true; // Mark as fetched
        } catch (error) {
          console.error('Failed to fetch Azure user from backend:', error);
          
          // Check if this is an authentication error (401)
          // Server actions serialize errors, so we check the name property instead of instanceof
          const isUnauthorized = error instanceof UnauthorizedError || 
                                (error as any)?.name === 'UnauthorizedError' ||
                                (error as Error)?.message?.includes('Failed to fetch user profile: Unauthorized');
          
          if (isUnauthorized) {
            console.log('Azure AD authentication expired, automatically signing out...');
            setUser(null);
            // Sign out from NextAuth to clear the expired session
            await signOut({ callbackUrl: '/signin', redirect: true });
          } else {
            // On other errors, clear user and redirect to sign in
            // This prevents infinite retry loops
            setUser(null);
            if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
              router.push('/signin');
            }
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchAzureUser();
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // Skip if already fetched
      if (hasFetchedUserRef.current) {
        return;
      }
      // No Azure session, check for regular token-based auth
      fetchUser();
      hasFetchedUserRef.current = true;
    }
  }, [session, sessionStatus]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await fetchLoginAction(credentials.email, credentials.password);
      
      // Store token in both localStorage and cookie
      localStorage.setItem('access_token', response.accessToken);
      document.cookie = `access_token=${response.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      // Pass the token explicitly to the server action
      const userData = await fetchUserProfileAction(response.accessToken);
      // Transform to match User type (add assignedProductIds from assigned_services)
      const assignedProductIds = userData.assigned_services?.flatMap(
        (service) => service.products.map((product) => product.product_id)
      ) || [];
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        department: userData.department ?? undefined,
        department_id: userData.department_id ?? undefined,
        position: userData.position ?? undefined,
        hire_date: userData.hire_date ?? undefined,
        resignation_date: userData.resignation_date ?? undefined,
        roles: (userData.roles || []) as ('Admin' | 'ServiceAdmin')[],
        assignedProductIds,
      });
      
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

