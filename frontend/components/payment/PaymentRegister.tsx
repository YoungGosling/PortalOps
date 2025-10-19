'use client'

import React, { useState, useEffect } from 'react'
import { Upload, Check, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { paymentApi } from '@/lib/api'
import { toast } from 'sonner'
import type { PaymentRegisterItem } from '@/types'

export function PaymentRegister() {
  const [items, setItems] = useState<PaymentRegisterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<PaymentRegisterItem>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingFileFor, setUploadingFileFor] = useState<string | null>(null)

  useEffect(() => {
    loadPaymentRegister()
  }, [])

  const loadPaymentRegister = async () => {
    try {
      setLoading(true)
      const data = await paymentApi.getPaymentRegister()
      // Sort: incomplete items first (red), then complete items (green)
      const sorted = data.sort((a, b) => {
        if (a.isComplete === b.isComplete) return 0
        return a.isComplete ? 1 : -1
      })
      setItems(sorted)
    } catch (error) {
      toast.error('Failed to load payment register')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = (item: PaymentRegisterItem) => {
    setEditingItemId(item.id)
    setEditFormData({
      amount: item.amount,
      cardholderName: item.cardholderName,
      expiryDate: item.expiryDate,
      paymentMethod: item.paymentMethod,
      billAttachment: item.billAttachment,
    })
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditFormData({})
  }

  const handleSaveEdit = async (itemId: string, productId: string) => {
    try {
      setSaving(true)
      await paymentApi.updatePaymentInfo(productId, {
        amount: editFormData.amount,
        cardholderName: editFormData.cardholderName,
        expiryDate: editFormData.expiryDate,
        paymentMethod: editFormData.paymentMethod,
      })
      toast.success('Payment information updated successfully')
      setEditingItemId(null)
      setEditFormData({})
      await loadPaymentRegister()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment information')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (productId: string, file: File) => {
    if (!file) return

    // Validate file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    try {
      setUploadingFileFor(productId)
      const response = await paymentApi.uploadBillAttachment(productId, file)
      toast.success('Bill attachment uploaded successfully')
      setEditFormData(prev => ({ ...prev, billAttachment: response.fileUrl }))
      await loadPaymentRegister()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file')
      console.error(error)
    } finally {
      setUploadingFileFor(null)
    }
  }

  const isFieldComplete = (value: any) => {
    return value !== undefined && value !== null && value !== ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading payment register...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Register</h1>
        <p className="text-muted-foreground">
          Manage billing information for all products. Records with incomplete information are shown first.
        </p>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-sm">Incomplete (missing fields)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm">Complete (all fields filled)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Register Table */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                No products yet. Create products to see billing records here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cardholder</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Bill Attachment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const isEditing = editingItemId === item.id
                    return (
                      <TableRow key={item.id}>
                        {/* Status Indicator */}
                        <TableCell>
                          {item.isComplete ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </TableCell>

                        {/* Service (Read-only) */}
                        <TableCell className="font-medium text-muted-foreground">
                          {item.serviceName}
                        </TableCell>

                        {/* Product (Read-only) */}
                        <TableCell className="font-medium text-muted-foreground">
                          {item.productName}
                        </TableCell>

                        {/* Amount (Editable) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editFormData.amount || ''}
                              onChange={e => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                              placeholder="Amount"
                              className="w-32"
                            />
                          ) : (
                            <span className={!isFieldComplete(item.amount) ? 'text-destructive' : ''}>
                              {item.amount ? `$${item.amount.toFixed(2)}` : '-'}
                            </span>
                          )}
                        </TableCell>

                        {/* Cardholder Name (Editable) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editFormData.cardholderName || ''}
                              onChange={e => setEditFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
                              placeholder="Cardholder name"
                              className="w-48"
                            />
                          ) : (
                            <span className={!isFieldComplete(item.cardholderName) ? 'text-destructive' : ''}>
                              {item.cardholderName || '-'}
                            </span>
                          )}
                        </TableCell>

                        {/* Expiry Date (Editable) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editFormData.expiryDate || ''}
                              onChange={e => setEditFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                              className="w-40"
                            />
                          ) : (
                            <span className={!isFieldComplete(item.expiryDate) ? 'text-destructive' : ''}>
                              {item.expiryDate || '-'}
                            </span>
                          )}
                        </TableCell>

                        {/* Payment Method (Editable) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editFormData.paymentMethod || ''}
                              onChange={e => setEditFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                              placeholder="Payment method"
                              className="w-40"
                            />
                          ) : (
                            <span className={!isFieldComplete(item.paymentMethod) ? 'text-destructive' : ''}>
                              {item.paymentMethod || '-'}
                            </span>
                          )}
                        </TableCell>

                        {/* Bill Attachment (File Upload) */}
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id={`file-${item.id}`}
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(item.productId, file)
                                }}
                                disabled={uploadingFileFor === item.productId}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                                disabled={uploadingFileFor === item.productId}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {uploadingFileFor === item.productId ? 'Uploading...' : 'Upload'}
                              </Button>
                              {editFormData.billAttachment && (
                                <a
                                  href={editFormData.billAttachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          ) : (
                            item.billAttachment ? (
                              <a
                                href={item.billAttachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View File
                              </a>
                            ) : (
                              <span className="text-destructive">-</span>
                            )
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(item.id, item.productId)}
                                disabled={saving}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {saving ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
