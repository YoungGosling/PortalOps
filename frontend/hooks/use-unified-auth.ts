"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth as useLegacyAuth } from '@/providers/auth-provider'
import { apiClient } from '@/lib/api'
import { User, UserRole } from '@/types'

/**
 * Unified authentication hook that supports both:
 * 1. Azure AD login (via NextAuth)
 * 2. Email/Password login (via legacy auth provider)
 */
export function useUnifiedAuth() {
  const { data: session, status: sessionStatus } = useSession()
  const legacyAuth = useLegacyAuth()
  const [isExchangingToken, setIsExchangingToken] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[Unified Auth] Initializing...')
      console.log('[Unified Auth] Session status:', sessionStatus)
      console.log('[Unified Auth] Legacy user:', legacyAuth.user?.email || 'none')

      // If legacy auth has a user, use that (Email/Password login)
      if (legacyAuth.user) {
        console.log('[Unified Auth] ✓ Using legacy auth (Email/Password)')
        setUser(legacyAuth.user)
        setIsLoading(false)
        return
      }

      // If NextAuth session is loading, wait
      if (sessionStatus === 'loading') {
        console.log('[Unified Auth] Waiting for NextAuth session...')
        return
      }

      // If NextAuth session exists (Azure login)
      if (sessionStatus === 'authenticated' && session?.user) {
        console.log('[Unified Auth] ✓ Azure session detected, exchanging token...')
        
        // Check if we already have a backend token
        const existingToken = apiClient.getToken()
        const storedUser = localStorage.getItem('portalops_user')
        
        if (existingToken && storedUser) {
          console.log('[Unified Auth] ✓ Backend token already exists')
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setIsLoading(false)
            return
          } catch (e) {
            console.error('[Unified Auth] Failed to parse stored user:', e)
          }
        }

        // Need to exchange Azure token for backend JWT
        if (!isExchangingToken) {
          setIsExchangingToken(true)
          try {
            console.log('[Unified Auth] Exchanging Azure token for backend JWT...')
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
            console.log('[Unified Auth] ✓ Token exchange successful')
            
            // Set backend token in API client
            apiClient.setToken(data.accessToken)
            console.log('[Unified Auth] ✓ Backend token set in API client')

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
            console.log('[Unified Auth] ✓ User data stored in localStorage')

          } catch (error) {
            console.error('[Unified Auth] ✗ Token exchange failed:', error)
            
            // Fallback: create a basic user from Azure session
            console.log('[Unified Auth] Using fallback Azure user (no backend token)')
            const fallbackUser: User = {
              id: 'azure-' + session.user.email,
              email: session.user.email || '',
              name: session.user.name || session.user.email || 'User',
              department: '',
              role: 'Admin' as UserRole, // Default to Admin for Azure users
              assignedServiceIds: [],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            
            setUser(fallbackUser)
          } finally {
            setIsExchangingToken(false)
          }
        }
      } else {
        // No authentication at all
        console.log('[Unified Auth] No authentication found')
        setUser(null)
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [session, sessionStatus, legacyAuth.user, isExchangingToken])

  return {
    user,
    isLoading: isLoading || legacyAuth.isLoading,
    hasRole: (role: UserRole) => {
      if (!user) return false
      return user.role === role
    },
    hasAnyRole: (roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    canAccessService: legacyAuth.canAccessService,
    canAccessProduct: legacyAuth.canAccessProduct,
    canAddService: legacyAuth.canAddService,
    canAssignServiceAdmin: legacyAuth.canAssignServiceAdmin,
    canAssignProductAdmin: legacyAuth.canAssignProductAdmin,
    getAccessibleServices: legacyAuth.getAccessibleServices,
    getAccessibleProducts: legacyAuth.getAccessibleProducts,
  }
}

