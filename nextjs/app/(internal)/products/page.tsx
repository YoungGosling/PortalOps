'use client';

import React, { useState, useEffect } from 'react';
import { fetchQueryServicesAction } from '@/api/services/query_services/action';
import { queryProductsAction } from '@/api/products/query_products/action';
import { queryPaymentRegisterV2Action } from '@/api/payment_register/query_payment_register_v2/action';
import { fetchQueryPaymentMethodsAction } from '@/api/payment_method/query_payment_methods/action';
import { fetchQueryCurrenciesAction } from '@/api/currency/query_currencies/action';
import { fetchListUserAction } from '@/api/users/list_user/action';
import type { Product, Service, PaymentInfo, PaymentMethod, Currency, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { Plus, Package, Filter, Loader2, Edit2, Trash2, Building, ChevronDown, ChevronUp, Calendar, DollarSign, Tag, Receipt, PlusCircle, ChevronLeft, ChevronRight, Search, X, Upload, Users, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [addingPaymentForProduct, setAddingPaymentForProduct] = useState<Product | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Users dialog state
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedProductUsers, setSelectedProductUsers] = useState<{
    productName: string;
    users: User[];
  } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Admins dialog state
  const [adminsDialogOpen, setAdminsDialogOpen] = useState(false);
  const [selectedProductAdmins, setSelectedProductAdmins] = useState<{
    productName: string;
    admins: { id: string; name: string; email: string }[];
  } | null>(null);
  const [loadingUserCounts, setLoadingUserCounts] = useState(false);
  const [productUserCounts, setProductUserCounts] = useState<Record<string, number>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(20);
  const [pageInput, setPageInput] = useState('');

  const fetchProducts = async (serviceId?: string, page: number = currentPage, search?: string) => {
    try {
      setLoading(true);
      const response = await queryProductsAction(serviceId, page, pageSize, search);
      // Convert null to undefined for Product type compatibility
      // Filter out products with null service_id as Product type requires service_id to be a string
      const products: Product[] = response.products
        .filter(p => p.service_id !== null)
        .map(p => ({
          ...p,
          service_id: p.service_id!, // Type assertion safe after filter
          description: p.description ?? undefined,
          service_name: p.service_name ?? undefined,
          status: p.status ?? undefined,
          latest_payment_date: p.latest_payment_date ?? undefined,
          latest_usage_start_date: p.latest_usage_start_date ?? undefined,
          latest_usage_end_date: p.latest_usage_end_date ?? undefined,
        }));
      setProducts(products);
      setCurrentPage(response.page);
      setTotalProducts(response.total);
      setTotalPages(Math.ceil(response.total / response.limit));
      
      // Immediately start loading user counts after products are loaded
      if (products.length > 0) {
        loadUserCountsForProducts(products);
      }
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      // Fetch all services without pagination for the filter dropdown
      const response = await fetchQueryServicesAction(1, 100);
      // Transform response to match expected format
      const services: Service[] = response.data.map(s => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor ?? undefined, // Convert null to undefined
        product_count: s.productCount || 0,
        products: s.products,
        admins: s.admins,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
      setServices(services);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      // Fetch all payments without pagination for product payment display
      const response = await queryPaymentRegisterV2Action(1, 1000);
      
      // Transform camelCase API response to snake_case for PaymentInfo type
      const transformedData: PaymentInfo[] = response.data.map((item) => ({
        id: item.paymentInfo?.id,
        product_id: item.productId || null,
        product_name: item.productName || '',
        product_description: item.productDescription || undefined,
        service_name: item.serviceName || '',
        service_vendor: item.serviceVendor || undefined,
        amount: item.paymentInfo?.amount ? (typeof item.paymentInfo.amount === 'number' ? item.paymentInfo.amount : parseFloat(item.paymentInfo.amount)) : undefined,
        cardholder_name: item.paymentInfo?.cardholderName || undefined,
        expiry_date: item.paymentInfo?.expiryDate || undefined,
        payment_method: item.paymentInfo?.paymentMethod || undefined,
        payment_method_id: item.paymentInfo?.paymentMethodId || undefined,
        payment_method_description: item.paymentInfo?.paymentMethodDescription || undefined,
        payment_date: item.paymentInfo?.paymentDate || undefined,
        usage_start_date: item.paymentInfo?.usageStartDate || undefined,
        usage_end_date: item.paymentInfo?.usageEndDate || undefined,
        reporter: item.paymentInfo?.reporter || undefined,
        bill_attachment_path: item.paymentInfo?.billAttachmentPath || undefined,
        invoices: item.paymentInfo?.invoices || [],
        is_complete: item.paymentInfo?.status === 'complete',
        payment_status: item.paymentInfo?.status,
        product_status: item.productStatus || undefined,
        created_at: item.paymentInfo?.createdAt,
        updated_at: item.paymentInfo?.updatedAt,
      }));
      
      setPayments(transformedData);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const data = await fetchQueryPaymentMethodsAction();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const data = await fetchQueryCurrenciesAction();
      setCurrencies(data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  useEffect(() => {
    if (!dataLoaded) {
      fetchProducts();
      fetchServices();
      fetchPayments();
      fetchPaymentMethods();
      fetchCurrencies();
      setDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setPageInput('');
    const serviceId = selectedServiceFilter === 'all' ? undefined : selectedServiceFilter;
    fetchProducts(serviceId, page, searchQuery || undefined);
  };

  const handlePageInputChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageJump = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    } else {
      toast.error(`Please enter a page number between 1 and ${totalPages}`);
      setPageInput('');
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageJump();
    }
  };

  // Handle service filter change
  const handleServiceFilterChange = (value: string) => {
    setSelectedServiceFilter(value);
    setCurrentPage(1); // Reset to page 1 when filter changes
    if (value === 'all') {
      fetchProducts(undefined, 1, searchQuery || undefined);
    } else {
      fetchProducts(value, 1, searchQuery || undefined);
    }
  };

  // Handle add product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  // Handle add payment for product
  const handleAddPayment = (product: Product) => {
    setAddingPaymentForProduct(product);
    setAddPaymentModalOpen(true);
  };

  // Handle product expand/collapse
  const toggleProductExpand = async (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });

    // V2: Optionally refresh payments for this product when expanding
    // This ensures we get the latest payment data including any new payments
    // For now, we rely on the global payments refresh which includes all payments
  };

  // Get all payment records for a specific product (one-to-many relationship)
  // Returns all payment records for the product, sorted by:
  // 1. Unfilled (is_complete: false) first, sorted by payment_date descending (newest first)
  // 2. Filled (is_complete: true) second, sorted by payment_date descending (newest first)
  const getProductPayments = (productId: string): PaymentInfo[] => {
    return payments
      .filter((payment) => payment.product_id === productId)
      .sort((a, b) => {
        // First, sort by completion status (unfilled first)
        if (a.is_complete !== b.is_complete) {
          return a.is_complete ? 1 : -1; // false (unfilled) comes before true (filled)
        }
        
        // Within the same completion status, sort by payment_date descending (newest first)
        if (!a.payment_date) return 1;
        if (!b.payment_date) return -1;
        return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      });
  };

  // Get status badge color classes based on status name
  const getStatusColorClasses = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
      case 'Inactive':
        return 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100';
      case 'Overdue':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400';
    }
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    // Re-fetch products based on current filter
    const serviceId = selectedServiceFilter === 'all' ? undefined : selectedServiceFilter;
    fetchProducts(serviceId, currentPage, searchQuery || undefined);
    // Also refresh services in case counts changed
    fetchServices();
    // Refresh payments to get latest payment info
    fetchPayments();
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 when searching
    const serviceId = selectedServiceFilter === 'all' ? undefined : selectedServiceFilter;
    fetchProducts(serviceId, 1, query || undefined);
  };

  // Fetch user count for a product
  const fetchProductUserCount = async (productId: string) => {
    try {
      const response = await fetchListUserAction(undefined, productId, undefined, 1, 1);
      return response.pagination.total;
    } catch (error) {
      console.error('Failed to fetch user count for product:', error);
      return 0;
    }
  };

  // Load user counts for products (with batch processing for better performance)
  const loadUserCountsForProducts = async (productsToLoad: Product[]) => {
    if (productsToLoad.length === 0) return;
    
    setLoadingUserCounts(true);
    try {
      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      
      for (let i = 0; i < productsToLoad.length; i += batchSize) {
        const batch = productsToLoad.slice(i, i + batchSize);
        const countPromises = batch.map(async (product) => {
          const count = await fetchProductUserCount(product.id);
          return { productId: product.id, count };
        });
        
        const results = await Promise.all(countPromises);
        const batchCounts: Record<string, number> = {};
        results.forEach(({ productId, count }) => {
          batchCounts[productId] = count;
        });
        
        // Update state incrementally for better UX
        setProductUserCounts(prev => ({ ...prev, ...batchCounts }));
      }
    } catch (error) {
      console.error('Failed to load user counts:', error);
    } finally {
      setLoadingUserCounts(false);
    }
  };

  // Fetch all users for a product (with pagination support)
  const fetchProductUsers = async (productId: string) => {
    try {
      setLoadingUsers(true);
      const allUsers: User[] = [];
      let page = 1;
      const limit = 100; // Backend max limit
      let hasMore = true;

      while (hasMore) {
        const response = await fetchListUserAction(undefined, productId, undefined, page, limit);
        allUsers.push(...response.data);
        
        // Check if there are more pages
        const totalPages = Math.ceil(response.pagination.total / response.pagination.limit);
        hasMore = page < totalPages;
        page++;
      }

      return allUsers;
    } catch (error) {
      console.error('Failed to fetch users for product:', error);
      toast.error('Failed to load users');
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle showing all users for a product
  const handleShowAllUsers = async (product: Product) => {
    const users = await fetchProductUsers(product.id);
    // Ensure we use product.name, not service_name
    const productName = product.name || 'Unknown Product';
    setSelectedProductUsers({
      productName: productName,
      users: users,
    });
    setUsersDialogOpen(true);
  };

  // Clear user counts when products change (they will be reloaded in fetchProducts)
  useEffect(() => {
    if (products.length === 0) {
      setProductUserCounts({});
    }
  }, [products]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground mt-0.5">
            View and manage all products across services
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" size="default" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleAddProduct} size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Service Filter Card */}
      {/* <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Filter className="h-4 w-4" />
            </div>
            <Select value={selectedServiceFilter} onValueChange={handleServiceFilterChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedServiceFilter !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </Badge>
            )}
          </div>
        </CardContent>
      </Card> */}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-green-50 dark:bg-green-950 mb-4">
              <Package className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching products found' : 'No products found'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {searchQuery
                ? `No products match "${searchQuery}". Try a different search term.`
                : selectedServiceFilter !== 'all' 
                  ? 'No products found for the selected service. Try selecting a different service or add a new product.'
                  : 'Get started by creating your first product and assigning it to a service'
              }
            </p>
            <Button onClick={handleAddProduct} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[250px]">Product Name</TableHead>
                    <TableHead className="w-[200px]">Service</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[130px]">Start Date</TableHead>
                    <TableHead className="w-[130px]">End Date</TableHead>
                    <TableHead className="w-[120px]">Bills</TableHead>
                    <TableHead className="w-[120px]">Users</TableHead>
                    <TableHead className="w-[200px]">Admins</TableHead>
                    <TableHead className="text-right w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const isExpanded = expandedProducts.has(product.id);
                    const productPayments = getProductPayments(product.id);
                    
                    return (
                      <React.Fragment key={product.id}>
                        <TableRow className="group hover:bg-accent/30 transition-colors">
                          {/* Expand/Collapse Button */}
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleProductExpand(product.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>

                          {/* Product Name */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2 max-w-[250px]">
                              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors flex-shrink-0">
                                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold block truncate" title={product.name}>{product.name}</span>
                                {product.description && (
                                  <span className="text-xs text-muted-foreground block truncate" title={product.description}>{product.description}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Service */}
                          <TableCell>
                            {product.service_name ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 truncate max-w-[200px]"
                                title={product.service_name}
                              >
                                {product.service_name}
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-muted/50 border-dashed"
                              >
                                No Service
                              </Badge>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {product.status ? (
                              <Badge 
                                variant="outline" 
                                className={`text-xs max-w-[140px] truncate ${getStatusColorClasses(product.status)}`}
                                title={product.status}
                              >
                                <span className="truncate">{product.status}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Usage Start Date */}
                          <TableCell>
                            {product.latest_usage_start_date ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{product.latest_usage_start_date}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Usage End Date */}
                          <TableCell>
                            {product.latest_usage_end_date ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{product.latest_usage_end_date}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Payment Bills Count */}
                          <TableCell>
                            {productPayments.length > 0 ? (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                              >
                                {productPayments.length}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No bills</span>
                            )}
                          </TableCell>

                          {/* Users Count */}
                          <TableCell>
                            {loadingUserCounts && productUserCounts[product.id] === undefined ? (
                              <div className="flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Loading...</span>
                              </div>
                            ) : productUserCounts[product.id] !== undefined ? (
                              productUserCounts[product.id] > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowAllUsers(product);
                                  }}
                                >
                                  {productUserCounts[product.id]}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No users</span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          {/* Admins */}
                          <TableCell>
                            {product.admins && product.admins.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {product.admins.slice(0, 2).map((admin) => (
                                  <Badge
                                    key={admin.id}
                                    variant="outline"
                                    className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProductAdmins({
                                        productName: product.name || 'Unknown Product',
                                        admins: product.admins || [],
                                      });
                                      setAdminsDialogOpen(true);
                                    }}
                                  >
                                    {admin.name}
                                  </Badge>
                                ))}
                                {product.admins.length > 2 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-muted hover:bg-muted/80"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProductAdmins({
                                        productName: product.name || 'Unknown Product',
                                        admins: product.admins || [],
                                      });
                                      setAdminsDialogOpen(true);
                                    }}
                                  >
                                    +{product.admins.length - 2}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No admins</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduct(product);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(product);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Payment Bills Table */}
                        {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={10} className="p-0">
                                <div className="bg-muted/20 border-t">
                                  <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Payment Bills for {product.name}
                                      </h4>
                                    </div>
                                    
                                    {loadingPayments ? (
                                      <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                      </div>
                                    ) : productPayments.length > 0 ? (
                                      <div className="rounded-md border bg-background">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                              <TableHead className="w-[120px]">Amount</TableHead>
                                              <TableHead className="w-[130px]">Payment Date</TableHead>
                                              <TableHead className="w-[120px]">Start Date</TableHead>
                                              <TableHead className="w-[120px]">End Date</TableHead>
                                              <TableHead className="w-[150px]">Cardholder</TableHead>
                                              <TableHead className="w-[130px]">Payment Method</TableHead>
                                              <TableHead className="w-[120px]">Reporter</TableHead>
                                              <TableHead className="w-[100px]">Status</TableHead>
                                              <TableHead className="w-[80px]">Invoices</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {productPayments.map((payment) => (
                                              <TableRow key={payment.id} className="hover:bg-accent/30">
                                                <TableCell>
                                                  {payment.amount ? (
                                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                                      ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.payment_date ? (
                                                    <span className="text-sm">{payment.payment_date}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.usage_start_date ? (
                                                    <span className="text-sm">{payment.usage_start_date}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.usage_end_date ? (
                                                    <span className="text-sm">{payment.usage_end_date}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.cardholder_name ? (
                                                    <span className="text-sm truncate block">{payment.cardholder_name}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.payment_method ? (
                                                    <span className="text-sm truncate block">{payment.payment_method}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  {payment.reporter ? (
                                                    <span className="text-sm truncate block">{payment.reporter}</span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge 
                                                    variant={payment.is_complete ? 'default' : 'secondary'}
                                                    className={payment.is_complete 
                                                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 text-xs' 
                                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 text-xs'
                                                    }
                                                  >
                                                    {payment.is_complete ? 'Filled' : 'Unfilled'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  {payment.invoices && payment.invoices.length > 0 ? (
                                                    <span className="text-xs text-muted-foreground">
                                                      {payment.invoices.length} {payment.invoices.length === 1 ? 'file' : 'files'}
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      <div className="py-8 text-center rounded-md border bg-background">
                                        <p className="text-sm text-muted-foreground">No payment bills available for this product</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
              totalPages: {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Go to page
              </span>
              <Input
                type="text"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                placeholder="Page"
                className="w-16 h-8 text-center text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePageJump}
                className="h-8 px-3"
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={deletingProduct}
        onSuccess={handleDialogSuccess}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={addPaymentModalOpen}
        onOpenChange={setAddPaymentModalOpen}
        product={addingPaymentForProduct}
        paymentMethods={paymentMethods}
        currencies={currencies}
        onSuccess={handleDialogSuccess}
      />

      {/* Import Products Dialog */}
      <ImportProductsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      {/* Users Dialog */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Users Assigned to {selectedProductUsers?.productName || 'Product'}
            </DialogTitle>
            <DialogDescription>
              All users who assigned to this product
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : selectedProductUsers && selectedProductUsers.users.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
                {[...selectedProductUsers.users]
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                  .map((user) => (
                    <Badge
                      key={user.id}
                      variant="outline"
                      className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 px-3 py-1.5"
                    >
                      {user.name}
                    </Badge>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No users assigned
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admins Dialog */}
      <Dialog open={adminsDialogOpen} onOpenChange={setAdminsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Admins for {selectedProductAdmins?.productName || 'Product'}
            </DialogTitle>
            <DialogDescription>
              All administrators assigned to this product
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedProductAdmins && selectedProductAdmins.admins.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
                {[...selectedProductAdmins.admins]
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                  .map((admin) => (
                    <Badge
                      key={admin.id}
                      variant="outline"
                      className="text-sm bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200 px-3 py-1.5"
                    >
                      {admin.name}
                    </Badge>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No admins assigned
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

