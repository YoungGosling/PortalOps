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
import { createPaymentForProductAction } from '@/api/payment_register/create_payment_for_product/action';
import type { Product, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

export function AddPaymentModal({
  open,
  onOpenChange,
  product,
  paymentMethods,
  onSuccess,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [usageStartDate, setUsageStartDate] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [reporter, setReporter] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setCardholderName('');
      setPaymentMethodId('');
      setPaymentDate('');
      setUsageStartDate('');
      setUsageEndDate('');
      setReporter('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    // Validate required fields
    if (!paymentDate) {
      toast.error('Payment date is required');
      return;
    }

    if (!usageStartDate) {
      toast.error('Usage start date is required');
      return;
    }

    if (!usageEndDate) {
      toast.error('Usage end date is required');
      return;
    }

    // Validate date range
    if (new Date(usageEndDate) < new Date(usageStartDate)) {
      toast.error('Usage end date must be after or equal to start date');
      return;
    }

    try {
      setLoading(true);

      // Create payment record
      const formData = new FormData();
      if (amount) formData.append('amount', amount);
      if (cardholderName) formData.append('cardholder_name', cardholderName);
      if (paymentMethodId) formData.append('payment_method_id', paymentMethodId);
      formData.append('payment_date', paymentDate);
      formData.append('usage_start_date', usageStartDate);
      formData.append('usage_end_date', usageEndDate);
      if (reporter) formData.append('reporter', reporter);

      await createPaymentForProductAction(product.id, formData);

      toast.success('Payment record created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create payment record');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment Record</DialogTitle>
          <DialogDescription>
            Create a new payment record for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Product Info (Read-only) */}
            <div className="space-y-2">
              <Label>Product</Label>
              <Input
                value={product?.name || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Usage Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage-start">
                  Usage Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usage-start"
                  type="date"
                  value={usageStartDate}
                  onChange={(e) => setUsageStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage-end">
                  Usage End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usage-end"
                  type="date"
                  value={usageEndDate}
                  onChange={(e) => setUsageEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholder">Cardholder Name</Label>
              <Input
                id="cardholder"
                placeholder="Enter cardholder name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reporter */}
            <div className="space-y-2">
              <Label htmlFor="reporter">Reporter</Label>
              <Input
                id="reporter"
                placeholder="Leave empty to use your name"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Defaults to your name if left empty
              </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

