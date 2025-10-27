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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import type { Service, User } from '@/types';
import { toast } from 'sonner';
import { Loader2, X, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const isEditMode = !!service;

  // Fetch all users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      if (service) {
        setName(service.name);
        setSelectedAdminIds(service.admins?.map(admin => admin.id) || []);
      } else {
        setName('');
        setSelectedAdminIds([]);
      }
    }
  }, [open, service]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiClient.getUsers(undefined, 1, 100); // Fetch up to 100 users
      setAllUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAdminToggle = (userId: string) => {
    setSelectedAdminIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveAdmin = (userId: string) => {
    setSelectedAdminIds(prev => prev.filter(id => id !== userId));
  };

  const getSelectedAdmins = () => {
    return allUsers.filter(user => selectedAdminIds.includes(user.id));
  };

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
          adminUserIds: selectedAdminIds,
        });
        toast.success('Service updated successfully');
      } else {
        // Create new service
        await apiClient.createService({
          name: name.trim(),
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
                className="h-11 text-base bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Enter a descriptive name for this service
              </p>
            </div>

            {/* Admin Selection */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">
                Service Administrators
              </Label>
              
              {/* Selected Admins Display */}
              {selectedAdminIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                  {getSelectedAdmins().map(admin => (
                    <Badge
                      key={admin.id}
                      variant="secondary"
                      className="pl-2.5 pr-1 py-1 gap-1.5"
                    >
                      <span className="text-xs">{admin.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* User Selection List */}
              <div className="border rounded-lg">
                <ScrollArea className="h-[200px]">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : allUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mb-2" />
                      <p className="text-sm">No users available</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {allUsers.map(user => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAdminIds.includes(user.id)}
                            onCheckedChange={() => handleAdminToggle(user.id)}
                            disabled={loading}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more users to be administrators of this service
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

