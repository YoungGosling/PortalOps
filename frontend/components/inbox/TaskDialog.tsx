'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { workflowApi } from '@/lib/api'
import { WorkflowTask, User } from '@/types'
import { toast } from 'sonner'
import { Loader2, UserPlus, UserX } from 'lucide-react'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: WorkflowTask | null
  onSuccess: () => void
}

export function TaskDialog({ open, onOpenChange, task, onSuccess }: TaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)

  if (!task) return null

  const handleStartOnboarding = () => {
    // Open the user form with pre-filled data
    setShowUserForm(true)
  }

  const handleStartOffboarding = async () => {
    // For offboarding, we need to confirm and complete immediately
    try {
      setLoading(true)
      await workflowApi.completeTask(task.id, {})
      toast.success('Offboarding task completed successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to complete offboarding:', error)
      toast.error(error.message || 'Failed to complete offboarding')
    } finally {
      setLoading(false)
    }
  }

  const handleUserFormSuccess = async () => {
    setShowUserForm(false)
    onSuccess()
    onOpenChange(false)
  }

  // Convert task to User format for the form
  const taskAsUser: User = {
    id: task.userId || '',
    name: task.employeeName,
    email: task.employeeEmail,
    department: task.employeeDepartment,
    isActive: true,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignedServiceIds: task.assignedServices || [],
  }

  return (
    <>
      <Dialog open={open && !showUserForm} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {task.type === 'onboarding' ? (
                <UserPlus className="h-5 w-5 text-blue-600" />
              ) : (
                <UserX className="h-5 w-5 text-orange-600" />
              )}
              {task.type === 'onboarding' ? 'Onboarding Task' : 'Offboarding Task'}
            </DialogTitle>
            <DialogDescription>
              {task.type === 'onboarding'
                ? 'Complete the user setup by assigning services and products'
                : 'Review user details before completing offboarding'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status Badge */}
            <div>
              <Badge
                variant={task.status === 'pending' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {task.status}
              </Badge>
            </div>

            {/* User Information (Read-only) */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold text-sm">Employee Information</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{task.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{task.employeeEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{task.employeeDepartment}</span>
                </div>
              </div>
            </div>

            {/* For offboarding, show assigned services */}
            {task.type === 'offboarding' && task.assignedServices && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold text-sm">Assigned Services (Read-only)</h4>
                {task.assignedServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.assignedServices.map((serviceId) => (
                      <Badge key={serviceId} variant="secondary">
                        {serviceId}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-muted-foreground border-l-2 border-primary pl-4">
              {task.type === 'onboarding' ? (
                <p>
                  Click "Start Task" to open the user creation form. You must assign at least one
                  service or product to complete the onboarding.
                </p>
              ) : (
                <p>
                  Completing this task will delete the user from the system and remove all their
                  service and product assignments. This action cannot be undone.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {task.type === 'onboarding' ? (
              <Button onClick={handleStartOnboarding} disabled={loading}>
                Start Task
              </Button>
            ) : (
              <Button
                onClick={handleStartOffboarding}
                disabled={loading}
                variant="destructive"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Offboarding
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Form for Onboarding */}
      {task.type === 'onboarding' && (
        <UserFormDialog
          open={showUserForm}
          onOpenChange={setShowUserForm}
          user={null}
          onSuccess={handleUserFormSuccess}
        />
      )}

      {/* User Form for Offboarding (Read-only) */}
      {task.type === 'offboarding' && task.userId && (
        <UserFormDialog
          open={showUserForm}
          onOpenChange={setShowUserForm}
          user={taskAsUser}
          onSuccess={handleUserFormSuccess}
          readOnly={true}
        />
      )}
    </>
  )
}

