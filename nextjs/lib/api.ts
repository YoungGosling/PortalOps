import type {
  User,
  Service,
  Product,
  PaymentInfo,
  PaymentSummary,
  WorkflowTask,
  BillAttachment,
  LoginRequest,
  LoginResponse,
  ServiceCreateRequest,
  ServiceUpdateRequest,
  ProductCreateRequest,
  ProductUpdateRequest,
  UserCreateRequest,
  UserUpdateRequest,
  PaymentUpdateRequest,
  DashboardStats,
  RecentActivity,
  UpcomingRenewal,
  PendingTasksCount,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = true, includeContentType: boolean = true): HeadersInit {
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Check if body is FormData to avoid setting Content-Type
    const isFormData = options.body instanceof FormData;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(true, !isFormData),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Clear tokens from both localStorage and cookie
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Redirect to signin page
          window.location.href = '/signin';
        }
      }
      
      const error = await response.json().catch(() => ({
        error: 'unknown_error',
        message: 'An unknown error occurred',
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/services');
  }

  async createService(data: ServiceCreateRequest): Promise<Service> {
    return this.request<Service>('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: ServiceUpdateRequest): Promise<Service> {
    return this.request<Service>(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string): Promise<void> {
    return this.request<void>(`/api/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts(serviceId?: string): Promise<Product[]> {
    const query = serviceId ? `?serviceId=${serviceId}` : '';
    return this.request<Product[]>(`/api/products${query}`);
  }

  async createProduct(data: ProductCreateRequest): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: ProductUpdateRequest): Promise<Product> {
    return this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment Register
  async getPaymentRegister(): Promise<PaymentInfo[]> {
    const response = await this.request<any[]>('/api/payment-register');
    // Transform camelCase nested API response to snake_case flat structure
    return response.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      service_name: item.serviceName,
      amount: item.paymentInfo.amount ? parseFloat(item.paymentInfo.amount) : undefined,
      cardholder_name: item.paymentInfo.cardholderName,
      expiry_date: item.paymentInfo.expiryDate,
      payment_method: item.paymentInfo.paymentMethod,
      bill_attachment_path: item.paymentInfo.billAttachmentPath,
      is_complete: item.paymentInfo.status === 'complete',
      created_at: item.paymentInfo.createdAt,
      updated_at: item.paymentInfo.updatedAt,
    }));
  }

  async updatePaymentInfo(
    productId: string,
    data: PaymentUpdateRequest | FormData
  ): Promise<void> {
    return this.request<void>(`/api/payment-register/${productId}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    return this.request<PaymentSummary>('/api/payment-register/summary');
  }

  // Users
  async getUsers(productId?: string): Promise<User[]> {
    const query = productId ? `?productId=${productId}` : '';
    const response = await this.request<{ data: any[]; pagination: any }>(`/api/users${query}`);
    // Backend returns paginated response with { data, pagination }
    // Transform to match frontend User type
    return response.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      roles: user.roles || [],
      assignedProductIds: user.assignedProductIds || [],
    }));
  }

  async createUser(data: UserCreateRequest): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UserUpdateRequest): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Inbox & Workflows
  async getTasks(): Promise<WorkflowTask[]> {
    return this.request<WorkflowTask[]>('/api/inbox/tasks');
  }

  async completeTask(
    taskId: string,
    data?: UserCreateRequest
  ): Promise<WorkflowTask> {
    return this.request<WorkflowTask>(`/api/inbox/tasks/${taskId}/complete`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : JSON.stringify({}),
    });
  }

  // Master Files
  async getMasterFiles(): Promise<BillAttachment[]> {
    return this.request<BillAttachment[]>('/api/master-files/attachments');
  }

  async downloadAttachment(fileId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/master-files/attachments/${fileId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    return response.blob();
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    return this.request<RecentActivity[]>(`/api/dashboard/recent-activities?limit=${limit}`);
  }

  async getUpcomingRenewals(limit: number = 3): Promise<UpcomingRenewal[]> {
    return this.request<UpcomingRenewal[]>(`/api/dashboard/upcoming-renewals?limit=${limit}`);
  }

  async getPendingTasksCount(): Promise<PendingTasksCount> {
    return this.request<PendingTasksCount>('/api/dashboard/pending-tasks-count');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

