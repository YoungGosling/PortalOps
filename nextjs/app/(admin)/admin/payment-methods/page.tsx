'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PaymentMethod, PaymentMethodCreateRequest, PaymentMethodUpdateRequest } from '@/types';
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
import { Plus, Edit2, Trash2, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function PaymentMethodsPage() {
  const { isAdmin } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentMethodCreateRequest>({
    name: '',
    description: '',
  });

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPaymentMethods();
      setMethods(data);
    } catch (error) {
      toast.error('Failed to load payment methods');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = () => {
    setEditingMethod(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (method: PaymentMethod) => {
    setDeletingMethod(method);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Payment method name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingMethod) {
        await apiClient.updatePaymentMethod(editingMethod.id, formData as PaymentMethodUpdateRequest);
        toast.success('Payment method updated successfully');
      } else {
        await apiClient.createPaymentMethod(formData);
        toast.success('Payment method created successfully');
      }
      setDialogOpen(false);
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payment method');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMethod) return;

    try {
      setSubmitting(true);
      await apiClient.deletePaymentMethod(deletingMethod.id);
      toast.success('Payment method deleted successfully');
      setDeleteDialogOpen(false);
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment method');
      console.error(error);
    } finally {
      setSubmitting(false);
      setDeletingMethod(null);
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage payment methods
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Method Master File</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage configurable payment methods
          </p>
        </div>
        <Button onClick={handleAdd} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : methods.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 mb-4">
              <CreditCard className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No payment methods found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first payment method
            </p>
            <Button onClick={handleAdd} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Payment Methods</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {methods.length} {methods.length === 1 ? 'method' : 'methods'} configured
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="group flex items-center justify-between p-5 hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                      <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{method.name}</h3>
                      </div>
                      {method.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {method.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={() => handleEdit(method)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => handleDelete(method)}
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
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod 
                ? 'Update the payment method name and description' 
                : 'Create a new payment method for billing transactions'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Method Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Credit Card, Direct Debit, Bank Transfer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional description for this payment method"
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
                editingMethod ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingMethod?.name}"? This action cannot be undone.
              This will fail if the method is currently assigned to any payment records.
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

