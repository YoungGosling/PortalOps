import { useState, useEffect, useCallback } from 'react'
import { paymentApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

export function usePaymentSummary() {
  const { hasRole } = useAuth()
  const [incompleteCount, setIncompleteCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const loadIncompleteCount = useCallback(async () => {
    if (!hasRole('Admin')) {
      setIncompleteCount(0)
      return
    }

    try {
      setLoading(true)
      const summary = await paymentApi.getPaymentSummary()
      setIncompleteCount(summary.incompleteCount)
    } catch (error) {
      console.error('Failed to load payment summary:', error)
      setIncompleteCount(0)
    } finally {
      setLoading(false)
    }
  }, [hasRole])

  useEffect(() => {
    loadIncompleteCount()
  }, [loadIncompleteCount])

  // Return both the count and a refresh function
  return {
    incompleteCount,
    loading,
    refreshCount: loadIncompleteCount
  }
}

