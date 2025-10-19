'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Filter, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { usersApi, servicesApi, productsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { User, WebService, ServiceProduct } from '@/types'

export function UserDirectory() {
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<WebService[]>([])
  const [products, setProducts] = useState<ServiceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProductId, setFilterProductId] = useState<string>('all')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: '' as '' | 'Admin' | 'ServiceAdmin',
    selectedServices: [] as string[],
    selectedProducts: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [filterProductId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, servicesData, productsData] = await Promise.all([
        usersApi.getUsers(),
        servicesApi.getServices(),
        productsApi.getProducts(),
      ])
      setUsers(usersData.data || usersData)
      setServices(servicesData)
      setProducts(productsData)
    } catch (error) {
      toast.error('Failed to load data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const productId = filterProductId === 'all' ? undefined : filterProductId
      const data = await usersApi.getUsers({ productId })
      setUsers(data.data || data)
    } catch (error) {
      toast.error('Failed to load users')
      console.error(error)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setIsReadOnly(false)
    setFormData({
      name: '',
      email: '',
      department: '',
      role: '',
      selectedServices: [],
      selectedProducts: [],
    })
    setIsPanelOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsReadOnly(false)
    setFormData({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role || '',
      selectedServices: user.assignedServices || [],
      selectedProducts: user.assignedProducts || [],
    })
    setIsPanelOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? Deleting this user will remove all associated service and product assignments.')) {
      return
    }

    try {
      await usersApi.deleteUser(userId)
      toast.success('User deleted successfully')
      await loadUsers()
    } catch (error) {
      toast.error('Failed to delete user')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!formData.department.trim()) {
      toast.error('Department is required')
      return
    }

    // Must assign at least one service or product
    if (formData.selectedServices.length === 0 && formData.selectedProducts.length === 0) {
      toast.error('Please assign at least one service or product')
      return
    }

    try {
      setSubmitting(true)
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          role: formData.role || undefined,
          assignedServices: formData.selectedServices,
          assignedProducts: formData.selectedProducts,
        })
        toast.success('User updated successfully')
      } else {
        await usersApi.createUser({
          name: formData.name,
          email: formData.email,
          department: formData.department,
          role: formData.role || undefined,
          assignedServices: formData.selectedServices,
          assignedProducts: formData.selectedProducts,
        })
        toast.success('User created successfully')
      }
      setIsPanelOpen(false)
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user')
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

  const filteredUsers = filterProductId === 'all'
    ? users
    : users.filter(u => u.assignedProducts?.includes(filterProductId))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground">
            Manage users and their service/product access
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 max-w-xs">
              <Select value={filterProductId} onValueChange={setFilterProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {filterProductId === 'all' ? 'No users yet' : 'No users assigned to this product'}
              </p>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Services</TableHead>
                  <TableHead>Assigned Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.assignedServices && user.assignedServices.length > 0 ? (
                          user.assignedServices.map(serviceId => {
                            const service = services.find(s => s.id === serviceId)
                            return service ? (
                              <Badge key={serviceId} variant="outline">
                                {service.name}
                              </Badge>
                            ) : null
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.assignedProducts && user.assignedProducts.length > 0 ? (
                          user.assignedProducts.map(productId => {
                            const product = products.find(p => p.id === productId)
                            return product ? (
                              <Badge key={productId} variant="outline">
                                {product.name}
                              </Badge>
                            ) : null
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
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
        title={editingUser ? 'Edit User' : 'Add User'}
        description={editingUser ? 'Update user details and assignments' : 'Create a new user with service/product access'}
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitLabel={editingUser ? 'Update User' : 'Create User'}
      >
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="user-name">Name *</Label>
            <Input
              id="user-name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
              disabled={isReadOnly}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="user-email">Email *</Label>
            <Input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
              disabled={isReadOnly}
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="user-department">Department *</Label>
            <Input
              id="user-department"
              value={formData.department}
              onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder="Enter department"
              required
              disabled={isReadOnly}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="user-role">Role (Optional)</Label>
            <Select
              value={formData.role}
              onValueChange={value => setFormData(prev => ({ ...prev, role: value as any }))}
              disabled={isReadOnly}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Role</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="ServiceAdmin">Service Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins have full system access, ServiceAdmins can manage assigned services
            </p>
          </div>

          {/* Assigned Services */}
          <div className="space-y-2">
            <Label>Assigned Services *</Label>
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
                      disabled={isReadOnly}
                    />
                    <label
                      htmlFor={`service-${service.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Products */}
          <div className="space-y-2">
            <Label>Assigned Products *</Label>
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
                      disabled={isReadOnly}
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

          <p className="text-xs text-muted-foreground pt-2 border-t">
            * At least one service or product must be assigned
          </p>
        </div>
      </EditPanel>
    </div>
  )
}
