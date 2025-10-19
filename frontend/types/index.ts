// User Types (Updated for v2.0)
export interface User {
  id: string
  email: string
  name: string // Combined name field
  department: string
  role?: UserRole // Single role (optional)
  assignedServiceIds?: string[] // Service IDs the user manages (for ServiceAdmin)
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserRole = 'Admin' | 'ServiceAdmin'

// Service and Product Types (Simplified)

// Service Types (Updated for v2.0)
export interface WebService {
  id: string
  name: string
  vendor?: string
  products?: ServiceProduct[] // Products associated with this service (optional)
  productCount: number // Total count of products
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceProduct {
  id: string
  name: string // Must be unique
  serviceId: string | null // Parent service (can be null for unassociated products)
  serviceName?: string // For display purposes
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Payment Register Types (Billing Information) - Updated for v2.0
export interface PaymentRegisterItem {
  id: string
  productId: string
  productName: string // Read-only
  serviceName: string // Read-only
  amount?: number // Editable, mandatory
  cardholderName?: string // Editable, mandatory
  expiryDate?: string // Editable, mandatory (YYYY-MM-DD)
  paymentMethod?: string // Editable, mandatory
  billAttachment?: string // File upload path, mandatory (also accepts billAttachmentPath from backend)
  billAttachmentPath?: string // Alias for backward compatibility
  isComplete: boolean // True if all fields filled
  createdAt: string
  updatedAt: string
}


// Workflow Types (Inbox - Onboarding/Offboarding)
export interface WorkflowTask {
  id: string
  type: 'onboarding' | 'offboarding'
  status: 'pending' | 'completed'
  // Employee information from HR system
  employeeName: string
  employeeDepartment: string
  employeeEmail: string
  // For offboarding: existing user info
  userId?: string
  assignedServices?: string[]
  assignedProducts?: string[]
  completedAt?: string
  completedBy?: string
  createdAt: string
  updatedAt: string
}

// Master Files Types (Bill Attachments)
export interface MasterFile {
  id: string
  fileName: string
  fileUrl: string
  productId: string
  productName: string
  serviceName: string
  uploadedAt: string
  fileSize?: number
  mimeType?: string
}

// Dashboard Types
export interface DashboardStats {
  totalServices: number
  activeUsers: number
  pendingTasks: number
  upcomingRenewals: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'user_created' | 'service_added' | 'task_completed' | 'payment_renewed'
  description: string
  userId?: string
  timestamp: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

// Report Types
export interface Report {
  id: string
  name: string
  type: 'onboarding' | 'offboarding' | 'access' | 'payment' | 'audit'
  description: string
  parameters: Record<string, any>
  createdBy: string
  createdAt: string
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

