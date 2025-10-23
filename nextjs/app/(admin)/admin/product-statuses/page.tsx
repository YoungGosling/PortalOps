'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { ProductStatus, ProductStatusCreateRequest, ProductStatusUpdateRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function ProductStatusesPage() {
  const { isAdmin } = useAuth();
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProductStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<ProductStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductStatusCreateRequest>({
    name: '',
    description: '',
  });

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProductStatuses();
      setStatuses(data);
    } catch (error) {
      toast.error('Failed to load product statuses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleAdd = () => {
    setEditingStatus(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (status: ProductStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (status: ProductStatus) => {
    setDeletingStatus(status);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStatus) {
        await apiClient.updateProductStatus(editingStatus.id, formData as ProductStatusUpdateRequest);
        toast.success('Product status updated successfully');
      } else {
        await apiClient.createProductStatus(formData);
        toast.success('Product status created successfully');
      }
      setDialogOpen(false);
      fetchStatuses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product status');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStatus) return;

    try {
      setSubmitting(true);
      await apiClient.deleteProductStatus(deletingStatus.id);
      toast.success('Product status deleted successfully');
      setDeleteDialogOpen(false);
      fetchStatuses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product status');
      console.error(error);
    } finally {
      setSubmitting(false);
      setDeletingStatus(null);
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage product statuses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Status Master File</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage configurable product statuses
          </p>
        </div>
        <Button onClick={handleAdd} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Status
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : statuses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950 mb-4">
              <Tag className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No statuses found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first product status
            </p>
            <Button onClick={handleAdd} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Product Statuses</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {statuses.length} {statuses.length === 1 ? 'status' : 'statuses'} configured
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="group flex items-center justify-between p-5 hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 transition-colors">
                      <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{status.name}</h3>
                      </div>
                      {status.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {status.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={() => handleEdit(status)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => handleDelete(status)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Product Status' : 'Add Product Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus 
                ? 'Update the product status name and description' 
                : 'Create a new product status for categorizing products'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Active, Inactive, Overdue"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional description for this status"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingStatus ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingStatus?.name}"? This action cannot be undone.
              This will fail if the status is currently assigned to any products.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

