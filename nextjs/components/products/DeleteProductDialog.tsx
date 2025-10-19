'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: DeleteProductDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    try {
      setDeleting(true);
      await apiClient.deleteProduct(product.id);
      toast.success('Product deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!deleting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-2xl">Delete Product</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Product Name:</span>
                  <span className="text-sm font-semibold">{product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Service:</span>
                  <span className="text-sm font-semibold">{product.service_name || 'No Service'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <p className="text-xs text-foreground">
                <strong className="text-amber-700 dark:text-amber-400">Note:</strong> Deleting this product will also remove its
                associated billing record from the Payment Register.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>Delete Product</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

