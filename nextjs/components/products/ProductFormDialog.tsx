'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchQueryServicesAction } from '@/api/services/query_services/action';
import { createProductAction } from '@/api/products/create_product/action';
import { updateProductAction } from '@/api/products/update_product/action';
import { fetchQueryProductStatusesAction } from '@/api/product_status/query_product_statuses/action';
import { queryProductsAction } from '@/api/products/query_products/action';
import { fetchListUserAction } from '@/api/users/list_user/action';
import type { Product, Service, ProductStatus, User } from '@/types';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [nameDuplicate, setNameDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adminSearchRef = useRef<HTMLDivElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!product;

  // Calculate dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (adminInputRef.current && showAdminDropdown) {
        const rect = adminInputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (showAdminDropdown) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showAdminDropdown, adminSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        adminSearchRef.current &&
        !adminSearchRef.current.contains(target) &&
        !(target as Element).closest('[data-admin-dropdown]')
      ) {
        setShowAdminDropdown(false);
      }
    };

    if (showAdminDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminDropdown]);

  // Fetch services, statuses, and users when dialog opens
  useEffect(() => {
    if (open) {
      fetchServices();
      fetchStatuses();
      fetchUsers();
      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        setServiceId(product.service_id);
        setStatusId(product.status_id?.toString() || '1');
        setSelectedAdminIds(product.admins?.map((admin) => admin.id) || []);
        setNameDuplicate(false); // Reset duplicate check when opening edit dialog
      } else {
        setName('');
        setDescription('');
        setServiceId('');
        setStatusId('1');
        setSelectedAdminIds([]);
        setNameDuplicate(false); // Reset duplicate check when opening add dialog
      }
      setAdminSearchQuery('');
      setShowAdminDropdown(false);
    }
  }, [open, product]);

  // Check for duplicate product name when name changes
  const checkDuplicateName = useCallback(async (productName: string) => {
    if (!productName.trim()) {
      setNameDuplicate(false);
      return;
    }

    // For edit mode, skip check if name hasn't changed
    if (isEditMode && product && product.name === productName.trim()) {
      setNameDuplicate(false);
      return;
    }

    try {
      setCheckingDuplicate(true);
      const searchResult = await queryProductsAction(null, 1, 100, productName.trim());
      
      // Check if any product has the exact same name (case-insensitive)
      const duplicateProduct = searchResult.products.find(
        (p) => p.name.toLowerCase() === productName.trim().toLowerCase()
      );
      
      // For edit mode, exclude the current product from duplicate check
      if (duplicateProduct && (!isEditMode || duplicateProduct.id !== product?.id)) {
        setNameDuplicate(true);
      } else {
        setNameDuplicate(false);
      }
    } catch (error) {
      console.error('Error checking duplicate product name:', error);
      setNameDuplicate(false);
    } finally {
      setCheckingDuplicate(false);
    }
  }, [isEditMode, product]);

  // Debounced effect to check for duplicate names
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only check if name is not empty
    if (name.trim()) {
      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        checkDuplicateName(name);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setNameDuplicate(false);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [name, checkDuplicateName]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await fetchQueryServicesAction(1, 100); // Fetch up to 100 services
      // Transform response to match expected format
      const services: Service[] = response.data.map(s => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor ?? undefined, // Convert null to undefined
        product_count: s.productCount || 0,
        products: s.products,
        admins: s.admins,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
      setServices(services);
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
      const data = await fetchQueryProductStatusesAction();
      setStatuses(data);
    } catch (error) {
      toast.error('Failed to load product statuses');
      console.error(error);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetchListUserAction();
      setAllUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const addAdmin = (userId: string) => {
    if (!selectedAdminIds.includes(userId)) {
      setSelectedAdminIds(prev => [...prev, userId]);
    }
    setAdminSearchQuery('');
    setShowAdminDropdown(false);
  };

  const removeAdmin = (userId: string) => {
    setSelectedAdminIds(prev => prev.filter(id => id !== userId));
  };

  // Filter users based on search query, excluding already selected users
  const filteredUsers = allUsers.filter(user => {
    if (selectedAdminIds.includes(user.id)) return false;
    if (!adminSearchQuery.trim()) return false;
    return user.name.toLowerCase().includes(adminSearchQuery.toLowerCase());
  });

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

      const trimmedName = name.trim();

      // Check if product with the same name already exists
      // For edit mode, only check if the name has changed
      const shouldCheckDuplicate = !isEditMode || (product && product.name !== trimmedName);
      
      if (shouldCheckDuplicate) {
        // Use search API to check for duplicate product names
        const searchResult = await queryProductsAction(null, 1, 100, trimmedName);
        
        // Check if any product has the exact same name (case-insensitive)
        const duplicateProduct = searchResult.products.find(
          (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        // For edit mode, exclude the current product from duplicate check
        if (duplicateProduct && (!isEditMode || duplicateProduct.id !== product?.id)) {
          toast.error('Product already exists');
          setLoading(false);
          return;
        }
      }

      if (isEditMode && product) {
        // V2: Update existing product with new fields
        await updateProductAction(product.id, {
          name: trimmedName,
          description: description.trim() || null,
          serviceId: serviceId,
          statusId: parseInt(statusId),
          adminUserIds: selectedAdminIds,
        });
        toast.success('Product updated successfully');
      } else {
        // V2: Create new product with new fields
        await createProductAction({
          name: trimmedName,
          description: description.trim() || null,
          serviceId: serviceId,
          statusId: parseInt(statusId),
          adminUserIds: selectedAdminIds,
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
      <DialogContent className="sm:max-w-[500px] max-w-[90vw]">
        <form onSubmit={handleSubmit} className="min-w-0">
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

          <div className="space-y-4 py-4 min-w-0">
            <div className="space-y-2 min-w-0">
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
                className={`min-w-0 ${nameDuplicate ? 'border-destructive' : ''}`}
              />
              {nameDuplicate && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Product already exists
                </p>
              )}
              {checkingDuplicate && !nameDuplicate && name.trim() && (
                <p className="text-sm text-muted-foreground">
                  Checking...
                </p>
              )}
            </div>

            <div className="space-y-2 min-w-0">
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
                className="min-w-0"
              />
            </div>

            <div className="space-y-2 min-w-0">
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
                  <SelectTrigger id="service" className="[&>span]:truncate min-w-0">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="[&>span]:truncate" title={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2 min-w-0">
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
                  <SelectTrigger id="status" className="min-w-0">
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

            <div className="space-y-2 min-w-0">
              <Label>Administrators</Label>
              
              {selectedAdminIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                  {selectedAdminIds.map((adminId) => {
                    const admin = allUsers.find(u => u.id === adminId);
                    return admin ? (
                      <Badge key={adminId} variant="secondary" className="gap-1">
                        {admin.name}
                        <button
                          type="button"
                          onClick={() => removeAdmin(adminId)}
                          className="ml-1 hover:bg-destructive/20 rounded-full"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {loadingUsers ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                </div>
              ) : (
                <div className="relative min-w-0" ref={adminSearchRef}>
                  <Input
                    ref={adminInputRef}
                    placeholder="Search administrators by name..."
                    value={adminSearchQuery}
                    onChange={(e) => {
                      setAdminSearchQuery(e.target.value);
                      setShowAdminDropdown(true);
                    }}
                    onFocus={() => setShowAdminDropdown(true)}
                    disabled={loading}
                    className="min-w-0"
                  />
                  
                  {showAdminDropdown && typeof window !== 'undefined' && createPortal(
                    <>
                      {/* Dropdown */}
                      {filteredUsers.length > 0 && (
                        <div
                          data-admin-dropdown
                          className="fixed bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-[200px] overflow-y-auto overflow-x-hidden"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                            zIndex: 9999,
                            pointerEvents: 'auto',
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onWheel={(e) => e.stopPropagation()}
                        >
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addAdmin(user.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                            >
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {adminSearchQuery.trim() && filteredUsers.length === 0 && (
                        <div
                          data-admin-dropdown
                          className="fixed bg-white dark:bg-gray-950 border rounded-md shadow-lg p-3 text-sm text-muted-foreground"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                            zIndex: 9999,
                            pointerEvents: 'auto',
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          No matching users found
                        </div>
                      )}
                    </>,
                    document.body
                  )}
                </div>
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
              disabled={loading || services.length === 0 || statuses.length === 0 || nameDuplicate}
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

