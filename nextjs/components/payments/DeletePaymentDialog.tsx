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
import { apiClient } from '@/lib/api';
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
        await apiClient.deletePaymentById(payment.id);
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
          <AlertDialogDescription>
            Are you sure you want to delete this payment record for <strong>{payment?.product_name}</strong>?
            <br />
            <br />
            This action cannot be undone. All associated invoice files will also be deleted.
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

