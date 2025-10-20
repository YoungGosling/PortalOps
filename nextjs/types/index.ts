// Core Types for PortalOps v2.0

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  roles: ('Admin' | 'ServiceAdmin')[];
  assignedProductIds: string[];
}

export interface ProductSimple {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  vendor?: string;
  product_count: number;
  products?: ProductSimple[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  service_id: string;
  service_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentInvoice {
  id: string;
  original_file_name: string;
  url: string;
}

export interface PaymentInfo {
  product_id: string;
  product_name: string;
  service_name: string;
  amount?: number;
  cardholder_name?: string;
  expiry_date?: string;
  payment_method?: string;
  bill_attachment_path?: string;
  invoices?: PaymentInvoice[];
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowTask {
  id: string;
  type: 'onboarding' | 'offboarding';  // Backend uses 'type' not 'task_type'
  employee_name: string;
  employee_email: string;
  employee_department?: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  target_user_id?: string;  // Null for onboarding until user is created
}

export interface BillAttachment {
  id: string;
  filename: string;
  product_id: string;
  product_name: string;
  service_name: string;
  upload_date: string;
  file_size?: number;
}

export interface MasterFileInvoice {
  id: string;
  file_name: string;
  original_file_name: string;
  product_id: string;
  product_name: string;
  service_name: string;
  created_at: string;
}

export interface PaymentSummary {
  incomplete_count: number;
}

export interface DashboardStats {
  totalServices: number;
  totalProducts: number;
  totalUsers: number;
  totalAmount: number;
  incompletePayments: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  actorName: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

export interface UpcomingRenewal {
  productId: string;
  productName: string;
  serviceName: string;
  expiryDate: string;
  amount?: number;
  cardholderName?: string;
  paymentMethod?: string;
}

export interface PendingTasksCount {
  pendingCount: number;
}

// API Response Types
export interface ApiError {
  error: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ServiceCreateRequest {
  name: string;
  vendor?: string;
  productIds?: string[];
}

export interface ServiceUpdateRequest {
  name?: string;
  vendor?: string;
  associateProductIds?: string[];
  disassociateProductIds?: string[];
}

export interface ProductCreateRequest {
  name: string;
  serviceId: string;
}

export interface ProductUpdateRequest {
  name?: string;
  serviceId?: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  department?: string;
  role?: 'Admin' | 'ServiceAdmin';
  assignedProductIds?: string[];
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  department?: string;
  role?: 'Admin' | 'ServiceAdmin';
  assignedProductIds?: string[];
}

export interface PaymentUpdateRequest {
  amount?: number;
  cardholder_name?: string;
  expiry_date?: string;
  payment_method?: string;
}

