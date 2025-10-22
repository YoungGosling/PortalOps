import type {
  User,
  Service,
  Product,
  PaymentInfo,
  PaymentSummary,
  WorkflowTask,
  BillAttachment,
  MasterFileInvoice,
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
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentProductAssignmentRequest,
  DepartmentProductAssignmentResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(includeAuth: boolean = true, includeContentType: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth && typeof window !== 'undefined') {
      // First try to get token from localStorage (traditional login)
      let token = localStorage.getItem('access_token');
      
      // If no traditional token, check for NextAuth session (Azure login)
      if (!token) {
        try {
          const sessionResponse = await fetch('/api/auth/session');
          if (sessionResponse.ok) {
            const session = await sessionResponse.json();
            // Use Azure ID token for backend authentication
            if (session?.tokens?.id_token) {
              token = session.tokens.id_token;
            }
          }
        } catch (error) {
          console.error('Failed to fetch NextAuth session:', error);
        }
      }
      
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
    
    // Get headers (now async to support NextAuth session check)
    const authHeaders = await this.getHeaders(true, !isFormData);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
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
    const response = await this.request<any[]>('/api/v2/payment-register');
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
      invoices: item.paymentInfo.invoices || [],
      is_complete: item.paymentInfo.status === 'complete',
      created_at: item.paymentInfo.createdAt,
      updated_at: item.paymentInfo.updatedAt,
    }));
  }

  async updatePaymentInfo(
    productId: string,
    data: PaymentUpdateRequest | FormData
  ): Promise<void> {
    return this.request<void>(`/api/v2/payment-register/${productId}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    return this.request<PaymentSummary>('/api/payment-register/summary');
  }

  // Invoice Management
  async uploadInvoices(productId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return this.request<void>(`/api/v2/invoices/${productId}/invoices`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    return this.request<void>(`/api/v2/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/v2/invoices/${invoiceId}`;
    const headers = await this.getHeaders();
    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download invoice: ${response.status}`);
    }

    return response.blob();
  }

  async getMasterFileInvoices(productId?: string): Promise<MasterFileInvoice[]> {
    const query = productId ? `?productId=${productId}` : '';
    return this.request<MasterFileInvoice[]>(`/api/v2/master-files/invoices${query}`);
  }

  // Users
  async getUsers(productId?: string): Promise<User[]> {
    const query = productId ? `?productId=${productId}` : '';
    const response = await this.request<{ data: any[]; pagination: any }>(`/api/users${query}`);
    // Backend returns paginated response with { data, pagination }
    // Transform to match frontend User type (v3: include new fields)
    return response.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      department_id: user.department_id,
      position: user.position,
      hire_date: user.hire_date,
      resignation_date: user.resignation_date,
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
    const headers = await this.getHeaders();
    const response = await fetch(url, {
      headers,
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

  // v3: Departments
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/api/departments');
  }

  async createDepartment(data: DepartmentCreateRequest): Promise<Department> {
    return this.request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: DepartmentUpdateRequest): Promise<Department> {
    return this.request<Department>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.request<void>(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartmentProducts(departmentId: string): Promise<Product[]> {
    return this.request<Product[]>(`/api/departments/${departmentId}/products`);
  }

  async setDepartmentProducts(
    departmentId: string,
    data: DepartmentProductAssignmentRequest
  ): Promise<DepartmentProductAssignmentResponse> {
    return this.request<DepartmentProductAssignmentResponse>(
      `/api/departments/${departmentId}/products`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // v3: Get Services with Products (for tree selection)
  async getServicesWithProducts(): Promise<Service[]> {
    const services = await this.getServices();
    // For each service, fetch its products
    const servicesWithProducts = await Promise.all(
      services.map(async (service) => {
        const products = await this.getProducts(service.id);
        return {
          ...service,
          products,
        };
      })
    );
    return servicesWithProducts;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

