'use client';

import { useState } from 'react';
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
import { deletePaymentByIdAction } from '@/api/payment_register/delete_payment_by_id/action';
import type { PaymentInfo } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentInfo | null;
  onSuccess: () => void;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: DeletePaymentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!payment) return;

    try {
      setLoading(true);

      // Use payment ID if available, otherwise fall back to product_id
      if (payment.id) {
        await deletePaymentByIdAction(payment.id);
      } else {
        // For backward compatibility with old data structure
        toast.error('Cannot delete payment: Payment ID not found');
        setLoading(false);
        return;
      }

      toast.success('Payment record deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete payment record';
      toast.error(errorMessage);
      console.error('Delete payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete this payment record?
              </p>
              
              {payment && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground block">Product Name:</span>
                    <div className="text-sm font-semibold text-foreground break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {payment.product_name}
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm">
                This action cannot be undone. All associated invoice files will also be deleted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

