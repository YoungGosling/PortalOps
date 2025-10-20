import { PaymentInfo } from '@/types';

export function isPaymentComplete(payment: PaymentInfo): boolean {
  return !!(
    payment.amount &&
    payment.cardholder_name &&
    payment.expiry_date &&
    payment.payment_method &&
    payment.invoices &&
    payment.invoices.length > 0
  );
}

export function getPaymentCompletionStatus(payment: PaymentInfo): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!payment.amount) missingFields.push('Amount');
  if (!payment.cardholder_name) missingFields.push('Cardholder Name');
  if (!payment.expiry_date) missingFields.push('Expiry Date');
  if (!payment.payment_method) missingFields.push('Payment Method');
  if (!payment.invoices || payment.invoices.length === 0) missingFields.push('Invoice');

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

export function sortPaymentsByCompleteness(payments: PaymentInfo[]): PaymentInfo[] {
  return [...payments].sort((a, b) => {
    const aComplete = isPaymentComplete(a);
    const bComplete = isPaymentComplete(b);
    
    if (aComplete === bComplete) return 0;
    return aComplete ? 1 : -1; // Incomplete first
  });
}

