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
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentProductAssignmentRequest,
  DepartmentProductAssignmentResponse,
  ProductStatus,
  ProductStatusCreateRequest,
  ProductStatusUpdateRequest,
  PaymentMethod,
  PaymentMethodCreateRequest,
  PaymentMethodUpdateRequest,
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
    
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      });
    } catch (error: any) {
      // Network error or CORS issue
      console.error('Fetch error:', error);
      console.error('URL:', url);
      console.error('Headers:', authHeaders);
      throw new Error(`Network error: Unable to connect to server. Please check if the backend is running at ${this.baseUrl}`);
    }

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
  async getServices(page: number = 1, limit: number = 20): Promise<{ data: Service[]; pagination: { total: number; page: number; limit: number } }> {
    return this.request<{ data: Service[]; pagination: { total: number; page: number; limit: number } }>(`/api/services?page=${page}&limit=${limit}`);
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
  async getProducts(serviceId?: string, page: number = 1, limit: number = 20): Promise<{ data: Product[]; pagination: { total: number; page: number; limit: number } }> {
    let query = `?page=${page}&limit=${limit}`;
    if (serviceId) {
      query += `&serviceId=${serviceId}`;
    }
    return this.request<{ data: Product[]; pagination: { total: number; page: number; limit: number } }>(`/api/products${query}`);
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
  async getPaymentRegister(page: number = 1, limit: number = 20): Promise<{ data: PaymentInfo[]; pagination: { total: number; page: number; limit: number } }> {
    const response = await this.request<{ data: any[]; pagination: any }>(`/api/v2/payment-register?page=${page}&limit=${limit}`);
    // Transform camelCase nested API response to snake_case flat structure
    const data = response.data.map((item) => ({
      id: item.paymentInfo?.id,
      product_id: item.productId,
      product_name: item.productName,
      product_description: item.productDescription,
      service_name: item.serviceName,
      service_vendor: item.serviceVendor,
      amount: item.paymentInfo?.amount ? parseFloat(item.paymentInfo.amount) : undefined,
      cardholder_name: item.paymentInfo?.cardholderName,
      expiry_date: item.paymentInfo?.expiryDate,
      payment_method: item.paymentInfo?.paymentMethod,
      payment_method_id: item.paymentInfo?.paymentMethodId,
      payment_method_description: item.paymentInfo?.paymentMethodDescription,
      payment_date: item.paymentInfo?.paymentDate,
      usage_start_date: item.paymentInfo?.usageStartDate,
      usage_end_date: item.paymentInfo?.usageEndDate,
      reporter: item.paymentInfo?.reporter,
      bill_attachment_path: item.paymentInfo?.billAttachmentPath,
      invoices: item.paymentInfo?.invoices || [],
      is_complete: item.paymentInfo?.status === 'complete',
      payment_status: item.paymentInfo?.status,
      product_status: item.productStatus,
      created_at: item.paymentInfo?.createdAt,
      updated_at: item.paymentInfo?.updatedAt,
    }));
    
    return {
      data,
      pagination: response.pagination
    };
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

  // V2: Update payment by payment ID (for one-to-many support)
  async updatePaymentById(
    paymentId: string,
    data: PaymentUpdateRequest | FormData
  ): Promise<void> {
    return this.request<void>(`/api/v2/payment-register/payments/${paymentId}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // V2: Delete payment by payment ID
  async deletePaymentById(paymentId: string): Promise<void> {
    return this.request<void>(`/api/v2/payment-register/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // V2: Get all payments for a specific product
  async getProductPayments(productId: string): Promise<PaymentInfo[]> {
    const response = await this.request<any[]>(`/api/v2/payment-register/products/${productId}/payments`);
    return response.map((item) => ({
      id: item.paymentInfo?.id || item.paymentId,
      payment_id: item.paymentId,
      product_id: item.productId,
      product_name: item.productName,
      product_description: item.productDescription,
      service_name: item.serviceName,
      service_vendor: item.serviceVendor,
      amount: item.paymentInfo?.amount ? parseFloat(item.paymentInfo.amount) : undefined,
      cardholder_name: item.paymentInfo?.cardholderName,
      expiry_date: item.paymentInfo?.expiryDate,
      payment_method: item.paymentInfo?.paymentMethod,
      payment_method_id: item.paymentInfo?.paymentMethodId,
      payment_method_description: item.paymentInfo?.paymentMethodDescription,
      payment_date: item.paymentInfo?.paymentDate,
      usage_start_date: item.paymentInfo?.usageStartDate,
      usage_end_date: item.paymentInfo?.usageEndDate,
      reporter: item.paymentInfo?.reporter,
      invoices: item.paymentInfo?.invoices || [],
      is_complete: item.paymentInfo?.status === 'complete',
      payment_status: item.paymentInfo?.status,
      product_status: item.productStatus,
      created_at: item.paymentInfo?.createdAt,
      updated_at: item.paymentInfo?.updatedAt,
    }));
  }

  // V2: Create a new payment record for an existing product
  async createPaymentForProduct(
    productId: string,
    data: PaymentUpdateRequest | FormData
  ): Promise<{ id: string; product_id: string; status: string }> {
    return this.request<{ id: string; product_id: string; status: string }>(
      `/api/v2/payment-register/products/${productId}/payments`,
      {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      }
    );
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    return this.request<PaymentSummary>('/api/payment-register/summary');
  }

  // Invoice Management
  async uploadInvoices(paymentInfoId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return this.request<void>(`/api/v2/invoices/payments/${paymentInfoId}/invoices`, {
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

  // Users
  async getUsers(productId?: string, page: number = 1, limit: number = 20): Promise<{ data: User[]; pagination: { total: number; page: number; limit: number } }> {
    let query = `?page=${page}&limit=${limit}`;
    if (productId) {
      query += `&productId=${productId}`;
    }
    const response = await this.request<{ data: any[]; pagination: any }>(`/api/users${query}`);
    // Backend returns paginated response with { data, pagination }
    // Transform to match frontend User type (v3: include new fields)
    const users = response.data.map((user) => ({
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
    
    return {
      data: users,
      pagination: response.pagination
    };
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
  async getTasks(page: number = 1, limit: number = 20): Promise<{ data: WorkflowTask[]; pagination: { total: number; page: number; limit: number } }> {
    return this.request<{ data: WorkflowTask[]; pagination: { total: number; page: number; limit: number } }>(`/api/inbox/tasks?page=${page}&limit=${limit}`);
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
    const response = await this.getServices(1, 100); // Fetch up to 100 services
    // For each service, fetch its products (limit is 100 max per backend API)
    const servicesWithProducts = await Promise.all(
      response.data.map(async (service) => {
        try {
          const productsResponse = await this.getProducts(service.id, 1, 100);
          return {
            ...service,
            products: productsResponse.data,
          };
        } catch (error) {
          // If fetching products fails for a service, return service with empty products array
          console.warn(`Failed to fetch products for service ${service.id}:`, error);
          return {
            ...service,
            products: [],
          };
        }
      })
    );
    return servicesWithProducts;
  }

  // V2: Product Statuses (Master Data)
  async getProductStatuses(): Promise<ProductStatus[]> {
    return this.request<ProductStatus[]>('/api/admin/product-statuses');
  }

  async createProductStatus(data: ProductStatusCreateRequest): Promise<ProductStatus> {
    return this.request<ProductStatus>('/api/admin/product-statuses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProductStatus(id: number, data: ProductStatusUpdateRequest): Promise<ProductStatus> {
    return this.request<ProductStatus>(`/api/admin/product-statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProductStatus(id: number): Promise<void> {
    return this.request<void>(`/api/admin/product-statuses/${id}`, {
      method: 'DELETE',
    });
  }

  // V2: Payment Methods (Master Data)
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.request<PaymentMethod[]>('/api/admin/payment-methods');
  }

  async createPaymentMethod(data: PaymentMethodCreateRequest): Promise<PaymentMethod> {
    return this.request<PaymentMethod>('/api/admin/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentMethod(id: number, data: PaymentMethodUpdateRequest): Promise<PaymentMethod> {
    return this.request<PaymentMethod>(`/api/admin/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: number): Promise<void> {
    return this.request<void>(`/api/admin/payment-methods/${id}`, {
      method: 'DELETE',
    });
  }

  // Workflow Tasks with Details
  async getTaskWithDetails(taskId: string): Promise<WorkflowTask> {
    return this.request<WorkflowTask>(`/api/inbox/tasks/${taskId}`);
  }

  async uploadTaskAttachment(taskId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<void>(`/api/inbox/tasks/${taskId}/attachment`, {
      method: 'POST',
      body: formData,
    });
  }

  async completeTaskWithAttachment(taskId: string): Promise<void> {
    return this.request<void>(`/api/inbox/tasks/${taskId}/complete`, {
      method: 'POST',
    });
  }

  async downloadTaskAttachment(taskId: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/inbox/tasks/${taskId}/attachment`;
    const headers = await this.getHeaders();
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }
    
    return response.blob();
  }

  async deleteTask(taskId: string): Promise<void> {
    return this.request<void>(`/api/inbox/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

