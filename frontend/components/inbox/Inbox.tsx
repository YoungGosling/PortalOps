'use client'

import React, { useState, useEffect } from 'react'
import { UserPlus, UserMinus, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { EditPanel } from '@/components/shared/EditPanel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { workflowApi, servicesApi, productsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { WorkflowTask, WebService, ServiceProduct } from '@/types'

export function Inbox() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [services, setServices] = useState<WebService[]>([])
  const [products, setProducts] = useState<ServiceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    selectedServices: [] as string[],
    selectedProducts: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, servicesData, productsData] = await Promise.all([
        workflowApi.getTasks(),
        servicesApi.getServices(),
        productsApi.getProducts(),
      ])
      // Sort: pending tasks first, then completed tasks
      const sorted = tasksData.sort((a, b) => {
        if (a.status === b.status) return 0
        return a.status === 'pending' ? -1 : 1
      })
      setTasks(sorted)
      setServices(servicesData)
      setProducts(productsData)
    } catch (error) {
      toast.error('Failed to load tasks')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTask = (task: WorkflowTask) => {
    setCurrentTask(task)
    
    if (task.type === 'onboarding') {
      // Pre-fill form with HR data (read-only)
      setFormData({
        name: task.employeeName,
        email: task.employeeEmail,
        department: task.employeeDepartment,
        selectedServices: [],
        selectedProducts: [],
      })
    } else if (task.type === 'offboarding') {
      // Pre-fill form with user data (all read-only)
      setFormData({
        name: task.employeeName,
        email: task.employeeEmail,
        department: task.employeeDepartment,
        selectedServices: task.assignedServices || [],
        selectedProducts: task.assignedProducts || [],
      })
    }
    
    setIsPanelOpen(true)
  }

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentTask) return

    // Must assign at least one service or product
    if (formData.selectedServices.length === 0 && formData.selectedProducts.length === 0) {
      toast.error('Please assign at least one service or product to the new user')
      return
    }

    try {
      setSubmitting(true)
      await workflowApi.completeOnboarding(currentTask.id, {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        assignedServices: formData.selectedServices,
        assignedProducts: formData.selectedProducts,
      })
      toast.success('Onboarding completed! User created successfully.')
      setIsPanelOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete onboarding')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOffboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentTask) return

    if (!confirm('Are you sure you want to offboard this user? This will delete the user and remove all their access.')) {
      return
    }

    try {
      setSubmitting(true)
      await workflowApi.completeOffboarding(currentTask.id)
      toast.success('Offboarding completed! User deleted and access revoked.')
      setIsPanelOpen(false)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete offboarding')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleServiceSelection = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }))
  }

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId],
    }))
  }

  const isOnboarding = currentTask?.type === 'onboarding'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">
          Manage onboarding and offboarding workflow tasks
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Escalated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks
            .filter(task => {
              if (statusFilter !== 'all' && task.status !== statusFilter) return false
              if (searchQuery && !task.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) return false
              return true
            })
            .map(task => (
            <Card key={task.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${task.type === 'onboarding' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      {task.type === 'onboarding' ? (
                        <UserPlus className="h-5 w-5 text-green-600" />
                      ) : (
                        <UserMinus className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {task.type === 'onboarding' ? 'New User:' : 'User:'}
                        </span>
                        <span className="font-semibold">{task.employeeName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Due: No due date</span>
                      </div>
                    </div>
                    {task.status === 'pending' ? (
                      <>
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500">
                          pending
                        </Badge>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </>
                    ) : (
                      <>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500">
                          completed
                        </Badge>
                        <AlertCircle className="h-4 w-4 text-green-600" />
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Service Details:</span>
                    <div className="text-muted-foreground">-</div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Assigned to:</span>
                    <div className="text-muted-foreground">Unassigned</div>
                  </div>
                  {task.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleStartTask(task)}>
                        Start Task
                      </Button>
                      <Button variant="ghost" className="flex items-center gap-1">
                        <span>💬</span> Comments (0)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Panel (Onboarding or Offboarding) */}
      <EditPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={isOnboarding ? 'Complete Onboarding' : 'Complete Offboarding'}
        description={
          isOnboarding
            ? 'Assign services and products to the new employee'
            : 'Review user assignments before offboarding'
        }
        onSubmit={isOnboarding ? handleOnboardingSubmit : handleOffboardingSubmit}
        isLoading={submitting}
        submitLabel={isOnboarding ? 'Create User & Complete' : 'Delete User & Complete'}
      >
        <div className="space-y-4">
          {/* Employee Info (Read-only) */}
          <div className="bg-accent/50 rounded-md p-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Employee Information (From HR System)</p>
            <div className="space-y-2">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} disabled className="bg-background" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formData.email} disabled className="bg-background" />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={formData.department} disabled className="bg-background" />
              </div>
            </div>
          </div>

          {isOnboarding ? (
            <>
              {/* Onboarding: Assign Services */}
              <div className="space-y-2">
                <Label>Assign Services *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Users assigned to a service have access to all products under that service
                </p>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No services available
                  </p>
                ) : (
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={formData.selectedServices.includes(service.id)}
                          onCheckedChange={() => toggleServiceSelection(service.id)}
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Onboarding: Assign Products */}
              <div className="space-y-2">
                <Label>Assign Products *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Or assign specific products
                </p>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No products available
                  </p>
                ) : (
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={formData.selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  At least one service or product must be assigned before submission
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Offboarding: Show current assignments (Read-only) */}
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-md p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                      Warning: This action cannot be undone
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Completing this offboarding will permanently delete the user and remove all access to the following services and products.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Current Assigned Services</Label>
                  <div className="border rounded-md p-4">
                    {formData.selectedServices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No services assigned</p>
                    ) : (
                      <div className="space-y-1">
                        {formData.selectedServices.map(serviceId => {
                          const service = services.find(s => s.id === serviceId)
                          return service ? (
                            <div key={serviceId} className="text-sm">• {service.name}</div>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Assigned Products</Label>
                  <div className="border rounded-md p-4">
                    {formData.selectedProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products assigned</p>
                    ) : (
                      <div className="space-y-1">
                        {formData.selectedProducts.map(productId => {
                          const product = products.find(p => p.id === productId)
                          return product ? (
                            <div key={productId} className="text-sm">• {product.name}</div>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </EditPanel>
    </div>
  )
}
