// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  title?: string
  department?: string
  roles: UserRole[]
  servicePermissions?: ServicePermission[]
  productPermissions?: ProductPermission[]
  avatar?: string
  isActive: boolean
  canLogin: boolean // New field to indicate if user can log in
  createdAt: string
  updatedAt: string
}

export type UserRole = 'Admin' | 'ServiceAdministrator' | 'ProductAdministrator' | 'User'

// Permission Types
export interface ServicePermission {
  id: string
  userId: string
  serviceId: string
  assignedBy: string
  assignedAt: string
  isActive: boolean
}

export interface ProductPermission {
  id: string
  userId: string
  serviceId: string
  productId: string
  assignedBy: string
  assignedAt: string
  isActive: boolean
}

// Service Types
export interface WebService {
  id: string
  name: string
  vendor: string
  url: string
  description?: string
  products: ServiceProduct[]
  paymentInfo: PaymentInfo
  administrators: string[] // User IDs
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceProduct {
  id: string
  name: string
  description?: string
  serviceId: string
  isActive: boolean
  billingInfo?: ProductBillingInfo
}

// Product Billing Types
export interface ProductBillingInfo {
  id: string
  productId: string
  billAmount?: number
  cardholderName?: string
  expirationDate?: string
  paymentMethod?: string
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

// Payment Types
export interface PaymentInfo {
  id: string
  serviceId: string
  cardholder: string
  renewalFrequency: 'monthly' | 'quarterly' | 'annually'
  nextRenewalDate: string
  amount: number
  currency: string
  isActive: boolean
}

// User Access Types
export interface UserAccess {
  id: string
  userId: string
  serviceId: string
  productId: string
  accessLevel: 'read' | 'write' | 'admin'
  expiryDate?: string
  assignedBy: string
  assignedAt: string
  isActive: boolean
}

// Workflow Types
export interface WorkflowTask {
  id: string
  type: 'onboarding' | 'offboarding'
  title: string
  description: string
  assignedTo: string
  targetUserId: string
  serviceId: string
  productId?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  completedAt?: string
  completedBy?: string
  comments: TaskComment[]
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'escalated'

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: string
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

