// Core Types for PortalOps v2.0

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;         // Deprecated: kept for backward compatibility
  department_id?: string;      // v3: FK to Department (UUID)
  position?: string;           // v3: Job title/position
  hire_date?: string;          // v3: Hire date (YYYY-MM-DD)
  resignation_date?: string;   // v3: Resignation date (YYYY-MM-DD), nullable
  roles: ('Admin' | 'ServiceAdmin')[];
  assignedProductIds: string[];
  sap_ids?: string[];          // SAP user IDs associated with this user
}

export interface ProductSimple {
  id: string;
  name: string;
  status?: string;  // Product status name (e.g., 'Active', 'Inactive', 'Deprecated')
}

export interface AdminSimple {
  id: string;
  name: string;
  email: string;
}

export interface Service {
  id: string;
  name: string;
  vendor?: string;
  product_count: number;
  products?: ProductSimple[];
  admins?: AdminSimple[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;        // V2: Product description
  service_id: string;
  service_name?: string;
  status_id?: number;          // V2: FK to product_statuses
  status?: string;             // V2: Product status name (resolved from FK)
  latest_payment_date?: string;       // V2: Latest payment date
  latest_usage_start_date?: string;   // V2: Latest usage start date
  latest_usage_end_date?: string;     // V2: Latest usage end date
  created_at?: string;
  updated_at?: string;
}

export interface PaymentInvoice {
  id: string;
  original_file_name: string;
  url: string;
}

export interface PaymentInfo {
  id?: string;                    // V2: Payment ID (UUID) - required for one-to-many
  payment_id?: string;            // V2: Alias for payment ID (for clarity in UI)
  product_id: string | null;      // V2: Can be NULL if product was deleted
  product_name: string | null;    // V2: Can be NULL if product was deleted
  product_description?: string;   // V2: Product description
  service_name: string | null;    // V2: Can be NULL if product was deleted
  service_vendor?: string;        // V2: Service vendor
  amount?: number;
  cardholder_name?: string;
  expiry_date?: string;
  payment_method?: string;        // V2: Payment method name (resolved from FK)
  payment_method_id?: number;     // V2: FK to payment_methods
  payment_method_description?: string; // V2: Payment method description
  payment_date?: string;          // V2: Payment date (YYYY-MM-DD)
  usage_start_date?: string;      // V2: Usage start date (YYYY-MM-DD)
  usage_end_date?: string;        // V2: Usage end date (YYYY-MM-DD)
  reporter?: string;              // V2: Reporter name
  bill_attachment_path?: string;  // Deprecated but kept for compatibility
  invoices?: PaymentInvoice[];
  is_complete: boolean;
  status?: 'incomplete' | 'complete' | 'error'; // V2: Payment status including error state
  payment_status?: string;        // V2: Payment status (complete/incomplete)
  product_status?: string;        // V2: Product status name
  created_at?: string;
  updated_at?: string;
}

// V2: Extended product type with all payment records (one-to-many)
export interface ProductWithPayments extends Product {
  payments?: PaymentInfo[];       // All payment records for this product
  payment_count?: number;         // Total number of payments
}

export interface WorkflowTask {
  id: string;
  type: 'onboarding' | 'offboarding';
  employee_name: string;
  employee_email: string;
  employee_department?: string;
  employee_position?: string;
  employee_hire_date?: string;
  employee_resignation_date?: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  target_user_id?: string;
  attachment_path?: string;
  attachment_original_name?: string;
  assigned_products?: ProductWithServiceAdmin[];
}

export interface ProductWithServiceAdmin {
  product_id: string;
  product_name: string;
  service_name: string;
  service_admins: { name: string; email: string; }[];
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
  adminUserIds?: string[];
}

export interface ServiceUpdateRequest {
  name?: string;
  vendor?: string;
  associateProductIds?: string[];
  disassociateProductIds?: string[];
  adminUserIds?: string[];
}

export interface ProductCreateRequest {
  name: string;
  description?: string;    // V2: Product description
  serviceId: string;
  statusId?: number;       // V2: Product status ID (defaults to 1 - Active)
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;    // V2: Product description
  serviceId?: string;
  statusId?: number;       // V2: Product status ID
}

export interface UserCreateRequest {
  name: string;
  email: string;
  department?: string;       // Deprecated
  department_id?: string;    // v3: FK to Department (UUID)
  position?: string;         // v3: Job title
  hire_date?: string;        // v3: Hire date (YYYY-MM-DD)
  resignation_date?: string; // v3: Resignation date (YYYY-MM-DD)
  role?: 'Admin' | 'ServiceAdmin';
  assignedProductIds?: string[];
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  department?: string;       // Deprecated
  department_id?: string;    // v3: FK to Department (UUID)
  position?: string;         // v3: Job title
  hire_date?: string;        // v3: Hire date (YYYY-MM-DD)
  resignation_date?: string; // v3: Resignation date (YYYY-MM-DD)
  role?: 'Admin' | 'ServiceAdmin';
  assignedProductIds?: string[];
}

export interface PaymentUpdateRequest {
  amount?: number;
  cardholder_name?: string;
  expiry_date?: string;
  payment_method?: string;           // Deprecated: replaced by payment_method_id
  payment_method_id?: number;        // V2: FK to payment_methods
  payment_date?: string;             // V2: Payment date (YYYY-MM-DD)
  usage_start_date?: string;         // V2: Usage start date (YYYY-MM-DD)
  usage_end_date?: string;           // V2: Usage end date (YYYY-MM-DD)
  reporter?: string;                 // V2: Reporter name
}

// v3: Department Types
export interface Department {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentCreateRequest {
  name: string;
}

export interface DepartmentUpdateRequest {
  name?: string;
}

export interface DepartmentProductAssignmentRequest {
  product_ids: string[];
}

export interface DepartmentProductAssignmentResponse {
  assigned_product_ids: string[];
}

// v3: Service with Products Tree Structure (for selection component)
export interface ServiceProductTree {
  service: Service;
  products: Product[];
  expanded: boolean;
}

// V2: Master Data Types
export interface ProductStatus {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductStatusCreateRequest {
  name: string;
  description?: string;
}

export interface ProductStatusUpdateRequest {
  name?: string;
  description?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethodCreateRequest {
  name: string;
  description?: string;
}

export interface PaymentMethodUpdateRequest {
  name?: string;
  description?: string;
}

