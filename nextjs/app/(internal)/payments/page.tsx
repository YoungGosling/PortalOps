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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-chart-5/20 to-destructive/20">
            <CreditCard className="h-8 w-8 text-chart-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-chart-5 to-destructive bg-clip-text text-transparent">
              Payment Register
            </h1>
            <p className="text-muted-foreground">
              Manage billing information for all products
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded mb-2" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-chart-5/20 to-info/20 mb-4">
              <CreditCard className="h-12 w-12 text-chart-5" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No payment records found</h3>
            <p className="text-sm text-muted-foreground">
              Payment records are created automatically when products are added
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {payments.map((payment) => {
                const isEditing = editingPaymentId === payment.product_id;
                
                return (
                  <div
                    key={payment.product_id}
                    className={`flex items-center gap-4 p-4 transition-all duration-200 ${
                      isEditing ? 'bg-gradient-to-r from-primary/10 to-info/10 shadow-sm' : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {payment.is_complete ? (
                        <div className="p-1 rounded-full bg-success/20">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-warning/20 animate-pulse">
                          <AlertCircle className="h-5 w-5 text-warning" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{payment.product_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {payment.service_name}
                      </p>
                    </div>
                    
                    {isEditing ? (
                      // Edit Mode
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-40">
                            <Input
                              placeholder="Cardholder name"
                              value={formData.cardholder_name}
                              onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              type="date"
                              value={formData.expiry_date}
                              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-32">
                            <Select
                              value={formData.payment_method}
                              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Method" />
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSave(payment.product_id)}
                              disabled={submitting}
                              className="h-8 w-8 p-0 hover:bg-success/20 transition-colors"
                            >
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancel}
                              disabled={submitting}
                              className="h-8 w-8 p-0 hover:bg-destructive/20 transition-colors"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="w-32">
                            {payment.amount ? (
                              <span className="font-semibold text-success">${payment.amount}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                          <div className="w-40 truncate">
                            {payment.cardholder_name || (
                              <span className="text-muted-foreground">No cardholder</span>
                            )}
                          </div>
                          <div className="w-32">
                            {payment.expiry_date || (
                              <span className="text-muted-foreground">No date</span>
                            )}
                          </div>
                          <div className="w-32 truncate">
                            {payment.payment_method || (
                              <span className="text-muted-foreground">No method</span>
                            )}
                          </div>
                          <Badge
                            variant={payment.is_complete ? 'success' : 'warning'}
                            className="shrink-0"
                          >
                            {payment.is_complete ? 'Complete' : 'Incomplete'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(payment)}
                            disabled={editingPaymentId !== null}
                            className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit className="h-4 w-4" />
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

