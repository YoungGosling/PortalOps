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
import type { User } from '@/types';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      await apiClient.deleteUser(user.id);
      toast.success('User deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-2xl">Delete User</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-3 py-4">
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  {user.department && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Department:</span>
                      <span className="text-sm font-semibold">{user.department}</span>
                    </div>
                  )}
                  
                  {user.roles && user.roles.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Roles:</span>
                      <div className="flex gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Assigned Products:</span>
                    <span className="text-sm font-semibold">
                      {user.assignedProductIds?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-warning">Warning</p>
                  <p className="text-xs text-muted-foreground">
                    Deleting this user will remove all their product assignments. 
                    They will lose access to all resources.
                  </p>
                </div>
              </div>
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
              <>Delete User</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


