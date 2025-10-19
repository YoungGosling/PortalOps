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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import type { Product, Service } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const isEditMode = !!product;

  // Fetch services when dialog opens
  useEffect(() => {
    if (open) {
      fetchServices();
      if (product) {
        setName(product.name);
        setServiceId(product.service_id);
      } else {
        setName('');
        setServiceId('');
      }
    }
  }, [open, product]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const data = await apiClient.getServices();
      setServices(data);
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!serviceId) {
      toast.error('Please select a service');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && product) {
        // Update existing product
        await apiClient.updateProduct(product.id, {
          name: name.trim(),
          serviceId: serviceId,
        });
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await apiClient.createProduct({
          name: name.trim(),
          serviceId: serviceId,
        });
        toast.success('Product created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
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
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isEditMode ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the product information below.'
                : 'Create a new product and assign it to a service.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">
                Service <span className="text-destructive">*</span>
              </Label>
              {loadingServices ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading services...</span>
                </div>
              ) : services.length === 0 ? (
                <div className="p-4 border rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No services available. Please create a service first.
                  </p>
                </div>
              ) : (
                <Select
                  value={serviceId}
                  onValueChange={setServiceId}
                  disabled={loading}
                  required
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              variant="warning"
              disabled={loading || services.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Product' : 'Create Product'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

