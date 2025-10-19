'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { servicesApi } from '@/lib/api'
import { WebService, ServiceProduct } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  vendor: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: WebService | null
  unassociatedProducts: ServiceProduct[]
  onSuccess: () => void
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  unassociatedProducts,
  onSuccess,
}: ServiceFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [currentProducts, setCurrentProducts] = useState<ServiceProduct[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  })

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        vendor: service.vendor || '',
      })
      // Get current products for this service
      setCurrentProducts(service.products || [])
      setSelectedProductIds([])
    } else {
      reset({
        name: '',
        vendor: '',
      })
      setCurrentProducts([])
      setSelectedProductIds([])
    }
  }, [service, reset])

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleCurrentProductRemove = (productId: string) => {
    setCurrentProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const onSubmit = async (data: ServiceFormData) => {
    try {
      setLoading(true)

      if (service) {
        // Update existing service
        const productsToRemove = (service.products || [])
          .filter((p) => !currentProducts.some((cp) => cp.id === p.id))
          .map((p) => p.id)

        await servicesApi.updateService(service.id, {
          name: data.name,
          vendor: data.vendor,
          associateProductIds: selectedProductIds,
          disassociateProductIds: productsToRemove,
        })
        toast.success('Service updated successfully')
      } else {
        // Create new service
        await servicesApi.createService({
          name: data.name,
          vendor: data.vendor,
          productIds: selectedProductIds,
        })
        toast.success('Service created successfully')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to save service:', error)
      toast.error(error.message || 'Failed to save service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription>
            {service
              ? 'Update service details and manage product associations'
              : 'Create a new service and optionally associate products'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Google Workspace"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Vendor */}
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., Google"
                  {...register('vendor')}
                />
              </div>

              <Separator />

              {/* Current Products (Edit mode) */}
              {service && currentProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Products</Label>
                  <div className="space-y-2 border rounded-md p-4">
                    {currentProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                      >
                        <span className="text-sm">{product.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCurrentProductRemove(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Products */}
              {unassociatedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    {service ? 'Add Products' : 'Associate Products'} (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select products to associate with this service
                  </p>
                  <div className="space-y-2 border rounded-md p-4">
                    {unassociatedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                      >
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unassociatedProducts.length === 0 && !service && (
                <p className="text-sm text-muted-foreground">
                  No unassociated products available
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {service ? 'Update Service' : 'Create Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

