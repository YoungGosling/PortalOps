// API Configuration and HTTP Client
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

interface ApiError {
  error: string
  message: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage on initialization
    const storedUser = localStorage.getItem('portalops_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      this.token = userData.accessToken
    }
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
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

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

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

export interface UserProfile {
  id: string
  name: string
  email: string
  roles: string[]
  permissions: {
    services: string[]
    products: string[]
  }
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
  getUsers: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<PaginatedResponse<any>>(`/users${query ? `?${query}` : ''}`)
  },

  createUser: (userData: any) =>
    apiClient.post<any>('/users', userData),

  updateUser: (userId: string, userData: any) =>
    apiClient.put<any>(`/users/${userId}`, userData),

  deleteUser: (userId: string) =>
    apiClient.delete(`/users/${userId}`),

  updateUserPermissions: (userId: string, permissions: any) =>
    apiClient.put(`/users/${userId}/permissions`, permissions),
}

// Services API
export const servicesApi = {
  getServices: () =>
    apiClient.get<any[]>('/services'),

  getService: (serviceId: string) =>
    apiClient.get<any>(`/services/${serviceId}`),

  createService: (serviceData: any) =>
    apiClient.post<any>('/services', serviceData),

  updateService: (serviceId: string, serviceData: any) =>
    apiClient.put<any>(`/services/${serviceId}`, serviceData),

  deleteService: (serviceId: string) =>
    apiClient.delete(`/services/${serviceId}`),

  // Products within services
  createProduct: (serviceId: string, productData: any) =>
    apiClient.post<any>(`/services/${serviceId}/products`, productData),

  updateProduct: (serviceId: string, productId: string, productData: any) =>
    apiClient.put<any>(`/services/${serviceId}/products/${productId}`, productData),

  deleteProduct: (serviceId: string, productId: string) =>
    apiClient.delete(`/services/${serviceId}/products/${productId}`),
}

// Products API
export const productsApi = {
  getProducts: () =>
    apiClient.get<any[]>('/products'),

  createProduct: (productData: { name: string; url?: string; serviceId: string }) =>
    apiClient.post<any>('/products', productData),

  updateProduct: (productId: string, productData: any) =>
    apiClient.put<any>(`/products/${productId}`, productData),

  deleteProduct: (productId: string) =>
    apiClient.delete(`/products/${productId}`),
}

// Payment Register API
export const paymentApi = {
  getPaymentRegister: () =>
    apiClient.get<any[]>('/payment-register'),

  getPaymentSummary: () =>
    apiClient.get<{ incompleteCount: number }>('/payment-register/summary'),

  createPaymentRegisterItem: (itemData: any) =>
    apiClient.post<any>('/payment-register', itemData),

  updatePaymentInfo: (productId: string, paymentData: any) =>
    apiClient.put(`/payment-register/${productId}`, paymentData),
}

// Workflow API
export const workflowApi = {
  getTasks: (status?: string) => {
    const query = status ? `?status=${status}` : ''
    return apiClient.get<any[]>(`/inbox/tasks${query}`)
  },

  getTask: (taskId: string) =>
    apiClient.get<any>(`/inbox/tasks/${taskId}`),

  updateTask: (taskId: string, taskData: any) =>
    apiClient.put(`/inbox/tasks/${taskId}`, taskData),
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
