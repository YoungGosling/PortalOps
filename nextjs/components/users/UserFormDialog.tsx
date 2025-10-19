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
import type { User, Product } from '@/types';
import { toast } from 'sonner';
import { Loader2, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
  workflowMode?: 'onboarding' | 'offboarding'; // For Inbox workflows
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  workflowMode,
}: UserFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const isEditMode = !!user;
  const isOnboarding = workflowMode === 'onboarding';
  const isOffboarding = workflowMode === 'offboarding';
  const isWorkflowMode = !!workflowMode;

  // Fetch products for assignment
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
    
    if (open) {
      if (user) {
        // Edit mode - populate with existing user data
        setName(user.name);
        setEmail(user.email);
        setDepartment(user.department || '');
        setSelectedProductIds(user.assignedProductIds || []);
      } else {
        // Add mode - reset form
        setName('');
        setEmail('');
        setDepartment('');
        setSelectedProductIds([]);
      }
    }
  }, [open, user]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await apiClient.getProducts();
      setAvailableProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For offboarding, delete the user (this happens via complete task endpoint)
    if (isOffboarding && user && user.id) {
      try {
        setLoading(true);
        // The inbox page will call completeTask which deletes the user
        // We just need to trigger the success callback
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error.message || 'Failed to offboard user');
        console.error(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // For onboarding, must assign at least one product
    if (isOnboarding && selectedProductIds.length === 0) {
      toast.error('Please assign at least one product to the user');
      return;
    }

    try {
      setLoading(true);

      const userData = {
        name: name.trim(),
        email: email.trim(),
        department: department.trim() || undefined,
        assignedProductIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      };

      // Determine if this is a create or update operation
      // For onboarding workflow, user.id will be empty string
      const isCreate = !user || !user.id;
      
      if (isCreate) {
        // Create new user
        await apiClient.createUser(userData);
        toast.success(isOnboarding ? 'User onboarded successfully' : 'User created successfully');
      } else {
        // Update existing user
        await apiClient.updateUser(user.id, userData);
        toast.success('User updated successfully');
      }

      // Call onSuccess callback which will:
      // - For onboarding: call completeTask endpoint to mark task complete
      // - For regular user management: just refresh the user list
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${!user || !user.id ? 'create' : 'update'} user`);
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

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const getDialogTitle = () => {
    if (isOffboarding) return 'Offboarding User';
    if (isOnboarding) return 'Onboarding User';
    if (isEditMode) return 'Edit User';
    return 'Add User';
  };

  const getDialogDescription = () => {
    if (isOffboarding) return 'Review the user information and confirm offboarding. This will delete the user and remove all access.';
    if (isOnboarding) return 'Assign products to the new employee to complete onboarding.';
    if (isEditMode) return 'Update the user information and product assignments below.';
    return 'Create a new user and assign products.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-name"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || isWorkflowMode}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isWorkflowMode}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-department">
                Department <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="user-department"
                placeholder="Enter department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading || isWorkflowMode}
              />
            </div>

            {/* Product Assignment */}
            <div className="space-y-2">
              <Label>
                Assign Products {isOnboarding && <span className="text-destructive">*</span>}
                {!isOnboarding && !isOffboarding && <span className="text-muted-foreground text-xs">(Optional)</span>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Select products to give the user access to
              </p>
              
              {isOffboarding ? (
                <div className="p-4 border rounded-md bg-muted/30">
                  <p className="text-sm font-medium mb-2">Current Assignments:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products assigned</p>
                    ) : (
                      selectedProductIds.map((id) => {
                        const product = availableProducts.find(p => p.id === id);
                        return product ? (
                          <Badge key={id} variant="secondary">
                            {product.name}
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              ) : loadingProducts ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading products...</span>
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="p-4 border rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No products available
                  </p>
                </div>
              ) : (
                <>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                    <div className="space-y-2">
                      {availableProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            selectedProductIds.includes(product.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{product.name}</span>
                              {product.service_name && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({product.service_name})
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedProductIds.includes(product.id) && (
                            <Badge variant="default" className="text-xs">Selected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedProductIds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <span className="text-sm text-muted-foreground">Selected:</span>
                      {selectedProductIds.map((id) => {
                        const product = availableProducts.find(p => p.id === id);
                        return product ? (
                          <Badge key={id} variant="secondary" className="gap-1">
                            {product.name}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductSelection(id);
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </>
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
              disabled={loading}
              variant={isOffboarding ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isOffboarding ? 'Offboarding...' : isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isOffboarding ? 'Confirm Offboarding' : isOnboarding ? 'Complete Onboarding' : isEditMode ? 'Update User' : 'Create User'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

