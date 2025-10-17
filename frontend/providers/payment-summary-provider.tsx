"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { usePaymentSummary } from '@/hooks/usePaymentSummary'

interface PaymentSummaryContextType {
  incompleteCount: number
  loading: boolean
  refreshCount: () => Promise<void>
}

const PaymentSummaryContext = createContext<PaymentSummaryContextType | undefined>(undefined)

export function PaymentSummaryProvider({ children }: { children: ReactNode }) {
  const paymentSummary = usePaymentSummary()

  return (
    <PaymentSummaryContext.Provider value={paymentSummary}>
      {children}
    </PaymentSummaryContext.Provider>
  )
}

export function usePaymentSummaryContext() {
  const context = useContext(PaymentSummaryContext)
  if (context === undefined) {
    throw new Error('usePaymentSummaryContext must be used within a PaymentSummaryProvider')
  }
  return context
}

