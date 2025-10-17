import React, { useState } from 'react'
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  X,
  Check,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { mockUsers, mockServices } from '../../data/mockData'
import { User } from '../../types'

interface PermissionAssignmentProps {
  user: User
  onAssignServiceAdmin: (userId: string, serviceId: string) => void
  onAssignProductAdmin: (userId: string, serviceId: string, productId: string) => void
  onRevokeServiceAdmin: (userId: string, serviceId: string) => void
  onRevokeProductAdmin: (userId: string, serviceId: string, productId: string) => void
}

function PermissionAssignment({ 
  user, 
  onAssignServiceAdmin, 
  onAssignProductAdmin,
  onRevokeServiceAdmin,
  onRevokeProductAdmin
}: PermissionAssignmentProps) {
  const { canAssignServiceAdmin, canAssignProductAdmin, getAccessibleServices } = useAuth()
  const [selectedService, setSelectedService] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')

  const accessibleServices = getAccessibleServices()
  const availableServices = accessibleServices.length === 0 
    ? mockServices 
    : mockServices.filter(s => accessibleServices.includes(s.id))

  const handleAssignServiceAdmin = () => {
    if (selectedService) {
      onAssignServiceAdmin(user.id, selectedService)
      setSelectedService('')
    }
  }

  const handleAssignProductAdmin = () => {
    if (selectedService && selectedProduct) {
      onAssignProductAdmin(user.id, selectedService, selectedProduct)
      setSelectedService('')
      setSelectedProduct('')
    }
  }

  const getUserServicePermissions = () => {
    return user.servicePermissions?.filter(sp => sp.isActive) || []
  }

  const getUserProductPermissions = () => {
    return user.productPermissions?.filter(pp => pp.isActive) || []
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Permissions for {user.firstName} {user.lastName}</span>
        </CardTitle>
        <CardDescription>
          Manage service and product administrator permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role */}
        <div>
          <h4 className="font-medium mb-2">Current Role</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.roles.includes('Admin') 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : user.roles.includes('ServiceAdministrator')
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                : user.roles.includes('ProductAdministrator')
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {user.roles[0]?.replace('_', ' ').toUpperCase() || 'USER'}
            </span>
            <span className={`text-sm ${user.canLogin ? 'text-green-600' : 'text-red-600'}`}>
              {user.canLogin ? 'Can Login' : 'Cannot Login'}
            </span>
          </div>
        </div>

        {/* Service Admin Permissions */}
        {canAssignServiceAdmin() && (
          <div>
            <h4 className="font-medium mb-2">Service Administrator Permissions</h4>
            <div className="space-y-2">
              {getUserServicePermissions().map((permission) => {
                const service = mockServices.find(s => s.id === permission.serviceId)
                return (
                  <div key={permission.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">{service?.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRevokeServiceAdmin(user.id, permission.serviceId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
              
              <div className="flex space-x-2">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Select Service</option>
                  {availableServices
                    .filter(s => !getUserServicePermissions().some(sp => sp.serviceId === s.id))
                    .map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))
                  }
                </select>
                <Button
                  size="sm"
                  onClick={handleAssignServiceAdmin}
                  disabled={!selectedService}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Assign
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Admin Permissions */}
        {(canAssignServiceAdmin() || canAssignProductAdmin()) && (
          <div>
            <h4 className="font-medium mb-2">Product Administrator Permissions</h4>
            <div className="space-y-2">
              {getUserProductPermissions().map((permission) => {
                const service = mockServices.find(s => s.id === permission.serviceId)
                const product = service?.products.find(p => p.id === permission.productId)
                return (
                  <div key={permission.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm">{service?.name} - {product?.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRevokeProductAdmin(user.id, permission.serviceId, permission.productId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
              
              <div className="space-y-2">
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value)
                    setSelectedProduct('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Select Service</option>
                  {availableServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                
                {selectedService && (
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Select Product</option>
                    {mockServices
                      .find(s => s.id === selectedService)
                      ?.products.filter(p => !getUserProductPermissions().some(pp => 
                        pp.serviceId === selectedService && pp.productId === p.id
                      ))
                      .map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))
                    }
                  </select>
                )}
                
                <Button
                  size="sm"
                  onClick={handleAssignProductAdmin}
                  disabled={!selectedService || !selectedProduct}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Assign Product Permission
                </Button>
              </div>
            </div>
          </div>
        )}

        {!canAssignServiceAdmin() && !canAssignProductAdmin() && (
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">You don't have permission to assign roles to this user.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PermissionManager() {
  const { user: currentUser, canAssignServiceAdmin, canAssignProductAdmin } = useAuth()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter users that can be managed by current user
  const manageableUsers = mockUsers.filter(user => {
    // Admin can manage everyone except themselves
    if (currentUser?.roles.includes('Admin')) {
      return user.id !== currentUser.id
    }
    
    // Service Admin can only assign product admin roles
    if (currentUser?.roles.includes('ServiceAdministrator')) {
      return !user.roles.includes('Admin') && !user.roles.includes('ServiceAdministrator')
    }
    
    return false
  })

  const filteredUsers = manageableUsers.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAssignServiceAdmin = (userId: string, serviceId: string) => {
    console.log('Assign Service Admin:', { userId, serviceId })
    // TODO: Implement actual permission assignment
  }

  const handleAssignProductAdmin = (userId: string, serviceId: string, productId: string) => {
    console.log('Assign Product Admin:', { userId, serviceId, productId })
    // TODO: Implement actual permission assignment
  }

  const handleRevokeServiceAdmin = (userId: string, serviceId: string) => {
    console.log('Revoke Service Admin:', { userId, serviceId })
    // TODO: Implement actual permission revocation
  }

  const handleRevokeProductAdmin = (userId: string, serviceId: string, productId: string) => {
    console.log('Revoke Product Admin:', { userId, serviceId, productId })
    // TODO: Implement actual permission revocation
  }

  if (!canAssignServiceAdmin() && !canAssignProductAdmin()) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage user roles and permissions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Assign and manage user roles and permissions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Select User</span>
            </CardTitle>
            <CardDescription>
              Choose a user to manage their permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.title} - {user.department}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.roles.includes('Admin') 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : user.roles.includes('ServiceAdministrator')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : user.roles.includes('ProductAdministrator')
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {user.roles[0]?.replace('_', ' ').toUpperCase() || 'USER'}
                      </span>
                      {selectedUser?.id === user.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permission Assignment */}
        {selectedUser ? (
          <PermissionAssignment
            user={selectedUser}
            onAssignServiceAdmin={handleAssignServiceAdmin}
            onAssignProductAdmin={handleAssignProductAdmin}
            onRevokeServiceAdmin={handleRevokeServiceAdmin}
            onRevokeProductAdmin={handleRevokeProductAdmin}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a User
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a user from the list to manage their permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

