import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Package, 
  ExternalLink,
  Building,
  Calendar,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { servicesApi, productsApi } from '../../lib/api'

interface Product {
  id: string
  name: string
  url?: string
  serviceId: string
  serviceName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  name: string
  vendor: string
}

interface AddProductFormProps {
  services: Service[]
  onAdd: (productData: { name: string; url?: string; serviceId: string }) => void
  onCancel: () => void
}

function AddProductForm({ services, onAdd, onCancel }: AddProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    serviceId: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.serviceId) {
      return
    }

    onAdd({
      name: formData.name,
      url: formData.url || undefined,
      serviceId: formData.serviceId,
    })
    
    // Reset form
    setFormData({
      name: '',
      url: '',
      serviceId: '',
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Create a new product and automatically add it to the Payment Register</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/product"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service *</label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.vendor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="submit">Add Product</Button>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>{product.serviceName}</CardDescription>
            </div>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    onEdit(product)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Product</span>
                </button>
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open Product</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    onDelete(product.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Product</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.url && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <a 
              href={product.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 hover:underline"
            >
              {product.url}
            </a>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductInventory() {
  const { hasAnyRole } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products and services from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load services and products in parallel
        const [servicesData, productsData] = await Promise.all([
          servicesApi.getServices(),
          productsApi.getProducts()
        ])
        
        setServices(servicesData.map((service: any) => ({
          id: service.id,
          name: service.name,
          vendor: service.vendor || 'Unknown'
        })))
        
        // Transform products data to match our interface
        setProducts(productsData.map((product: any) => ({
          id: product.id,
          name: product.name,
          url: product.url,
          serviceId: product.service_id,
          serviceName: servicesData.find((s: any) => s.id === product.service_id)?.name || 'Unknown Service',
          isActive: true, // Assume all products are active for now
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        })))
        
        console.log('✅ Product inventory data loaded')
      } catch (err) {
        console.error('❌ Failed to load product inventory data:', err)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Access control - only Admin and ServiceAdministrator can access
  if (!hasAnyRole(['Admin', 'ServiceAdministrator'])) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access the Product Inventory.
        </p>
      </div>
    )
  }

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddProduct = async (productData: { name: string; url?: string; serviceId: string }) => {
    try {
      console.log('Creating product:', productData)
      
      // Call the backend API to create the product
      const createdProduct = await productsApi.createProduct(productData)
      
      // Transform the response to match our interface
      const service = services.find(s => s.id === productData.serviceId)
      const newProduct: Product = {
        id: createdProduct.id,
        name: createdProduct.name,
        url: createdProduct.url,
        serviceId: createdProduct.service_id,
        serviceName: service?.name || 'Unknown Service',
        isActive: true,
        createdAt: createdProduct.created_at,
        updatedAt: createdProduct.updated_at,
      }
      
      // Add to local state
      setProducts(prev => [newProduct, ...prev])
      setShowAddForm(false)
      
      console.log('✅ Product created successfully. Billing record created automatically in Payment Register.')
    } catch (err) {
      console.error('❌ Failed to create product:', err)
      setError('Failed to create product. Please try again.')
    }
  }

  const handleEdit = (product: Product) => {
    console.log('Edit product:', product)
    // TODO: Implement edit functionality
  }

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This will also remove its billing information.')) {
      try {
        // Call API to delete product
        await productsApi.deleteProduct(productId)
        
        // Remove from local state
        setProducts(products.filter(p => p.id !== productId))
        console.log('✅ Product deleted successfully')
      } catch (err) {
        console.error('❌ Failed to delete product:', err)
        setError('Failed to delete product. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage products across all services
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading products...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage products across all services
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-1">
              ⚠️ {error}
            </p>
          )}
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{services.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.isActive).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <AddProductForm
          services={services}
          onAdd={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first product.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
