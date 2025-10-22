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
import type { Department } from '@/types';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: () => void;
}

export function DeleteDepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DeleteDepartmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!department) return;

    try {
      setLoading(true);
      await apiClient.deleteDepartment(department.id);
      toast.success('Department deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete Department</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{department?.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This will remove all product assignments associated with this department. 
            Users in this department will not be affected, but they will no longer inherit products from it.
          </p>
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Department'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

