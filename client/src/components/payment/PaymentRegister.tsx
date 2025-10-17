import React, { useState, useEffect } from 'react'
import { 
  Edit2, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Calendar,
  User,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DatePicker } from '../ui/DatePicker'
import { useAuth } from '../../contexts/AuthContext'
import { usePaymentSummaryContext } from '../../contexts/PaymentSummaryContext'
import { mockServices } from '../../data/mockData'
import { getAllProductsWithBilling } from '../../lib/billingUtils'
import { WebService, ServiceProduct, ProductBillingInfo } from '../../types'
import { paymentApi } from '../../lib/api'

interface EditableRowProps {
  service: WebService
  product: ServiceProduct
  isComplete: boolean
  onSave: (productId: string, billingInfo: Partial<ProductBillingInfo>) => void
}

// Helper function to convert date to DatePicker format (YYYY-MM-DD)
const convertToDatePickerFormat = (dateString: string): string => {
  if (!dateString) return ''
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // If it's in MM/YYYY format, convert to YYYY-MM-01
  if (/^\d{2}\/\d{4}$/.test(dateString)) {
    const [month, year] = dateString.split('/')
    return `${year}-${month}-01`
  }
  
  return ''
}

function EditableRow({ service, product, isComplete, onSave }: EditableRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    billAmount: (product as any).paymentInfo?.amount?.toString() || product.billingInfo?.billAmount?.toString() || (product as any).amount?.toString() || '',
    cardholderName: (product as any).paymentInfo?.cardholderName || product.billingInfo?.cardholderName || (product as any).cardholderName || '',
    expirationDate: convertToDatePickerFormat((product as any).paymentInfo?.expiryDate || product.billingInfo?.expirationDate || (product as any).expiryDate || ''),
    paymentMethod: (product as any).paymentInfo?.paymentMethod || product.billingInfo?.paymentMethod || (product as any).paymentMethod || '',
  })

  // Validation function to check if all required fields are filled
  const validateBillingInfo = () => {
    const errors: string[] = []
    
    if (!editData.billAmount || parseFloat(editData.billAmount) <= 0) {
      errors.push('Bill Amount')
    }
    if (!editData.cardholderName?.trim()) {
      errors.push('Cardholder Name')
    }
    if (!editData.expirationDate) {
      errors.push('Expiration Date')
    }
    if (!editData.paymentMethod) {
      errors.push('Payment Method')
    }
    
    return errors
  }

  const handleSave = () => {
    // Validate all required fields
    const validationErrors = validateBillingInfo()
    
    if (validationErrors.length > 0) {
      alert(`Please fill in the following required fields:\n• ${validationErrors.join('\n• ')}`)
      return
    }
    
    const billingInfo: Partial<ProductBillingInfo> = {
      billAmount: parseFloat(editData.billAmount),
      cardholderName: editData.cardholderName.trim(),
      expirationDate: editData.expirationDate,
      paymentMethod: editData.paymentMethod,
    }
    
    onSave(product.id, billingInfo)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      billAmount: (product as any).paymentInfo?.amount?.toString() || product.billingInfo?.billAmount?.toString() || (product as any).amount?.toString() || '',
      cardholderName: (product as any).paymentInfo?.cardholderName || product.billingInfo?.cardholderName || (product as any).cardholderName || '',
      expirationDate: convertToDatePickerFormat((product as any).paymentInfo?.expiryDate || product.billingInfo?.expirationDate || (product as any).expiryDate || ''),
      paymentMethod: (product as any).paymentInfo?.paymentMethod || product.billingInfo?.paymentMethod || (product as any).paymentMethod || '',
    })
    setIsEditing(false)
  }

  return (
    <tr className={`border-b ${isComplete ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium">{service?.name || 'Unknown Service'}</span>
        </div>
      </td>
      <td className="px-4 py-3">{product?.name || 'Unknown Product'}</td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            type="number"
            value={editData.billAmount}
            onChange={(e) => setEditData(prev => ({ ...prev, billAmount: e.target.value }))}
            placeholder="0.00"
            className="w-24"
          />
        ) : (
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3 text-gray-500" />
            <span>{(product as any).paymentInfo?.amount || product.billingInfo?.billAmount || (product as any).amount || '-'}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            value={editData.cardholderName}
            onChange={(e) => setEditData(prev => ({ ...prev, cardholderName: e.target.value }))}
            placeholder="Cardholder name"
            className="w-40"
          />
        ) : (
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-gray-500" />
            <span>{(product as any).paymentInfo?.cardholderName || product.billingInfo?.cardholderName || (product as any).cardholderName || '-'}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <DatePicker
            value={editData.expirationDate}
            onChange={(value) => setEditData(prev => ({ ...prev, expirationDate: value }))}
            placeholder="Select expiry date"
            className="w-36"
            monthYearOnly={false}
          />
        ) : (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-gray-500" />
            <span>{formatDisplayDate((product as any).paymentInfo?.expiryDate || product.billingInfo?.expirationDate || (product as any).expiryDate) || '-'}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <select
            value={editData.paymentMethod}
            onChange={(e) => setEditData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">Select method</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="PayPal">PayPal</option>
          </select>
        ) : (
          <div className="flex items-center space-x-1">
            <CreditCard className="h-3 w-3 text-gray-500" />
            <span>{(product as any).paymentInfo?.paymentMethod || product.billingInfo?.paymentMethod || (product as any).paymentMethod || '-'}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={validateBillingInfo().length > 0}
                className={validateBillingInfo().length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                title={validateBillingInfo().length > 0 ? `Missing: ${validateBillingInfo().join(', ')}` : 'Save changes'}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}


// Helper function to format expiry date for backend (YYYY-MM-DD format)
const formatExpiryDate = (dateString: string): string => {
  if (!dateString) return ''
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // If it's in MM/YYYY format, convert to YYYY-MM-01
  if (/^\d{2}\/\d{4}$/.test(dateString)) {
    const [month, year] = dateString.split('/')
    return `${year}-${month}-01`
  }
  
  // Try to parse as Date and format
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}-01`
    }
  } catch (e) {
    console.warn('Could not parse expiry date:', dateString)
  }
  
  return dateString // Return original if can't parse
}

// Helper function to format expiry date for display (MM/DD/YYYY format)
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return ''
  
  // If it's in MM/DD/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString
  }
  
  // If it's in MM/YYYY format, convert to MM/01/YYYY (first day of month)
  if (/^\d{2}\/\d{4}$/.test(dateString)) {
    const [month, year] = dateString.split('/')
    return `${month}/01/${year}`
  }
  
  // If it's in YYYY-MM-DD format, convert to MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-')
    return `${month}/${day}/${year}`
  }
  
  // Try to parse as Date and format
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
    }
  } catch (e) {
    console.warn('Could not parse expiry date for display:', dateString)
  }
  
  return dateString // Return original if can't parse
}

export function PaymentRegister() {
  const { hasRole } = useAuth()
  const { refreshCount } = usePaymentSummaryContext()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load payment register data from API
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Try to load from API first
        const paymentRegister = await paymentApi.getPaymentRegister()
        
        // Debug logging
        console.log('🔍 Raw API response:', paymentRegister)
        paymentRegister.forEach((item: any, index: number) => {
          console.log(`🔍 Product ${index}:`, {
            productId: item.productId,
            productName: item.productName,
            paymentInfo: item.paymentInfo
          })
        })
          
        // Sort products: incomplete first, complete last
        const sortedProducts = paymentRegister.sort((a: any, b: any) => {
          const aComplete = a.paymentInfo?.status === 'complete'
          const bComplete = b.paymentInfo?.status === 'complete'
          if (aComplete === bComplete) return 0
          return aComplete ? 1 : -1
        })
        
        setProducts(sortedProducts)
        console.log('✅ Payment register loaded from API:', sortedProducts.length, 'products')
      } catch (err) {
        console.error('❌ Failed to load payment register from API:', err)
        setError('API connection failed. Using mock data for demonstration.')
        
        // Fallback to mock data
        const mockProducts = getAllProductsWithBilling(mockServices)
        
        // Sort mock products: incomplete first, complete last
        const sortedMockProducts = mockProducts.sort((a: any, b: any) => {
          const aComplete = a.paymentInfo?.status === 'complete'
          const bComplete = b.paymentInfo?.status === 'complete'
          if (aComplete === bComplete) return 0
          return aComplete ? 1 : -1
        })
        
        setProducts(sortedMockProducts)
        console.log('📋 Using mock data:', sortedMockProducts.length, 'products')
      } finally {
        setLoading(false)
      }
    }

    if (hasRole('Admin')) {
      loadPaymentData()
    }
  }, [hasRole])

  // Access control - only Admin can access
  if (!hasRole('Admin')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access the Payment Register.
        </p>
      </div>
    )
  }

  const handleSaveBilling = async (productId: string, billingInfo: Partial<ProductBillingInfo>) => {
    try {
      // Map frontend field names to backend field names
      const backendPayload = {
        amount: (billingInfo as any).billAmount,
        cardholder_name: billingInfo.cardholderName,
        expiry_date: formatExpiryDate((billingInfo as any).expirationDate),
        payment_method: (billingInfo as any).paymentMethod
      }
      
      // Call API to update payment info
      await paymentApi.updatePaymentInfo(productId, backendPayload)
      console.log('✅ Payment info updated successfully')
      
      // Show success message
      alert('Payment information saved successfully!')
      
      // Refresh the sidebar count
      await refreshCount()
      
      // Reload data from API to ensure consistency
      try {
        setLoading(true)
        const paymentRegister = await paymentApi.getPaymentRegister()
        setProducts(paymentRegister)
        console.log('🔄 Payment register reloaded from API:', paymentRegister.length, 'products')
      } catch (reloadError) {
        console.error('❌ Failed to reload payment register:', reloadError)
        // If reload fails, fall back to local state update
        setProducts(prevProducts => 
          prevProducts.map(item => {
            if (item.product?.id === productId || item.productId === productId) {
              const updatedItem = {
                ...item,
                paymentInfo: {
                  ...item.paymentInfo,
                  ...billingInfo,
                  status: !!(
                    (billingInfo as any).billAmount &&
                    billingInfo.cardholderName &&
                    (billingInfo as any).expirationDate &&
                    (billingInfo as any).paymentMethod
                  ) ? 'complete' : 'incomplete'
                }
              }
              return updatedItem
            }
            return item
          }).sort((a, b) => {
            const aComplete = a.paymentInfo?.status === 'complete'
            const bComplete = b.paymentInfo?.status === 'complete'
            if (aComplete === bComplete) return 0
            return aComplete ? 1 : -1
          })
        )
      } finally {
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ Failed to update payment info:', err)
      alert('Failed to update payment information. Please try again.')
    }
  }


  const incompleteCount = products.filter(p => p.paymentInfo?.status === 'incomplete').length
  const completeCount = products.filter(p => p.paymentInfo?.status === 'complete').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Register</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage product billing information and payment details
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading payment register...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Register</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product billing information and payment details
          </p>
          {error && (
            <p className="text-yellow-600 text-sm mt-1">
              ⚠️ {error}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{incompleteCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Incomplete Billing</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completeCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Complete Billing</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Billing Information</CardTitle>
          <CardDescription>
            Products with incomplete billing information are shown first with red indicators.
            Complete billing information is shown with green indicators.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bill Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cardholder
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((item) => (
                  <EditableRow
                    key={item.productId || item.product?.id || item.id}
                    service={item.service || { name: item.serviceName, id: item.serviceId }}
                    product={item.product || { 
                      id: item.productId, 
                      name: item.productName,
                      paymentInfo: item.paymentInfo
                    }}
                    isComplete={item.paymentInfo?.status === 'complete' || item.isComplete}
                    onSave={handleSaveBilling}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Products will appear here when they are created in the Product Inventory.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
