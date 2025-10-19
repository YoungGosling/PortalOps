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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { productsApi } from '@/lib/api'
import { ServiceProduct, WebService } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  serviceId: z.string().min(1, 'Service is required'),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ServiceProduct | null
  services: WebService[]
  onSuccess: () => void
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  services,
  onSuccess,
}: ProductFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        serviceId: product.serviceId || '',
      })
      setSelectedServiceId(product.serviceId || '')
    } else {
      reset({
        name: '',
        serviceId: '',
      })
      setSelectedServiceId('')
    }
  }, [product, reset])

  const handleServiceChange = (value: string) => {
    setSelectedServiceId(value)
    setValue('serviceId', value)
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)

      if (product) {
        // Update existing product
        await productsApi.updateProduct(product.id, {
          name: data.name,
          serviceId: data.serviceId,
        })
        toast.success('Product updated successfully')
      } else {
        // Create new product
        await productsApi.createProduct({
          name: data.name,
          serviceId: data.serviceId,
        })
        toast.success('Product created successfully')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to save product:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product details and service assignment'
              : 'Create a new product and assign it to a service'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Gmail Business"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">
              Service <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedServiceId} onValueChange={handleServiceChange}>
              <SelectTrigger id="serviceId">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          <DialogFooter>
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
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

