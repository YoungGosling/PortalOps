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
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditMode ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditMode
                ? 'Update the service name below.'
                : 'Create a new service by entering its name.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name" className="text-sm font-medium">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                placeholder="Enter service name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              disabled={loading}
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

