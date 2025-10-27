'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Product, Service, PaymentInfo, PaymentMethod } from '@/types';
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
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { AddPaymentModal } from '@/components/payments/AddPaymentModal';
import { Plus, Package, Filter, Loader2, Edit2, Trash2, Building, ChevronDown, ChevronUp, Calendar, DollarSign, Tag, Receipt, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [addingPaymentForProduct, setAddingPaymentForProduct] = useState<Product | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(20);

  const fetchProducts = async (serviceId?: string, page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts(serviceId, page, pageSize);
      setProducts(response.data);
      setCurrentPage(response.pagination.page);
      setTotalProducts(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
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
      const response = await apiClient.getServices(1, 100);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      // Fetch all payments without pagination for product payment display
      const response = await apiClient.getPaymentRegister(1, 1000);
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const data = await apiClient.getPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  useEffect(() => {
    if (!dataLoaded) {
      fetchProducts();
      fetchServices();
      fetchPayments();
      fetchPaymentMethods();
      setDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const serviceId = selectedServiceFilter === 'all' ? undefined : selectedServiceFilter;
    fetchProducts(serviceId, page);
  };

  // Handle service filter change
  const handleServiceFilterChange = (value: string) => {
    setSelectedServiceFilter(value);
    setCurrentPage(1); // Reset to page 1 when filter changes
    if (value === 'all') {
      fetchProducts(undefined, 1);
    } else {
      fetchProducts(value, 1);
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
    if (selectedServiceFilter === 'all') {
      fetchProducts();
    } else {
      fetchProducts(selectedServiceFilter);
    }
    // Also refresh services in case counts changed
    fetchServices();
    // Refresh payments to get latest payment info
    fetchPayments();
  };

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
        <Button onClick={handleAddProduct} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
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
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {selectedServiceFilter !== 'all' 
                ? 'No products found for the selected service. Try selecting a different service or add a new product.'
                : 'Get started by creating your first product and assigning it to a service'}
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
                    <TableHead className="w-[130px]">Usage Start Date</TableHead>
                    <TableHead className="w-[130px]">Usage End Date</TableHead>
                    <TableHead className="w-[120px]">Bills</TableHead>
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
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors">
                                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold block truncate">{product.name}</span>
                                {product.description && (
                                  <span className="text-xs text-muted-foreground block truncate">{product.description}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Service */}
                          <TableCell>
                            {product.service_name ? (
                              <div className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                                >
                                  {product.service_name}
                                </Badge>
                              </div>
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
                                className={`text-xs ${getStatusColorClasses(product.status)}`}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {product.status}
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
                                <Receipt className="h-3 w-3 mr-1" />
                                {productPayments.length} {productPayments.length === 1 ? 'bill' : 'bills'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No bills</span>
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
                              <TableCell colSpan={8} className="p-0">
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
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
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
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
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
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

