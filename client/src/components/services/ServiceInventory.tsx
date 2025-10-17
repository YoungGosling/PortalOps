import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Building,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { mockServices } from '../../data/mockData'
import { WebService } from '../../types'
import { formatDate } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { servicesApi } from '../../lib/api'

interface ServiceCardProps {
  service: WebService
  onEdit: (service: WebService) => void
  onDelete: (serviceId: string) => void
}

function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <CardDescription>{service.vendor}</CardDescription>
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
                    onEdit(service)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Service</span>
                </button>
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Service</span>
                </a>
                <button
                  onClick={() => {
                    onDelete(service.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Service</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {service.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{service.products.length} Products</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Renews {formatDate(service.paymentInfo.nextRenewalDate)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">
              ${service.paymentInfo.amount}/{service.paymentInfo.renewalFrequency}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Products/Modules
          </div>
          <div className="flex flex-wrap gap-1">
            {service.products.slice(0, 3).map((product) => (
              <span
                key={product.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {product.name}
              </span>
            ))}
            {service.products.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                +{service.products.length - 3} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ServiceInventory() {
  const { canAddService, getAccessibleServices } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [, setShowAddForm] = useState(false)
  const [services, setServices] = useState<WebService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Try to load from API first
        const apiServices = await servicesApi.getServices()
        
        // Convert API response to WebService format
        const convertedServices: WebService[] = apiServices.map((apiService: any) => ({
          id: apiService.id,
          name: apiService.name,
          vendor: apiService.vendor || 'Unknown',
          url: apiService.url || '',
          description: apiService.description || '',
          products: apiService.products || [],
          paymentInfo: {
            id: `p${apiService.id}`,
            serviceId: apiService.id,
            cardholder: 'Company Finance',
            renewalFrequency: 'monthly',
            nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 0,
            currency: 'USD',
            isActive: true,
          },
          administrators: [],
          isActive: true,
          createdAt: apiService.created_at || new Date().toISOString(),
          updatedAt: apiService.updated_at || new Date().toISOString(),
        }))
        
        // Filter services based on user permissions
        const accessibleServiceIds = getAccessibleServices()
        const userServices = accessibleServiceIds.length === 0 
          ? convertedServices // Admin sees all services
          : convertedServices.filter(service => accessibleServiceIds.includes(service.id))
        
        setServices(userServices)
        console.log('✅ Services loaded from API:', userServices.length)
      } catch (err) {
        console.error('❌ Failed to load services from API:', err)
        setError('API connection failed. Using mock data for demonstration.')
        
        // Fallback to mock data
        const accessibleServiceIds = getAccessibleServices()
        const userServices = accessibleServiceIds.length === 0 
          ? mockServices // Admin sees all services
          : mockServices.filter(service => accessibleServiceIds.includes(service.id))
        
        setServices(userServices)
        console.log('📋 Using mock data:', userServices.length, 'services')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [getAccessibleServices])

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (service: WebService) => {
    console.log('Edit service:', service)
    // TODO: Implement edit functionality
  }

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await servicesApi.deleteService(serviceId)
        setServices(services.filter(s => s.id !== serviceId))
        console.log('✅ Service deleted successfully')
      } catch (err) {
        console.error('❌ Failed to delete service:', err)
        alert('Failed to delete service. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Inventory</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your web services and their configurations
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading services...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your web services and their configurations
          </p>
          {error && (
            <p className="text-yellow-600 text-sm mt-1">
              ⚠️ {error}
            </p>
          )}
        </div>
        {canAddService() && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{services.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {services.reduce((acc, service) => acc + service.products.length, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  ${services.reduce((acc, service) => acc + service.paymentInfo.amount, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {services.filter(s => {
                    const renewalDate = new Date(s.paymentInfo.nextRenewalDate)
                    const thirtyDaysFromNow = new Date()
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                    return renewalDate <= thirtyDaysFromNow
                  }).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Due Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="secondary">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No services found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first service.'}
          </p>
          {!searchTerm && canAddService() && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
