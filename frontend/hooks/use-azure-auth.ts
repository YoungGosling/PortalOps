"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { User, UserRole } from '@/types'

export function useAzureAuth() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [backendToken, setBackendToken] = useState<string | null>(null)

  useEffect(() => {
    const exchangeToken = async () => {
      if (status === 'loading') {
        return
      }

      if (status === 'unauthenticated') {
        setUser(null)
        setIsLoading(false)
        apiClient.clearToken()
        return
      }

      if (status === 'authenticated' && session?.user) {
        try {
          // Check if we already have a backend token
          const existingToken = apiClient.getToken()
          const storedUser = localStorage.getItem('portalops_user')
          
          if (existingToken && storedUser) {
            // We already have valid backend auth
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setBackendToken(existingToken)
            setIsLoading(false)
            return
          }

          // Exchange Azure token for backend JWT
          const response = await fetch('/api/auth/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error('Token exchange failed')
          }

          const data = await response.json()
          
          // Set backend token in API client
          apiClient.setToken(data.accessToken)
          setBackendToken(data.accessToken)

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
          
          // Store in localStorage
          localStorage.setItem('portalops_user', JSON.stringify({
            ...userData,
            accessToken: data.accessToken
          }))

        } catch (error) {
          console.error('Failed to exchange token:', error)
          
          // Fallback: create a basic user from Azure session
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
          setIsLoading(false)
        }
      }
    }

    exchangeToken()
  }, [session, status])

  return { user, isLoading, backendToken, session }
}

