// API Configuration and HTTP Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

interface ApiError {
  error: string
  message: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null
  private initialized: boolean = false

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Initialize token from localStorage if available
    this.initializeToken()
  }

  private initializeToken() {
    if (typeof window !== 'undefined' && !this.initialized) {
      const storedToken = localStorage.getItem('portalops_token')
      if (storedToken) {
        this.token = storedToken
        console.log('[API Client] Token initialized from localStorage:', storedToken.substring(0, 30) + '...')
      } else {
        console.warn('[API Client] No token found in localStorage')
      }
      this.initialized = true
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('portalops_token', token)
      console.log('[API Client] Token set and stored in localStorage:', token.substring(0, 30) + '...')
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portalops_token')
      console.log('[API Client] Token cleared from memory and localStorage')
    }
  }

  getToken(): string | null {
    // Always try to get the latest token from localStorage
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('portalops_token')
      if (storedToken && storedToken !== this.token) {
        // Token in localStorage is different from memory, update memory
        this.token = storedToken
        console.log('[API Client] Token synced from localStorage')
      }
      if (storedToken) {
        return storedToken
      }
    }
    
    // Fallback to memory token
    if (this.token) {
      return this.token
    }
    
    return null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
      console.log(`[API Request] ${options.method || 'GET'} ${endpoint} - With Auth Token: ${token.substring(0, 30)}...`)
    } else {
      console.error(`[API Request] ${options.method || 'GET'} ${endpoint} - ⚠️  NO TOKEN! Request will likely fail with 403`)
      // Check if token exists in localStorage for debugging
      if (typeof window !== 'undefined') {
        const lsToken = localStorage.getItem('portalops_token')
        if (lsToken) {
          console.error('[API Request] Token EXISTS in localStorage but not returned by getToken()!')
        } else {
          console.error('[API Request] No token in localStorage either')
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })
      
      console.log(`[API Response] ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`)

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: 'network_error',
          message: `HTTP ${response.status}: ${response.statusText}`
        }))
        throw new Error(errorData.message || `Request failed with status ${response.status}`)
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// API Response Types
export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
  }
}

// Updated for v2.0
export interface UserProfile {
  id: string
  name: string
  email: string
  department?: string
  roles: string[]
  assignedServiceIds: string[] // Simplified permissions
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),
  
  getProfile: () =>
    apiClient.get<UserProfile>('/auth/me'),
}

// Users API
export const usersApi = {
  getUsers: (params?: { search?: string; productId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.productId) searchParams.append('productId', params.productId)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<any>>(`/users${query ? `?${query}` : ''}`)
  },

  createUser: (userData: {
    name: string
    email: string
    department: string
    role?: 'Admin' | 'ServiceAdmin'
    assignedServiceIds?: string[]
  }) =>
    apiClient.post<any>('/users', userData),

  updateUser: (userId: string, userData: {
    name?: string
    email?: string
    department?: string
    role?: 'Admin' | 'ServiceAdmin'
    assignedServiceIds?: string[]
  }) =>
    apiClient.put<any>(`/users/${userId}`, userData),

  deleteUser: (userId: string) =>
    apiClient.delete(`/users/${userId}`),
}

// Services API
export const servicesApi = {
  getServices: () =>
    apiClient.get<any[]>('/services'),

  getService: (serviceId: string) =>
    apiClient.get<any>(`/services/${serviceId}`),

  createService: (serviceData: { name: string; vendor?: string; productIds?: string[] }) =>
    apiClient.post<any>('/services', serviceData),

  updateService: (serviceId: string, serviceData: { 
    name?: string; 
    vendor?: string;
    associateProductIds?: string[];
    disassociateProductIds?: string[];
  }) =>
    apiClient.put<any>(`/services/${serviceId}`, serviceData),

  deleteService: (serviceId: string) =>
    apiClient.delete(`/services/${serviceId}`),

  // Get unassociated products (for Add/Edit Service panel)
  getUnassociatedProducts: () =>
    apiClient.get<any[]>('/services/unassociated-products'),
}

// Products API
export const productsApi = {
  getProducts: (serviceId?: string) => {
    const query = serviceId ? `?serviceId=${serviceId}` : ''
    return apiClient.get<any[]>(`/products${query}`)
  },

  createProduct: (productData: { name: string; serviceId: string }) =>
    apiClient.post<any>('/products', productData),

  updateProduct: (productId: string, productData: { name?: string; serviceId?: string }) =>
    apiClient.put<any>(`/products/${productId}`, productData),

  deleteProduct: (productId: string) =>
    apiClient.delete(`/products/${productId}`),
}

// Payment Register API (Updated for v2.0 - multipart/form-data support)
export const paymentApi = {
  getPaymentRegister: () =>
    apiClient.get<any[]>('/payment-register'),

  getPaymentSummary: () =>
    apiClient.get<{ incompleteCount: number }>('/payment-register/summary'),

  // Combined update with optional file upload
  updatePaymentInfo: async (productId: string, paymentData: {
    amount?: number
    cardholderName?: string
    expiryDate?: string
    paymentMethod?: string
    billAttachment?: File
  }) => {
    const formData = new FormData()
    if (paymentData.amount !== undefined) formData.append('amount', paymentData.amount.toString())
    if (paymentData.cardholderName) formData.append('cardholderName', paymentData.cardholderName)
    if (paymentData.expiryDate) formData.append('expiryDate', paymentData.expiryDate)
    if (paymentData.paymentMethod) formData.append('paymentMethod', paymentData.paymentMethod)
    if (paymentData.billAttachment) formData.append('billAttachment', paymentData.billAttachment)
    
    const token = apiClient.getToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/payment-register/${productId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update payment info' }))
      throw new Error(errorData.message || 'Failed to update payment info')
    }
    
    return response.json()
  },

  // Upload bill attachment separately
  uploadBillAttachment: async (productId: string, file: File) => {
    const formData = new FormData()
    formData.append('billAttachment', file)
    
    const token = apiClient.getToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/payment-register/${productId}/attachment`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload bill attachment' }))
      throw new Error(errorData.message || 'Failed to upload bill attachment')
    }
    
    return response.json()
  },
}

// Workflow API (Inbox - Onboarding/Offboarding) - Updated for v2.0
export const workflowApi = {
  getTasks: (status?: 'pending' | 'completed') => {
    const query = status ? `?status=${status}` : ''
    return apiClient.get<any[]>(`/inbox/tasks${query}`)
  },

  getTask: (taskId: string) =>
    apiClient.get<any>(`/inbox/tasks/${taskId}`),

  completeTask: (taskId: string, data?: {
    role?: 'Admin' | 'ServiceAdmin'
    assignedServiceIds?: string[]
  }) =>
    apiClient.post(`/inbox/tasks/${taskId}/complete`, data || {}),
}

// Master Files API (Bill Attachments) - Updated for v2.0
export const masterFilesApi = {
  getAttachments: () =>
    apiClient.get<any[]>('/master-files/attachments'),

  downloadAttachment: (fileId: string) => {
    const token = apiClient.getToken()
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/master-files/attachments/${fileId}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
  },
}

// Audit Logs API
export const auditApi = {
  getAuditLogs: (params?: { actorUserId?: string; action?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.actorUserId) searchParams.append('actorUserId', params.actorUserId)
    if (params?.action) searchParams.append('action', params.action)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<any>>(`/audit-logs${query ? `?${query}` : ''}`)
  },
}

export default apiClient

