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
import { fetchDeleteServiceAction } from '@/api/services/delete_service/action';
import type { Service } from '@/types';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Info } from 'lucide-react';

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: DeleteServiceDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!service) return;

    try {
      setDeleting(true);
      await fetchDeleteServiceAction(service.id);
      toast.success('Service deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-2xl font-bold">Delete Service</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Are you sure you want to delete this service? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {service && (
          <div className="space-y-3.5 py-4">
            <div className="p-4 rounded-lg border border-border bg-background">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Service Name:</span>
                  <span className="text-sm font-semibold text-foreground">{service.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Products:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {service.product_count || 0} {service.product_count === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2.5">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Non-destructive deletion</p>
                  <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                    Deleting this service will only remove the service itself. Associated products will become 
                    "unassociated" and remain in the system. They can be reassigned to other services later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={deleting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="min-w-[130px]"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>Delete Service</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

