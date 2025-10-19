"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SessionProvider, useSession } from 'next-auth/react'
import { User, UserRole } from '@/types'
import { authApi, apiClient } from '@/lib/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  signup: (userData: SignupData) => Promise<boolean>
  isLoading: boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canAccessService: (serviceId: string) => boolean
  canAccessProduct: (serviceId: string, productId: string) => boolean
  canAddService: () => boolean
  canAssignServiceAdmin: () => boolean
  canAssignProductAdmin: (serviceId?: string) => boolean
  getAccessibleServices: () => string[]
  getAccessibleProducts: (serviceId: string) => string[]
}

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Internal provider component that has access to NextAuth session
function AuthProviderInternal({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExchangingToken, setIsExchangingToken] = useState(false)
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  useEffect(() => {
    // Initialize authentication state from localStorage or Azure session
    const initializeAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      console.log('[Auth Provider] Initializing authentication...')
      console.log('[Auth Provider] NextAuth session status:', sessionStatus)
      
      const storedUser = localStorage.getItem('portalops_user')
      const storedToken = localStorage.getItem('portalops_token')
      
      console.log('[Auth Provider] Stored user exists:', !!storedUser)
      console.log('[Auth Provider] Stored token exists:', !!storedToken)
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          
          // Restore token in API client - try multiple sources
          const token = userData.accessToken || storedToken
          if (token) {
            console.log('[Auth Provider] ✓ Restoring token from localStorage')
            apiClient.setToken(token)
            
            // CRITICAL: Also restore cookie for middleware
            if (typeof document !== 'undefined') {
              document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
              console.log('[Auth Provider] ✓ Token restored to cookie for middleware')
            }
          } else {
            console.error('[Auth Provider] ✗ User data exists but NO TOKEN found!')
          }
        } catch (error) {
          console.error('[Auth Provider] Failed to parse stored user:', error)
          localStorage.removeItem('portalops_user')
        }
      } else if (storedToken) {
        // Token exists but no user - try to fetch user profile
        console.log('[Auth Provider] Found token without user, fetching profile...')
        apiClient.setToken(storedToken)
        
        // Also restore cookie for middleware
        if (typeof document !== 'undefined') {
          document.cookie = `auth_token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
        }
        
        try {
          const profile = await authApi.getProfile()
          const userData: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            department: profile.department || '',
            role: profile.roles?.[0] as UserRole,
            assignedServiceIds: profile.assignedServiceIds || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setUser(userData)
          localStorage.setItem('portalops_user', JSON.stringify({
            ...userData,
            accessToken: storedToken
          }))
          console.log('[Auth Provider] ✓ User profile fetched and stored')
        } catch (err) {
          console.error('[Auth Provider] ✗ Failed to fetch user profile:', err)
          // Clear invalid token
          apiClient.clearToken()
          localStorage.removeItem('portalops_token')
          localStorage.removeItem('portalops_user')
          if (typeof document !== 'undefined') {
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }
      } else if (sessionStatus === 'authenticated' && session?.user && !isExchangingToken) {
        // Azure AD login detected - exchange token
        console.log('[Auth Provider] Azure session detected, exchanging token...')
        setIsExchangingToken(true)
        
        try {
          const response = await fetch('/api/auth/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`)
          }

          const data = await response.json()
          console.log('[Auth Provider] ✓ Azure token exchanged successfully')
          
          // Set backend token in API client
          apiClient.setToken(data.accessToken)
          console.log('[Auth Provider] ✓ Backend token set in API client')

          // CRITICAL: Store token in cookie for middleware access
          if (typeof document !== 'undefined') {
            document.cookie = `auth_token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
            console.log('[Auth Provider] ✓ Azure token stored in cookie for middleware')
          }

          // Convert to User format
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            department: data.user.department || '',
            role: (data.user.roles?.[0] || 'Admin') as UserRole,
            assignedServiceIds: data.user.assignedServiceIds || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          setUser(userData)
          
          // Store in localStorage for persistence
          localStorage.setItem('portalops_user', JSON.stringify({
            ...userData,
            accessToken: data.accessToken
          }))
          console.log('[Auth Provider] ✓ Azure user data stored')
        } catch (error) {
          console.error('[Auth Provider] ✗ Azure token exchange failed:', error)
          
          // Fallback: create basic user from Azure session
          const fallbackUser: User = {
            id: 'azure-' + (session.user.email || 'unknown'),
            email: session.user.email || '',
            name: session.user.name || session.user.email || 'User',
            department: '',
            role: 'Admin' as UserRole,
            assignedServiceIds: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          setUser(fallbackUser)
          console.log('[Auth Provider] Using fallback Azure user (no backend token)')
        } finally {
          setIsExchangingToken(false)
        }
      } else if (sessionStatus === 'unauthenticated') {
        console.log('[Auth Provider] No authentication found')
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [session, sessionStatus, isExchangingToken])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      console.log('[Auth Provider] Logging in with email:', email)
      
      // Call real API
      const response = await authApi.login(email, password)
      console.log('[Auth Provider] Login successful, received token')
      
      // CRITICAL: Set token in API client FIRST
      apiClient.setToken(response.accessToken)
      console.log('[Auth Provider] Token set in API client')
      
      // Store token in cookie for middleware access
      if (typeof document !== 'undefined') {
        // Set cookie with token for middleware
        document.cookie = `auth_token=${response.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
        console.log('[Auth Provider] Token stored in cookie')
      }
      
      // Get full user profile
      const userProfile = await authApi.getProfile()
      console.log('[Auth Provider] User profile fetched:', userProfile.email)
      
      // Convert API response to User format (v2.0)
      const userData: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        department: userProfile.department || '',
        role: userProfile.roles?.[0] as UserRole, // Single role
        assignedServiceIds: userProfile.assignedServiceIds || [], // Simplified permissions
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      setUser(userData)
      if (typeof window !== 'undefined') {
        // Store user data with token
        localStorage.setItem('portalops_user', JSON.stringify({
          ...userData,
          accessToken: response.accessToken
        }))
        console.log('[Auth Provider] ✓ User data and token stored in localStorage')
      }
      
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('[Auth Provider] ✗ Login failed:', error)
      setIsLoading(false)
      return false
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      department: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setUser(newUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('portalops_user', JSON.stringify(newUser))
    }
    setIsLoading(false)
    return true
  }

  const logout = () => {
    console.log('[Auth Provider] Logging out...')
    setUser(null)
    apiClient.clearToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portalops_user')
      localStorage.removeItem('portalops_token')
    }
    // Clear auth cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    console.log('[Auth Provider] ✓ Logged out successfully')
    // Redirect to signin page
    router.push('/signin')
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role || false
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return (user?.role && roles.includes(user.role)) || false
  }

  const canAccessService = (serviceId: string): boolean => {
    if (!user) return false
    
    // Admin can access all services
    if (user.role === 'Admin') return true
    
    // Service Admin can access assigned services
    if (user.role === 'ServiceAdmin') {
      return user.assignedServiceIds?.includes(serviceId) || false
    }
    
    return false
  }

  const canAccessProduct = (serviceId: string, _productId: string): boolean => {
    if (!user) return false
    
    // Admin can access all products
    if (user.role === 'Admin') return true
    
    // Service Admin can access all products under their assigned services
    if (user.role === 'ServiceAdmin') {
      return user.assignedServiceIds?.includes(serviceId) || false
    }
    
    return false
  }

  const canAddService = (): boolean => {
    if (!user) return false
    return user.role === 'Admin'
  }

  const canAssignServiceAdmin = (): boolean => {
    if (!user) return false
    return user.role === 'Admin'
  }

  const canAssignProductAdmin = (serviceId?: string): boolean => {
    if (!user) return false
    
    // Admin can assign for any service
    if (user.role === 'Admin') return true
    
    // Service Admin can assign for their managed services
    if (user.role === 'ServiceAdmin' && serviceId) {
      return user.assignedServiceIds?.includes(serviceId) || false
    }
    
    return false
  }

  const getAccessibleServices = (): string[] => {
    if (!user) return []
    
    // Admin can access all services (return empty array to indicate "all")
    if (user.role === 'Admin') return []
    
    // Service Admin can access assigned services
    return user.assignedServiceIds || []
  }

  const getAccessibleProducts = (serviceId: string): string[] => {
    if (!user) return []
    
    // Admin can access all products (return empty array to indicate "all")
    if (user.role === 'Admin') return []
    
    // Service Admin with service access can access all products in that service
    if (user.role === 'ServiceAdmin' && canAccessService(serviceId)) {
      return []
    }
    
    return []
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    signup,
    isLoading,
    hasRole,
    hasAnyRole,
    canAccessService,
    canAccessProduct,
    canAddService,
    canAssignServiceAdmin,
    canAssignProductAdmin,
    getAccessibleServices,
    getAccessibleProducts,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Wrapper component that provides SessionProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInternal>
        {children}
      </AuthProviderInternal>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

