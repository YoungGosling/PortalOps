'use client';

import { useState, useEffect } from 'react';
import { fetchQueryCurrenciesAction } from '@/api/currency/query_currencies/action';
import { fetchAddCurrencyAction } from '@/api/currency/add_currency/action';
import { fetchUpdateCurrencyAction } from '@/api/currency/update_currency/action';
import { fetchRemoveCurrencyAction } from '@/api/currency/remove_currency/action';
import type { Currency, CurrencyCreateRequest, CurrencyUpdateRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function CurrenciesPage() {
  const { isAdmin } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CurrencyCreateRequest>({
    code: '',
    name: '',
    symbol: '',
    description: '',
  });

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const data = await fetchQueryCurrenciesAction();
      setCurrencies(data);
    } catch (error) {
      toast.error('Failed to load currencies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleAdd = () => {
    setEditingCurrency(null);
    setFormData({ code: '', name: '', symbol: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || '',
      description: currency.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (currency: Currency) => {
    setDeletingCurrency(currency);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Currency code and name are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCurrency) {
        await fetchUpdateCurrencyAction(editingCurrency.id, formData as CurrencyUpdateRequest);
        toast.success('Currency updated successfully');
      } else {
        await fetchAddCurrencyAction(formData);
        toast.success('Currency created successfully');
      }
      setDialogOpen(false);
      fetchCurrencies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save currency');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCurrency) return;

    try {
      setSubmitting(true);
      await fetchRemoveCurrencyAction(deletingCurrency.id);
      toast.success('Currency deleted successfully');
      setDeleteDialogOpen(false);
      fetchCurrencies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete currency');
      console.error(error);
    } finally {
      setSubmitting(false);
      setDeletingCurrency(null);
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage currencies
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currency Master File</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage configurable currencies for payment records
          </p>
        </div>
        <Button onClick={handleAdd} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Currency
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : currencies.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 mb-4">
              <DollarSign className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No currencies found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first currency
            </p>
            <Button onClick={handleAdd} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Currency
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Currencies</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {currencies.length} {currencies.length === 1 ? 'currency' : 'currencies'} configured
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {currencies.map((currency) => (
                <div
                  key={currency.id}
                  className="group flex items-center justify-between p-5 hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                      <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{currency.name}</h3>
                        <Badge variant="outline" className="text-xs">{currency.code}</Badge>
                        {currency.symbol && (
                          <span className="text-sm text-muted-foreground">({currency.symbol})</span>
                        )}
                      </div>
                      {currency.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {currency.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={() => handleEdit(currency)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => handleDelete(currency)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
            <DialogDescription>
              {editingCurrency
                ? 'Update the currency information below'
                : 'Create a new currency for payment records'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Currency Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g., USD, EUR, HKD"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={submitting}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Currency Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., US Dollar, Euro, Hong Kong Dollar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Currency Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., $, €, HK$"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                disabled={submitting}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of the currency"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingCurrency ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{editingCurrency ? 'Update' : 'Create'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Currency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingCurrency?.name}&quot; ({deletingCurrency?.code})? This action cannot be undone.
              This will fail if the currency is currently assigned to any payment records.
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


