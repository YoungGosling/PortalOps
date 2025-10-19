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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import type { Service } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSuccess: () => void;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceFormDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!service;

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (service) {
        setName(service.name);
      } else {
        setName('');
      }
    }
  }, [open, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Service name is required');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && service) {
        // Update existing service
        await apiClient.updateService(service.id, {
          name: name.trim(),
        });
        toast.success('Service updated successfully');
      } else {
        // Create new service
        await apiClient.createService({
          name: name.trim(),
        });
        toast.success('Service created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} service`);
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold">
              {isEditMode ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              {isEditMode
                ? 'Update the service name below.'
                : 'Create a new service by entering its name.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2.5">
              <Label htmlFor="service-name" className="text-sm font-semibold text-foreground">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                placeholder="e.g., Microsoft 365, Google Workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                autoFocus
                className="h-11 text-base bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Enter a descriptive name for this service
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Service' : 'Create Service'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

