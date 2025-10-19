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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usersApi, servicesApi } from '@/lib/api'
import { User, WebService } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum(['Admin', 'ServiceAdmin']).optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
  readOnly?: boolean
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  readOnly = false,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<WebService[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
      })
      setSelectedRole(user.role || '')
      setSelectedServiceIds(user.assignedServiceIds || [])
    } else {
      reset({
        name: '',
        email: '',
        department: '',
        role: undefined,
      })
      setSelectedRole('')
      setSelectedServiceIds([])
    }
  }, [user, reset])

  const loadServices = async () => {
    try {
      const data = await servicesApi.getServices()
      setServices(data)
    } catch (error) {
      console.error('Failed to load services:', error)
    }
  }

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setValue('role', value as any)
  }

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true)

      const userData = {
        name: data.name,
        email: data.email,
        department: data.department,
        role: selectedRole as 'Admin' | 'ServiceAdmin' | undefined,
        assignedServiceIds: selectedRole === 'ServiceAdmin' ? selectedServiceIds : [],
      }

      if (user) {
        // Update existing user
        await usersApi.updateUser(user.id, userData)
        toast.success('User updated successfully')
      } else {
        // Create new user
        await usersApi.createUser(userData)
        toast.success('User created successfully')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to save user:', error)
      toast.error(error.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{user ? (readOnly ? 'User Details' : 'Edit User') : 'Add User'}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'View user details and assignments'
              : user
              ? 'Update user information and manage service assignments'
              : 'Create a new user account and assign services'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  disabled={readOnly}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register('email')}
                  disabled={readOnly}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="department"
                  placeholder="Engineering"
                  {...register('department')}
                  disabled={readOnly}
                />
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message}</p>
                )}
              </div>

              <Separator />

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role (Optional)</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange} disabled={readOnly}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Role</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="ServiceAdmin">Service Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Assignments (for ServiceAdmin only) */}
              {selectedRole === 'ServiceAdmin' && (
                <div className="space-y-2">
                  <Label>Assigned Services</Label>
                  <p className="text-sm text-muted-foreground">
                    Select services this user can manage
                  </p>
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services available</p>
                  ) : (
                    <div className="space-y-2 border rounded-md p-4">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={selectedServiceIds.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            disabled={readOnly}
                          />
                          <label
                            htmlFor={`service-${service.id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {service.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {!readOnly && (
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
                {user ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

