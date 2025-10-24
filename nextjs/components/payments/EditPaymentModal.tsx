'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { apiClient } from '@/lib/api';
import type { PaymentInfo, PaymentMethod, PaymentInvoice } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentInfo | null;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
  mode?: 'edit' | 'add';
  productName?: string;
  serviceName?: string;
  productId?: string;
}

export function EditPaymentModal({
  open,
  onOpenChange,
  payment,
  paymentMethods,
  onSuccess,
  mode = 'edit',
  productName = '',
  serviceName = '',
  productId = '',
}: EditPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [usageStartDate, setUsageStartDate] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedInvoices, setUploadedInvoices] = useState<PaymentInvoice[]>([]);
  const [pendingDeleteInvoiceIds, setPendingDeleteInvoiceIds] = useState<Set<string>>(new Set());
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if payment has error status (orphaned payment - product deleted)
  const isErrorStatus = mode === 'edit' && (payment?.status === 'error' || !payment?.product_id);

  // Convert MM/DD/YYYY to YYYY-MM-DD for date input
  const convertToDateInput = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const [month, day, year] = dateStr.split('/');
    if (month && day && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Populate form when payment changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && payment) {
        setAmount(payment.amount?.toString() || '');
        setCardholderName(payment.cardholder_name || '');
        setPaymentMethodId(payment.payment_method_id?.toString() || '');
        setPaymentDate(convertToDateInput(payment.payment_date || ''));
        setUsageStartDate(convertToDateInput(payment.usage_start_date || ''));
        setUsageEndDate(convertToDateInput(payment.usage_end_date || ''));
        setUploadedInvoices(payment.invoices || []);
        setSelectedFiles([]);
        setPendingDeleteInvoiceIds(new Set());
        setInvoiceToDelete(null);
      } else if (mode === 'add') {
        // Reset form for add mode
        setAmount('');
        setCardholderName('');
        setPaymentMethodId('');
        setPaymentDate('');
        setUsageStartDate('');
        setUsageEndDate('');
        setUploadedInvoices([]);
        setSelectedFiles([]);
        setPendingDeleteInvoiceIds(new Set());
        setInvoiceToDelete(null);
      }
    }
  }, [open, payment, mode]);

  const handleDeleteInvoiceClick = (invoiceId: string) => {
    // Show confirmation dialog
    setInvoiceToDelete(invoiceId);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      // Mark invoice for deletion (visual only, not API call)
      setPendingDeleteInvoiceIds(prev => new Set(prev).add(invoiceToDelete));
      setInvoiceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setInvoiceToDelete(null);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await apiClient.downloadInvoice(invoiceId);
      
      // Find the invoice to get the original filename
      const invoice = uploadedInvoices.find(inv => inv.id === invoiceId);
      const filename = invoice?.original_file_name || 'invoice.pdf';
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!amount || !cardholderName || !paymentMethodId || !paymentDate || !usageStartDate || !usageEndDate) {
      toast.error('All fields are required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be a valid positive number');
      return;
    }

    if (usageEndDate < usageStartDate) {
      toast.error('Usage end date must be greater than or equal to usage start date');
      return;
    }

    // For add mode, at least one new file is required
    if (mode === 'add' && selectedFiles.length === 0) {
      toast.error('At least one invoice file is required');
      return;
    }

    // For edit mode, count remaining invoices after pending deletions
    if (mode === 'edit') {
      const remainingInvoicesCount = uploadedInvoices.length - pendingDeleteInvoiceIds.size + selectedFiles.length;
      if (remainingInvoicesCount === 0) {
        toast.error('At least one invoice file is required');
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === 'add') {
        // Add mode: create new payment
        if (!productId) {
          toast.error('Product ID is required');
          return;
        }

        // Step 1: Create payment record
        const formData = new FormData();
        formData.append('amount', amountNum.toString());
        formData.append('cardholder_name', cardholderName);
        formData.append('payment_method_id', paymentMethodId);
        formData.append('payment_date', paymentDate);
        formData.append('usage_start_date', usageStartDate);
        formData.append('usage_end_date', usageEndDate);

        const response = await apiClient.createPaymentForProduct(productId, formData);
        
        // Step 2: Upload invoice files to the newly created payment
        if (selectedFiles.length > 0 && response.id) {
          await apiClient.uploadInvoices(response.id, selectedFiles);
        }

        toast.success('Payment record created successfully');
      } else {
        // Edit mode: update existing payment
        if (!payment) return;

        // First, delete marked invoices
        if (pendingDeleteInvoiceIds.size > 0) {
          for (const invoiceId of pendingDeleteInvoiceIds) {
            try {
              await apiClient.deleteInvoice(invoiceId);
            } catch (error) {
              console.error(`Failed to delete invoice ${invoiceId}:`, error);
              // Continue with other deletions even if one fails
            }
          }
        }

        // Update payment information
        const formData = new FormData();
        formData.append('amount', amountNum.toString());
        formData.append('cardholder_name', cardholderName);
        formData.append('payment_method_id', paymentMethodId);
        formData.append('payment_date', paymentDate);
        formData.append('usage_start_date', usageStartDate);
        formData.append('usage_end_date', usageEndDate);

        // V2: Use payment ID if available (for one-to-many), otherwise use product ID (backward compat)
        if (payment.id) {
          await apiClient.updatePaymentById(payment.id, formData);
        } else if (payment.product_id) {
          await apiClient.updatePaymentInfo(payment.product_id, formData);
        } else {
          throw new Error('Cannot update payment: Missing payment ID and product ID');
        }

        // Upload new files
        if (selectedFiles.length > 0) {
          // Use payment ID (not product ID) for invoice uploads
          const paymentId = payment.id || payment.payment_id;
          if (!paymentId) {
            throw new Error('Payment ID is required for invoice upload');
          }
          await apiClient.uploadInvoices(paymentId, selectedFiles);
        }

        toast.success('Payment information updated successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(mode === 'add' ? 'Failed to create payment record' : 'Failed to update payment information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === 'add' ? 'Add Payment Record' : 'Edit Payment Information'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'add' 
                ? `Create a new payment record for ${productName || 'this product'}`
                : `Update payment details for ${payment?.product_name}. Status and Reporter are auto-managed.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Error Status Warning */}
            {isErrorStatus && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-sm text-foreground">
                  <strong className="text-red-700 dark:text-red-400">⚠️ Error Status Payment</strong>
                  <br />
                  This payment record is associated with a deleted product and cannot be updated. 
                  The payment record is preserved for historical purposes only.
                </p>
              </div>
            )}
            {/* Product Information (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Product</Label>
                <Input
                  value={mode === 'add' ? productName : (payment?.product_name || '')}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Service</Label>
                <Input
                  value={mode === 'add' ? serviceName : (payment?.service_name || '')}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading || isErrorStatus}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-cardholder">
                  Cardholder Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment-cardholder"
                  type="text"
                  placeholder="Enter cardholder name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={loading || isErrorStatus}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={loading || isErrorStatus}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={loading || isErrorStatus}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage-start-date">
                  Usage Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usage-start-date"
                  type="date"
                  value={usageStartDate}
                  onChange={(e) => setUsageStartDate(e.target.value)}
                  disabled={loading || isErrorStatus}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage-end-date">
                  Usage End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usage-end-date"
                  type="date"
                  value={usageEndDate}
                  onChange={(e) => setUsageEndDate(e.target.value)}
                  disabled={loading || isErrorStatus}
                  required
                />
              </div>
            </div>

            {/* Invoice Management */}
            <div className="space-y-2">
              <Label>
                Invoices <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload invoice files. At least one invoice is required.
              </p>
              <FileUpload
                files={selectedFiles}
                uploadedInvoices={uploadedInvoices}
                pendingDeleteInvoiceIds={pendingDeleteInvoiceIds}
                onFilesChange={setSelectedFiles}
                onDeleteInvoice={handleDeleteInvoiceClick}
                onDownloadInvoice={handleDownloadInvoice}
                disabled={loading || isErrorStatus}
              />
              {uploadedInvoices.length + selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground pt-2">
                  {uploadedInvoices.length - pendingDeleteInvoiceIds.size + selectedFiles.length} invoice{uploadedInvoices.length - pendingDeleteInvoiceIds.size + selectedFiles.length === 1 ? '' : 's'} total
                  {pendingDeleteInvoiceIds.size > 0 && (
                    <span className="text-destructive ml-2">
                      ({pendingDeleteInvoiceIds.size} marked for deletion)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isErrorStatus}
              title={isErrorStatus ? "Cannot update payment with error status" : ""}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                <>{mode === 'add' ? 'Add Payment' : 'Update Payment'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Invoice Deletion */}
      <AlertDialog open={invoiceToDelete !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? The file will be marked for deletion and removed when you click "Update Payment".
              You can cancel this action by clicking the "Cancel" button.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

