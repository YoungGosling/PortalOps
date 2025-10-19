'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditPanel } from '@/components/shared/EditPanel'
import { productsApi, servicesApi } from '@/lib/api'
import { toast } from 'sonner'
import type { ServiceProduct, WebService } from '@/types'

export function ProductInventory() {
  const [products, setProducts] = useState<ServiceProduct[]>([])
  const [services, setServices] = useState<WebService[]>([])
  const [loading, setLoading] = useState(true)
  const [filterServiceId, setFilterServiceId] = useState<string>('all')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ServiceProduct | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    serviceId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [filterServiceId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, servicesData] = await Promise.all([
        productsApi.getProducts(),
        servicesApi.getServices(),
      ])
      setProducts(productsData)
      setServices(servicesData)
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const serviceId = filterServiceId === 'all' ? undefined : filterServiceId
      const data = await productsApi.getProducts(serviceId)
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
      console.error(error)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({ name: '', serviceId: '' })
    setIsPanelOpen(true)
  }

  const handleEditProduct = (product: ServiceProduct) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      serviceId: product.serviceId,
    })
    setIsPanelOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure? Deleting this product will also delete its billing record in the Payment Register.')) {
      return
    }

    try {
      await productsApi.deleteProduct(productId)
      toast.success('Product deleted successfully')
      await loadProducts()
    } catch (error) {
      toast.error('Failed to delete product')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }

    if (!formData.serviceId) {
      toast.error('Service is required')
      return
    }

    try {
      setSubmitting(true)
      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, {
          name: formData.name,
          serviceId: formData.serviceId,
        })
        toast.success('Product updated successfully')
      } else {
        await productsApi.createProduct({
          name: formData.name,
          serviceId: formData.serviceId,
        })
        toast.success('Product created successfully (billing record auto-created)')
      }
      setIsPanelOpen(false)
      await loadProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = filterServiceId === 'all'
    ? products
    : products.filter(p => p.serviceId === filterServiceId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground">
            Manage products and their service associations
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 max-w-xs">
              <Select value={filterServiceId} onValueChange={setFilterServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {filterServiceId === 'all' ? 'No products yet' : 'No products in this service'}
              </p>
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.serviceName || services.find(s => s.id === product.serviceId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Panel */}
      <EditPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        description={editingProduct ? 'Update product details' : 'Create a new product and auto-create its billing record'}
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitLabel={editingProduct ? 'Update Product' : 'Create Product'}
      >
        <div className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name (must be unique)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Product name must be unique across all services
            </p>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="product-service">Service *</Label>
            <Select
              value={formData.serviceId}
              onValueChange={value => setFormData(prev => ({ ...prev, serviceId: value }))}
            >
              <SelectTrigger id="product-service">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The service this product belongs to
            </p>
          </div>
        </div>
      </EditPanel>
    </div>
  )
}
