'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './auth-provider';

interface PaymentSummaryContextType {
  incompleteCount: number;
  loading: boolean;
  refreshSummary: () => Promise<void>;
}

const PaymentSummaryContext = createContext<PaymentSummaryContextType | undefined>(
  undefined
);

export function PaymentSummaryProvider({ children }: { children: React.ReactNode }) {
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSummary = useCallback(async () => {
    if (!user) {
      setIncompleteCount(0);
      setLoading(false);
      return;
    }

    try {
      const summary = await apiClient.getPaymentSummary();
      setIncompleteCount(summary.incomplete_count);
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
      setIncompleteCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refreshSummary = async () => {
    await fetchSummary();
  };

  return (
    <PaymentSummaryContext.Provider
      value={{
        incompleteCount,
        loading,
        refreshSummary,
      }}
    >
      {children}
    </PaymentSummaryContext.Provider>
  );
}

export function usePaymentSummary() {
  const context = useContext(PaymentSummaryContext);
  if (context === undefined) {
    throw new Error(
      'usePaymentSummary must be used within a PaymentSummaryProvider'
    );
  }
  return context;
}

