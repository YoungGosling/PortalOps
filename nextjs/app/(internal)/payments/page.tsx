'use client';

import { useState, useEffect } from 'react';
import { queryPaymentRegisterV2Action } from '@/api/payment_register/query_payment_register_v2/action';
import { fetchQueryPaymentMethodsAction } from '@/api/payment_method/query_payment_methods/action';
import { fetchQueryCurrenciesAction } from '@/api/currency/query_currencies/action';
import type { PaymentInfo, PaymentMethod, Currency } from '@/types';
import { sortPaymentsByCompleteness } from '@/lib/billingUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditPaymentModal } from '@/components/payments/EditPaymentModal';
import { DeletePaymentDialog } from '@/components/payments/DeletePaymentDialog';
import {
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Edit,
  DollarSign,
  Calendar,
  User as UserIcon,
  FileText,
  Loader2,
  Building2,
  Package,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentInfo | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'add'>('edit');
  const [addPaymentContext, setAddPaymentContext] = useState<{
    productName: string;
    serviceName: string;
    productId: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<PaymentInfo | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [pageSize] = useState(20);
  const [pageInput, setPageInput] = useState('');

  const fetchPayments = async (page: number = currentPage, search?: string) => {
    try {
      setLoading(true);
      const response = await queryPaymentRegisterV2Action(page, pageSize, search);
      
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
        currency_id: item.paymentInfo?.currencyId || undefined,
        currency_code: item.paymentInfo?.currencyCode || undefined,
        currency_symbol: item.paymentInfo?.currencySymbol || undefined,
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
      
      setPayments(sortPaymentsByCompleteness(transformedData));
      setCurrentPage(response.pagination.page);
      setTotalPayments(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (error) {
      toast.error('Failed to load payment records');
      console.error(error);
    } finally {
      setLoading(false);
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
    fetchPayments(page, searchQuery || undefined);
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

  const handleEdit = (payment: PaymentInfo) => {
    setModalMode('edit');
    setEditingPayment(payment);
    setAddPaymentContext(null);
    setEditModalOpen(true);
  };

  const handleAdd = (payment: PaymentInfo) => {
    setModalMode('add');
    setEditingPayment(null);
    setAddPaymentContext({
      productName: payment.product_name || 'Unknown Product',
      serviceName: payment.service_name || 'Unknown Service',
      productId: payment.product_id || '',
    });
    setEditModalOpen(true);
  };

  const handleDelete = (payment: PaymentInfo) => {
    setDeletingPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleModalSuccess = () => {
    fetchPayments(currentPage, searchQuery || undefined);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 when searching
    fetchPayments(1, query || undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Register</h1>
          <p className="text-muted-foreground mt-0.5">
            {payments.length} {payments.length === 1 ? 'payment record' : 'payment records'} • {payments.filter(p => !p.is_complete).length} incomplete
          </p>
        </div>
        {/* Search Box */}
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product..."
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-green-50 dark:bg-green-950 mb-4">
              <CreditCard className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching payment records found' : 'No payment records found'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery
                ? `No payment records match "${searchQuery}". Try a different search term.`
                : 'Payment records will appear here once products are created'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[200px]">Product</TableHead>
                    <TableHead className="w-[150px]">Service</TableHead>
                    <TableHead className="w-[110px]">Amount</TableHead>
                    <TableHead className="w-[80px]">Currency</TableHead>
                    <TableHead className="w-[150px]">Cardholder</TableHead>
                    <TableHead className="w-[140px]">Payment Method</TableHead>
                    <TableHead className="w-[110px]">Payment Date</TableHead>
                    <TableHead className="w-[110px]">Start Date</TableHead>
                    <TableHead className="w-[110px]">End Date</TableHead>
                    <TableHead className="w-[90px]">Invoices</TableHead>
                    <TableHead className="text-right w-[240px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const isError = payment.status === 'error' || !payment.product_id;
                    const isComplete = payment.is_complete && !isError;

                    return (
                      <TableRow 
                        key={payment.id || payment.product_id}
                        className={`group hover:bg-accent/30 transition-colors ${isError ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                      >
                        {/* Status */}
                        <TableCell>
                          {isError ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          ) : isComplete ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0 gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              Filled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Unfilled
                            </Badge>
                          )}
                        </TableCell>

                        {/* Product Name */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <div className={`p-2 rounded-lg ${isError ? 'bg-red-50 dark:bg-red-950' : 'bg-blue-50 dark:bg-blue-950'} group-hover:bg-opacity-80 transition-colors flex-shrink-0`}>
                              <Package className={`h-4 w-4 ${isError ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                            </div>
                            <span className={`font-semibold truncate ${isError ? 'text-muted-foreground line-through' : ''}`} title={payment.product_name || undefined}>
                              {payment.product_name || <span className="italic text-red-600">Product Deleted</span>}
                            </span>
                          </div>
                        </TableCell>

                        {/* Service Name */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[150px]">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className={`truncate ${isError ? 'line-through' : ''}`} title={payment.service_name || undefined}>
                              {payment.service_name || <span className="italic text-red-600">Service Deleted</span>}
                            </span>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-medium text-sm">
                              {payment.amount !== undefined ? payment.amount.toFixed(2) : '-'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Currency */}
                        <TableCell>
                          <span className="text-sm font-medium" title={payment.currency_code || undefined}>
                            {payment.currency_code || '-'}
                          </span>
                        </TableCell>

                        {/* Cardholder Name */}
                        <TableCell>
                          <span className="text-sm truncate block max-w-[150px]" title={payment.cardholder_name || undefined}>{payment.cardholder_name || '-'}</span>
                        </TableCell>

                        {/* Payment Method */}
                        <TableCell>
                          <span className="text-sm truncate block max-w-[140px]" title={payment.payment_method || undefined}>{payment.payment_method || '-'}</span>
                        </TableCell>

                        {/* Payment Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{payment.payment_date || '-'}</span>
                          </div>
                        </TableCell>

                        {/* Usage Start Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{payment.usage_start_date || '-'}</span>
                          </div>
                        </TableCell>

                        {/* Usage End Date */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{payment.usage_end_date || '-'}</span>
                          </div>
                        </TableCell>

                        {/* Invoices */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{payment.invoices?.length || 0}</span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8 hover:bg-green-50 hover:border-green-200 hover:text-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleAdd(payment)}
                              disabled={isError}
                              title={isError ? "Cannot add payment to deleted product" : "Add new payment"}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-400 transition-all"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8 hover:bg-red-50 hover:border-red-200 hover:text-red-400 transition-all"
                              onClick={() => handleDelete(payment)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!loading && payments.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalPayments)} of {totalPayments} payment records
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

      {/* Edit/Add Payment Modal */}
      <EditPaymentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        payment={editingPayment}
        paymentMethods={paymentMethods}
        currencies={currencies}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        productName={addPaymentContext?.productName || ''}
        serviceName={addPaymentContext?.serviceName || ''}
        productId={addPaymentContext?.productId || ''}
      />

      {/* Delete Payment Dialog */}
      <DeletePaymentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        payment={deletingPayment}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
