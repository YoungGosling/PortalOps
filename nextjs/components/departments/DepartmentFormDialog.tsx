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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { createDepartmentAction } from '@/api/departments/add_department/action';
import { updateDepartmentAction } from '@/api/departments/update_department/action';
import { fetchDepartmentProductsAction } from '@/api/departments/query_department_products/action';
import { setDepartmentProductsAction } from '@/api/departments/set_department_products/action';
import type { Department, Service, Product } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ServiceProductSelector } from '@/components/products/ServiceProductSelector';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSuccess: () => void;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentFormDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const isEditMode = !!department;

  useEffect(() => {
    if (open) {
      if (department) {
        // Edit mode - populate with existing department data
        setName(department.name);
        fetchServicesWithProducts();
        fetchDepartmentProducts(department.id);
      } else {
        // Add mode - reset form
        setName('');
        setSelectedProductIds([]);
        fetchServicesWithProducts();
      }
      setActiveTab('basic');
    }
  }, [open, department]);

  const fetchServicesWithProducts = async () => {
    try {
      setLoadingServices(true);
      const data = await apiClient.getServicesWithProducts();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchDepartmentProducts = async (departmentId: string) => {
    try {
      setLoadingProducts(true);
      const products = await fetchDepartmentProductsAction(departmentId);
      // Products are used only for IDs, no type conversion needed
      setSelectedProductIds(products.map(p => p.id));
    } catch (error) {
      console.error('Failed to load department products:', error);
      setSelectedProductIds([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && department) {
        // Update existing department
        await updateDepartmentAction(department.id, { name: name.trim() });
        
        // Update product assignments
        await setDepartmentProductsAction(department.id, {
          product_ids: selectedProductIds,
        });
        
        toast.success('Department updated successfully');
      } else {
        // Create new department
        const newDept = await createDepartmentAction({ name: name.trim() });
        
        // Set product assignments for new department
        if (selectedProductIds.length > 0) {
          await setDepartmentProductsAction(newDept.id, {
            product_ids: selectedProductIds,
          });
        }
        
        toast.success('Department created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} department`);
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

  const canProceedToProducts = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isEditMode ? 'Edit Department' : 'Add Department'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update department information and default product assignments.' 
                : 'Create a new department and assign default products.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="products" disabled={!isEditMode && !canProceedToProducts}>
                Product Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">
                  Department Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dept-name"
                  placeholder="e.g., Engineering, Sales, Marketing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter a unique name for this department
                </p>
              </div>

              {canProceedToProducts && !isEditMode && (
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('products')}
                    className="w-full"
                  >
                    Next: Assign Products →
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Default Product Assignments</Label>
                <p className="text-sm text-muted-foreground">
                  Users in this department will automatically get access to these products.
                  This can be overridden for individual users.
                </p>
                
                {loadingProducts ? (
                  <div className="flex items-center justify-center p-8 border rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Loading products...</span>
                  </div>
                ) : (
                  <ServiceProductSelector
                    services={services}
                    selectedProductIds={selectedProductIds}
                    onSelectionChange={setSelectedProductIds}
                    loading={loadingServices}
                  />
                )}
                
                {selectedProductIds.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Department' : 'Create Department'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

