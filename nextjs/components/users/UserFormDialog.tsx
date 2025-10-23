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
import type { User, Service, Department } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ServiceProductSelector } from '@/components/products/ServiceProductSelector';

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
  const [departmentId, setDepartmentId] = useState('');  // v3: department FK (UUID)
  const [position, setPosition] = useState('');          // v3: new field
  const [hireDate, setHireDate] = useState('');          // v3: new field
  const [resignationDate, setResignationDate] = useState(''); // v3: new field (optional)
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const isEditMode = !!user;
  const isOnboarding = workflowMode === 'onboarding';
  const isOffboarding = workflowMode === 'offboarding';
  const isWorkflowMode = !!workflowMode;

  // Fetch services with products and departments
  useEffect(() => {
    if (open) {
      fetchServicesWithProducts();
      fetchDepartments();
    }
    
    if (open) {
      if (user) {
        // Edit mode - populate with existing user data
        setName(user.name);
        setEmail(user.email);
        setDepartmentId(user.department_id || '');
        setPosition(user.position || '');
        setHireDate(user.hire_date || '');
        setResignationDate(user.resignation_date || '');
        setSelectedProductIds(user.assignedProductIds || []);
      } else {
        // Add mode - reset form
        setName('');
        setEmail('');
        setDepartmentId('');
        setPosition('');
        setHireDate('');
        setResignationDate('');
        setSelectedProductIds([]);
      }
    }
  }, [open, user]);

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

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await apiClient.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // v3: Auto-populate products when department changes
  const handleDepartmentChange = async (newDepartmentId: string) => {
    setDepartmentId(newDepartmentId);
    
    // Fetch department products and auto-populate
    if (newDepartmentId) {
      try {
        const deptProducts = await apiClient.getDepartmentProducts(newDepartmentId);
        const deptProductIds = deptProducts.map(p => p.id);
        
        // Merge with existing manual selections
        const allProductIds = Array.from(new Set([...selectedProductIds, ...deptProductIds]));
        setSelectedProductIds(allProductIds);
        
        toast.success(`Auto-assigned ${deptProductIds.length} products from department`);
      } catch (error) {
        console.error('Failed to load department products:', error);
        toast.error('Failed to load department products');
      }
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
        department_id: departmentId || undefined,
        position: position.trim() || undefined,
        hire_date: hireDate.trim() || undefined,
        resignation_date: resignationDate.trim() || undefined,
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-department">
                  Department <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Select
                  value={departmentId}
                  onValueChange={handleDepartmentChange}
                  disabled={loading || isWorkflowMode || loadingDepartments}
                >
                  <SelectTrigger id="user-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingDepartments && (
                  <p className="text-xs text-muted-foreground">Loading departments...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-position">
                  Position <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="user-position"
                  placeholder="Job title / position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={loading || isWorkflowMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-hire-date">
                  Hire Date <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="user-hire-date"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  disabled={loading || isWorkflowMode}
                />
              </div>

              {/* Resignation Date - only show in edit mode for admins if needed */}
              {isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="user-resignation-date">
                    Resignation Date <span className="text-muted-foreground text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id="user-resignation-date"
                    type="date"
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    disabled={loading || isWorkflowMode}
                  />
                </div>
              )}
            </div>

            {/* Product Assignment - v3: Using ServiceProductSelector */}
            <div className="space-y-2">
              <Label>
                Assign Products {isOnboarding && <span className="text-destructive">*</span>}
                {!isOnboarding && !isOffboarding && <span className="text-muted-foreground text-xs">(Optional)</span>}
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select services and products to grant access. Selecting a service selects all its products.
              </p>
              
              {isOffboarding ? (
                <div className="p-4 border rounded-md bg-muted/30">
                  <p className="text-sm font-medium mb-2">This user will be offboarded</p>
                  <p className="text-xs text-muted-foreground">All access will be removed</p>
                </div>
              ) : (
                <ServiceProductSelector
                  services={services}
                  selectedProductIds={selectedProductIds}
                  onSelectionChange={setSelectedProductIds}
                  loading={loadingServices}
                />
              )}
              
              {!isOffboarding && selectedProductIds.length > 0 && (
                <p className="text-xs text-muted-foreground pt-2">
                  {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected
                </p>
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

