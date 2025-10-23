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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import type { Product, Service, ProductStatus } from '@/types';
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
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [statusId, setStatusId] = useState('1');  // V2: Default to 'Active' (ID: 1)
  const [services, setServices] = useState<Service[]>([]);
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  const isEditMode = !!product;

  // Fetch services and statuses when dialog opens
  useEffect(() => {
    if (open) {
      fetchServices();
      fetchStatuses();
      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        setServiceId(product.service_id);
        setStatusId(product.status_id?.toString() || '1');
      } else {
        setName('');
        setDescription('');
        setServiceId('');
        setStatusId('1');
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

  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const data = await apiClient.getProductStatuses();
      setStatuses(data);
    } catch (error) {
      toast.error('Failed to load product statuses');
      console.error(error);
    } finally {
      setLoadingStatuses(false);
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
        // V2: Update existing product with new fields
        await apiClient.updateProduct(product.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          serviceId: serviceId,
          statusId: parseInt(statusId),
        });
        toast.success('Product updated successfully');
      } else {
        // V2: Create new product with new fields
        await apiClient.createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          serviceId: serviceId,
          statusId: parseInt(statusId),
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
              <Label htmlFor="product-description">
                Description
              </Label>
              <Textarea
                id="product-description"
                placeholder="Enter product description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
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

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              {loadingStatuses ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading statuses...</span>
                </div>
              ) : statuses.length === 0 ? (
                <div className="p-4 border rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No statuses available. Please configure product statuses first.
                  </p>
                </div>
              ) : (
                <Select
                  value={statusId}
                  onValueChange={setStatusId}
                  disabled={loading}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
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
              disabled={loading || services.length === 0 || statuses.length === 0}
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

