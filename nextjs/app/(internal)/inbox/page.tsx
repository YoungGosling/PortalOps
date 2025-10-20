'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { WorkflowTask, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { Inbox as InboxIcon, CheckCircle2, Clock, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function InboxPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTasks();
      // Sort: incomplete tasks first (pending status)
      const sorted = data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTasks(sorted);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle start task - opens the appropriate dialog based on task type
  const handleStartTask = async (task: WorkflowTask) => {
    setCurrentTask(task);
    
    if (task.type === 'onboarding') {
      // Onboarding: User doesn't exist yet - create a temporary user object
      // with data from the task for display in the form
      const tempUser: User = {
        id: '', // No ID yet - user will be created
        name: task.employee_name,
        email: task.employee_email,
        department: task.employee_department,
        roles: [],
        assignedProductIds: []
      };
      
      setEditingUser(tempUser);
      setDialogOpen(true);
    } else if (task.type === 'offboarding') {
      // Offboarding: User exists - fetch their current data
      try {
        const users = await apiClient.getUsers();
        const user = users.find(u => u.email === task.employee_email);
        
        if (!user) {
          toast.error('User not found in directory');
          return;
        }
        
        setEditingUser(user);
        setDialogOpen(true);
      } catch (error) {
        toast.error('Failed to load user information');
        console.error(error);
      }
    }
  };

  // Handle task completion after user is created/deleted
  const handleTaskComplete = async () => {
    if (!currentTask) return;

    try {
      // Complete the task on backend
      await apiClient.completeTask(currentTask.id);
      
      // Refresh task list
      await fetchTasks();
      
      // Close dialog and reset state
      setDialogOpen(false);
      setCurrentTask(null);
      setEditingUser(null);
      
      toast.success(
        `${currentTask.type === 'onboarding' ? 'Onboarding' : 'Offboarding'} completed successfully`
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
      console.error('Error completing task:', error);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Manage onboarding and offboarding workflow tasks
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              Only administrators can access the inbox
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">
          Manage onboarding and offboarding workflow tasks
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded mb-3" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <InboxIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Workflow tasks will appear here when triggered by the HR system.
              Onboarding and offboarding requests will be listed for your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {tasks.map((task) => {
                const isOnboarding = task.type === 'onboarding';
                const isPending = task.status === 'pending';
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-5 transition-colors ${
                      isPending ? 'bg-accent/20 hover:bg-accent/30' : 'hover:bg-accent/10'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isPending ? (
                        <div className="relative">
                          <Clock className="h-6 w-6 text-orange-500" />
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        </div>
                      ) : (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                    </div>

                    {/* Task Type Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isOnboarding ? (
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                          <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{task.employee_name}</h3>
                        <Badge 
                          variant={isOnboarding ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {task.type}
                        </Badge>
                        {isPending && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Email:</span> {task.employee_email}
                        </p>
                        {task.employee_department && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Department:</span> {task.employee_department}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          Created: {new Date(task.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {task.status === 'completed' && (
                          <span className="text-green-600 dark:text-green-400">
                            ✓ Completed: {new Date(task.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {isPending && (
                        <Button 
                          onClick={() => handleStartTask(task)}
                          size="lg"
                          className="min-w-[120px]"
                        >
                          Start Task
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Form Dialog for Onboarding/Offboarding */}
      {currentTask && (
        <UserFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setCurrentTask(null);
              setEditingUser(null);
            }
          }}
          user={editingUser}
          onSuccess={handleTaskComplete}
          workflowMode={currentTask.type}
        />
      )}
    </div>
  );
}
