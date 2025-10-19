'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { PaymentInfo } from '@/types';
import { sortPaymentsByCompleteness } from '@/lib/billingUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, CheckCircle2, AlertCircle, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditFormData {
  amount: string;
  cardholder_name: string;
  expiry_date: string;
  payment_method: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    amount: '',
    cardholder_name: '',
    expiry_date: '',
    payment_method: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPaymentRegister();
      setPayments(sortPaymentsByCompleteness(data));
    } catch (error) {
      toast.error('Failed to load payment records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Convert MM/DD/YYYY to YYYY-MM-DD for date input
  const convertToDateInput = (dateStr: string): string => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = dateStr.split('/');
    if (month && day && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Convert YYYY-MM-DD to MM/DD/YYYY for API
  const convertToApiFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    // If already in MM/DD/YYYY format, return as is
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
    // Convert YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${month}/${day}/${year}`;
    }
    return dateStr;
  };

  const handleEdit = (payment: PaymentInfo) => {
    setEditingPaymentId(payment.product_id);
    setFormData({
      amount: payment.amount?.toString() || '',
      cardholder_name: payment.cardholder_name || '',
      expiry_date: convertToDateInput(payment.expiry_date || ''),
      payment_method: payment.payment_method || '',
    });
  };

  const handleCancel = () => {
    setEditingPaymentId(null);
    setFormData({
      amount: '',
      cardholder_name: '',
      expiry_date: '',
      payment_method: '',
    });
  };

  const handleSave = async (productId: string) => {
    // Validate required fields
    if (!formData.amount || !formData.cardholder_name || !formData.expiry_date || !formData.payment_method) {
      toast.error('All fields are required');
      return;
    }

    // Validate amount is a valid number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be a valid positive number');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create FormData for multipart/form-data submission
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('amount', amount.toString());
      formDataToSubmit.append('cardholder_name', formData.cardholder_name);
      // Backend expects YYYY-MM-DD format (ISO format)
      formDataToSubmit.append('expiry_date', formData.expiry_date);
      formDataToSubmit.append('payment_method', formData.payment_method);
      
      await apiClient.updatePaymentInfo(productId, formDataToSubmit);
      toast.success('Payment information updated successfully');
      handleCancel();
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update payment information');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Register</h1>
        <p className="text-muted-foreground">
          Manage billing information for all products
        </p>
      </div>

      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded mb-2" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 mb-4">
              <CreditCard className="h-16 w-16 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No payment records found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Payment records are created automatically when products are added
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {payments.map((payment) => {
                const isEditing = editingPaymentId === payment.product_id;
                const isIncomplete = !payment.is_complete;
                
                return (
                  <div
                    key={payment.product_id}
                    className={`flex items-start gap-4 p-5 transition-colors ${
                      isEditing 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                        : isIncomplete 
                        ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20' 
                        : 'hover:bg-accent/10'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {payment.is_complete ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="relative">
                          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Payment Type Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                        <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    {isEditing ? (
                      // Edit Mode
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-semibold">{payment.product_name}</h3>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Editing
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {payment.service_name}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Amount</label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Cardholder Name</label>
                              <Input
                                placeholder="Enter cardholder name"
                                value={formData.cardholder_name}
                                onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
                              <Input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                              <Select
                                value={formData.payment_method}
                                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                                  <SelectItem value="Visa">Visa</SelectItem>
                                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="PayPal">PayPal</SelectItem>
                                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            size="default"
                            onClick={() => handleSave(payment.product_id)}
                            disabled={submitting}
                            className="min-w-[80px]"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={handleCancel}
                            disabled={submitting}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{payment.product_name}</h3>
                            <Badge 
                              variant={payment.is_complete ? 'default' : 'secondary'}
                              className={payment.is_complete 
                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-0' 
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0'
                              }
                            >
                              {payment.is_complete ? 'Complete' : 'Incomplete'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {payment.service_name}
                          </p>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Amount</p>
                              {payment.amount ? (
                                <p className="font-semibold text-base">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              ) : (
                                <p className="text-muted-foreground">Not set</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Cardholder</p>
                              {payment.cardholder_name ? (
                                <p className="font-medium truncate">{payment.cardholder_name}</p>
                              ) : (
                                <p className="text-muted-foreground">Not set</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                              {payment.expiry_date ? (
                                <p className="font-medium">{payment.expiry_date}</p>
                              ) : (
                                <p className="text-muted-foreground">Not set</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Method</p>
                              {payment.payment_method ? (
                                <p className="font-medium truncate">{payment.payment_method}</p>
                              ) : (
                                <p className="text-muted-foreground">Not set</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <Button
                            variant="default"
                            size="lg"
                            onClick={() => handleEdit(payment)}
                            disabled={editingPaymentId !== null}
                            className="min-w-[100px]"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

