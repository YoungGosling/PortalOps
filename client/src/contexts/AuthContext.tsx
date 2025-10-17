import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '../types'
import { authApi, apiClient } from '../lib/api'

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

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@portalops.com',
    firstName: 'John',
    lastName: 'Admin',
    title: 'System Administrator',
    department: 'IT',
    roles: ['Admin'],
    canLogin: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'service.admin@portalops.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'Service Administrator',
    department: 'IT Operations',
    roles: ['ServiceAdministrator'],
    canLogin: true,
    servicePermissions: [
      {
        id: 'sp1',
        userId: '2',
        serviceId: '1', // Google Workspace
        assignedBy: '1',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
      {
        id: 'sp2',
        userId: '2',
        serviceId: '2', // Microsoft 365
        assignedBy: '1',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'product.admin@portalops.com',
    firstName: 'Michael',
    lastName: 'Chen',
    title: 'Product Administrator',
    department: 'Engineering',
    roles: ['ProductAdministrator'],
    canLogin: true,
    productPermissions: [
      {
        id: 'pp1',
        userId: '3',
        serviceId: '1', // Google Workspace
        productId: '1-1', // Gmail
        assignedBy: '2',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
      {
        id: 'pp2',
        userId: '3',
        serviceId: '1', // Google Workspace
        productId: '1-2', // Google Drive
        assignedBy: '2',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'emily.davis@portalops.com',
    firstName: 'Emily',
    lastName: 'Davis',
    title: 'Software Engineer',
    department: 'Engineering',
    roles: ['User'],
    canLogin: false, // Users cannot login according to new PRD
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'jane.smith@portalops.com',
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'Marketing Manager',
    department: 'Marketing',
    roles: ['User'],
    canLogin: false, // Users cannot login according to new PRD
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('portalops_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      // Restore token in API client
      if (userData.accessToken) {
        apiClient.setToken(userData.accessToken)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Call real API
      const response = await authApi.login(email, password)
      
      // Set token in API client
      apiClient.setToken(response.accessToken)
      
      // Get full user profile
      const userProfile = await authApi.getProfile()
      
      // Convert API response to User format
      const userData: User = {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.name.split(' ')[0] || userProfile.name,
        lastName: userProfile.name.split(' ').slice(1).join(' ') || '',
        title: '', // Will be filled from user directory if needed
        department: '', // Will be filled from user directory if needed
        roles: userProfile.roles as UserRole[],
        canLogin: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        servicePermissions: userProfile.permissions.services.map(serviceId => ({
          id: `sp_${serviceId}`,
          userId: userProfile.id,
          serviceId,
          assignedBy: 'system',
          assignedAt: new Date().toISOString(),
          isActive: true,
        })),
        productPermissions: userProfile.permissions.products.map(productId => ({
          id: `pp_${productId}`,
          userId: userProfile.id,
          serviceId: '', // Will be determined from product
          productId,
          assignedBy: 'system',
          assignedAt: new Date().toISOString(),
          isActive: true,
        })),
      }
      
      setUser(userData)
      localStorage.setItem('portalops_user', JSON.stringify({
        ...userData,
        accessToken: response.accessToken
      }))
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
      return false
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email)
    if (existingUser) {
      setIsLoading(false)
      return false
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roles: ['User'],
      canLogin: false, // New users cannot login by default
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockUsers.push(newUser)
    setUser(newUser)
    localStorage.setItem('portalops_user', JSON.stringify(newUser))
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    apiClient.clearToken()
    localStorage.removeItem('portalops_user')
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.roles.some(role => roles.includes(role)) || false
  }

  const canAccessService = (serviceId: string): boolean => {
    if (!user) return false
    
    // Admin can access all services
    if (user.roles.includes('Admin')) return true
    
    // Service Admin can access assigned services
    if (user.roles.includes('ServiceAdministrator')) {
      return user.servicePermissions?.some(sp => sp.serviceId === serviceId && sp.isActive) || false
    }
    
    // Product Admin can access services that contain their assigned products
    if (user.roles.includes('ProductAdministrator')) {
      return user.productPermissions?.some(pp => pp.serviceId === serviceId && pp.isActive) || false
    }
    
    return false
  }

  const canAccessProduct = (serviceId: string, productId: string): boolean => {
    if (!user) return false
    
    // Admin can access all products
    if (user.roles.includes('Admin')) return true
    
    // Service Admin can access all products under their assigned services
    if (user.roles.includes('ServiceAdministrator')) {
      return user.servicePermissions?.some(sp => sp.serviceId === serviceId && sp.isActive) || false
    }
    
    // Product Admin can only access specifically assigned products
    if (user.roles.includes('ProductAdministrator')) {
      return user.productPermissions?.some(pp => 
        pp.serviceId === serviceId && pp.productId === productId && pp.isActive
      ) || false
    }
    
    return false
  }

  const canAddService = (): boolean => {
    if (!user) return false
    return user.roles.includes('Admin') || user.roles.includes('ServiceAdministrator')
  }

  const canAssignServiceAdmin = (): boolean => {
    if (!user) return false
    return user.roles.includes('Admin')
  }

  const canAssignProductAdmin = (serviceId?: string): boolean => {
    if (!user) return false
    
    // Admin can assign product admin for any service
    if (user.roles.includes('Admin')) return true
    
    // Service Admin can assign product admin only for their managed services
    if (user.roles.includes('ServiceAdministrator') && serviceId) {
      return user.servicePermissions?.some(sp => sp.serviceId === serviceId && sp.isActive) || false
    }
    
    return false
  }

  const getAccessibleServices = (): string[] => {
    if (!user) return []
    
    // Admin can access all services (return empty array to indicate "all")
    if (user.roles.includes('Admin')) return []
    
    // Service Admin can access assigned services
    if (user.roles.includes('ServiceAdministrator')) {
      return user.servicePermissions?.filter(sp => sp.isActive).map(sp => sp.serviceId) || []
    }
    
    // Product Admin can access services containing their assigned products
    if (user.roles.includes('ProductAdministrator')) {
      const serviceIds = new Set(
        user.productPermissions?.filter(pp => pp.isActive).map(pp => pp.serviceId) || []
      )
      return Array.from(serviceIds)
    }
    
    return []
  }

  const getAccessibleProducts = (serviceId: string): string[] => {
    if (!user) return []
    
    // Admin and Service Admin can access all products (return empty array to indicate "all")
    if (user.roles.includes('Admin') || 
        (user.roles.includes('ServiceAdministrator') && canAccessService(serviceId))) {
      return []
    }
    
    // Product Admin can only access specifically assigned products
    if (user.roles.includes('ProductAdministrator')) {
      return user.productPermissions?.filter(pp => 
        pp.serviceId === serviceId && pp.isActive
      ).map(pp => pp.productId) || []
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
