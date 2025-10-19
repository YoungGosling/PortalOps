'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { EditPanel } from '@/components/shared/EditPanel'
import { servicesApi, productsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { WebService, ServiceProduct } from '@/types'

export function ServiceInventory() {
  const [services, setServices] = useState<WebService[]>([])
  const [unassociatedProducts, setUnassociatedProducts] = useState<ServiceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingService, setEditingService] = useState<WebService | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    selectedProductIds: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await servicesApi.getServices()
      setServices(data)
    } catch (error) {
      toast.error('Failed to load services')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnassociatedProducts = async () => {
    try {
      const data = await servicesApi.getUnassociatedProducts()
      setUnassociatedProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
      console.error(error)
    }
  }

  const handleAddService = () => {
    setEditingService(null)
    setFormData({ name: '', selectedProductIds: [] })
    loadUnassociatedProducts()
    setIsPanelOpen(true)
  }

  const handleEditService = (service: WebService) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      selectedProductIds: service.products?.map(p => p.id) || [],
    })
    loadUnassociatedProducts()
    setIsPanelOpen(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure? Deleting this service will unlink all associated products, but the products themselves will not be deleted.')) {
      return
    }

    try {
      await servicesApi.deleteService(serviceId)
      toast.success('Service deleted successfully')
      await loadServices()
    } catch (error) {
      toast.error('Failed to delete service')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Service name is required')
      return
    }

    try {
      setSubmitting(true)
      if (editingService) {
        await servicesApi.updateService(editingService.id, {
          name: formData.name,
          productIds: formData.selectedProductIds,
        })
        toast.success('Service updated successfully')
      } else {
        await servicesApi.createService({
          name: formData.name,
          productIds: formData.selectedProductIds,
        })
        toast.success('Service created successfully')
      }
      setIsPanelOpen(false)
      await loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter(id => id !== productId)
        : [...prev.selectedProductIds, productId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading services...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Inventory</h1>
          <p className="text-muted-foreground">
            Manage your services and their associated products
          </p>
        </div>
        <Button onClick={handleAddService}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No services yet</p>
            <Button onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <Card key={service.id} className="relative group hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{service.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditService(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{service.productCount || service.products?.length || 0} Products</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Panel */}
      <EditPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
        description={editingService ? 'Update service details and product associations' : 'Create a new service and associate products'}
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitLabel={editingService ? 'Update Service' : 'Create Service'}
      >
        <div className="space-y-4">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name *</Label>
            <Input
              id="service-name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Associate Products (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select products to associate with this service
            </p>
            {unassociatedProducts.length === 0 && formData.selectedProductIds.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                No unassociated products available
              </p>
            ) : (
              <div className="border rounded-md p-4 space-y-2 max-h-64 overflow-y-auto">
                {/* Currently selected products (for edit mode) */}
                {editingService?.products?.map(product => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.selectedProductIds.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <label
                      htmlFor={`product-${product.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {product.name}
                    </label>
                  </div>
                ))}
                {/* Unassociated products */}
                {unassociatedProducts.map(product => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.selectedProductIds.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <label
                      htmlFor={`product-${product.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {product.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </EditPanel>
    </div>
  )
}
