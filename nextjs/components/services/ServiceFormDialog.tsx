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
import { fetchListUserAction } from '@/api/users/list_user/action';
import { fetchCreateServiceAction } from '@/api/services/create_service/action';
import { fetchUpdateServiceAction } from '@/api/services/update_service/action';
import { fetchQueryServicesAction } from '@/api/services/query_services/action';
import type { Service, User } from '@/types';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [nameDuplicate, setNameDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adminSearchRef = useRef<HTMLDivElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!service;

  // Fetch all users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      if (service) {
        setName(service.name);
        setSelectedAdminIds(service.admins?.map(admin => admin.id) || []);
        setNameDuplicate(false); // Reset duplicate check when opening edit dialog
      } else {
        setName('');
        setSelectedAdminIds([]);
        setNameDuplicate(false); // Reset duplicate check when opening add dialog
      }
      setAdminSearchQuery('');
      setShowAdminDropdown(false);
    }
  }, [open, service]);

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

  // Check for duplicate service name when name changes
  const checkDuplicateName = useCallback(async (serviceName: string) => {
    if (!serviceName.trim()) {
      setNameDuplicate(false);
      return;
    }

    // For edit mode, skip check if name hasn't changed
    if (isEditMode && service && service.name === serviceName.trim()) {
      setNameDuplicate(false);
      return;
    }

    try {
      setCheckingDuplicate(true);
      const searchResult = await fetchQueryServicesAction(1, 100, serviceName.trim());
      
      // Check if any service has the exact same name (case-insensitive)
      const duplicateService = searchResult.data.find(
        (s) => s.name.toLowerCase() === serviceName.trim().toLowerCase()
      );
      
      // For edit mode, exclude the current service from duplicate check
      if (duplicateService && (!isEditMode || duplicateService.id !== service?.id)) {
        setNameDuplicate(true);
      } else {
        setNameDuplicate(false);
      }
    } catch (error) {
      console.error('Error checking duplicate service name:', error);
      setNameDuplicate(false);
    } finally {
      setCheckingDuplicate(false);
    }
  }, [isEditMode, service]);

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

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetchListUserAction(undefined, undefined, 1, 100); // Fetch up to 100 users
      // Convert null values to undefined to match User type
      const users: User[] = response.data.map(user => ({
        ...user,
        department: user.department ?? undefined,
        department_id: user.department_id ?? undefined,
        position: user.position ?? undefined,
        hire_date: user.hire_date ?? undefined,
        resignation_date: user.resignation_date ?? undefined,
        roles: user.roles as ('Admin' | 'ServiceAdmin')[],
      }));
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
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

  const handleRemoveAdmin = (userId: string) => {
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
      toast.error('Service name is required');
      return;
    }

    try {
      setLoading(true);

      const trimmedName = name.trim();

      // Check if service with the same name already exists
      // For edit mode, only check if the name has changed
      const shouldCheckDuplicate = !isEditMode || (service && service.name !== trimmedName);
      
      if (shouldCheckDuplicate) {
        // Use search API to check for duplicate service names
        const searchResult = await fetchQueryServicesAction(1, 100, trimmedName);
        
        // Check if any service has the exact same name (case-insensitive)
        const duplicateService = searchResult.data.find(
          (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        // For edit mode, exclude the current service from duplicate check
        if (duplicateService && (!isEditMode || duplicateService.id !== service?.id)) {
          toast.error('Service Provider already exists');
          setLoading(false);
          return;
        }
      }

      if (isEditMode && service) {
        // Update existing service
        await fetchUpdateServiceAction(service.id, {
          name: trimmedName,
          adminUserIds: selectedAdminIds,
        });
        toast.success('Service updated successfully');
      } else {
        // Create new service
        await fetchCreateServiceAction({
          name: trimmedName,
          adminUserIds: selectedAdminIds,
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
            {/* Service Name */}
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
                className={`h-11 text-base bg-background ${nameDuplicate ? 'border-destructive' : ''}`}
              />
              {nameDuplicate && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Service Provider already exists
                </p>
              )}
              {checkingDuplicate && !nameDuplicate && name.trim() && (
                <p className="text-sm text-muted-foreground">
                  Checking...
                </p>
              )}
              {!nameDuplicate && !checkingDuplicate && (
                <p className="text-xs text-muted-foreground">
                  Enter a descriptive name for this service
                </p>
              )}
            </div>

            {/* Admin Selection */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">
                Administrators
              </Label>
              
              {/* Selected Admins Display */}
              {selectedAdminIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                  {selectedAdminIds.map((adminId) => {
                    const admin = allUsers.find(u => u.id === adminId);
                    return admin ? (
                      <Badge key={adminId} variant="secondary" className="gap-1">
                        {admin.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(adminId)}
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
              <p className="text-xs text-muted-foreground">
                Search and select administrators for this service
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
              disabled={loading || !name.trim() || nameDuplicate}
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

