'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { WorkflowTask } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkflowChecklistDialog } from '@/components/workflows/WorkflowChecklistDialog';
import { 
  Inbox as InboxIcon, 
  Clock, 
  UserPlus, 
  UserMinus, 
  Eye, 
  Trash2, 
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function InboxPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<WorkflowTask | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pageSize] = useState(20);

  const fetchTasks = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await apiClient.getTasks(page, pageSize);
      setTasks(response.data);
      setCurrentPage(response.pagination.page);
      setTotalTasks(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin() && !dataLoaded) {
      fetchTasks();
      setDataLoaded(true);
    } else if (!isAdmin()) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchTasks(page);
  };

  const handleRefresh = () => {
    fetchTasks(currentPage);
  };

  const handleStartTask = (task: WorkflowTask) => {
    setCurrentTask(task);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handlePreviewTask = (task: WorkflowTask) => {
    setCurrentTask(task);
    setIsReadOnly(true);
    setDialogOpen(true);
  };

  const handleDeleteClick = (task: WorkflowTask) => {
    setDeletingTask(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    
    try {
      await apiClient.deleteTask(deletingTask.id);
      toast.success('Task deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingTask(null);
      fetchTasks(currentPage);
    } catch (error) {
      toast.error('Failed to delete task');
      console.error(error);
    }
  };

  const handleTaskComplete = async () => {
    await fetchTasks(currentPage);
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-0.5">
            {totalTasks > 0 ? `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} in inbox` : 'No tasks in inbox'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="default" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-0 shadow-sm">
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
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[200px]">Employee Name</TableHead>
                      <TableHead className="w-[220px]">Email</TableHead>
                      <TableHead className="w-[150px]">Department</TableHead>
                      <TableHead className="w-[150px]">Created Date</TableHead>
                      <TableHead className="text-right w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      const isOnboarding = task.type === 'onboarding';
                      const isPending = task.status === 'pending';
                      const isCompleted = task.status === 'completed';
                      
                      return (
                        <TableRow
                          key={task.id}
                          className={isPending ? 'bg-accent/20' : ''}
                        >
                          {/* Status Column */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isPending ? (
                                <>
                                  <Clock className="h-4 w-4 text-orange-500" />
                                  <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                                    Action Required
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    Complete
                                  </Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Type Column */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isOnboarding ? (
                                <>
                                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                                    <UserPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-sm font-medium">Onboarding</span>
                                </>
                              ) : (
                                <>
                                  <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/20">
                                    <UserMinus className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                  </div>
                                  <span className="text-sm font-medium">Offboarding</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Employee Name */}
                          <TableCell>
                            <span className="font-medium">{task.employee_name}</span>
                          </TableCell>
                          
                          {/* Email */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{task.employee_email}</span>
                          </TableCell>
                          
                          {/* Department */}
                          <TableCell>
                            <span className="text-sm">{task.employee_department || 'N/A'}</span>
                          </TableCell>
                          
                          {/* Created Date */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(task.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="text-right">
                            {isPending ? (
                              <Button
                                onClick={() => handleStartTask(task)}
                                size="sm"
                                className="min-w-[100px]"
                              >
                                Start Task
                              </Button>
                            ) : isCompleted ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreviewTask(task)}
                                  className="h-8 w-8 p-0"
                                  title="Preview"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(task)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalTasks)} of {totalTasks} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Workflow Checklist Dialog */}
      <WorkflowChecklistDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setCurrentTask(null);
            setIsReadOnly(false);
          }
        }}
        task={currentTask}
        onSuccess={handleTaskComplete}
        readOnly={isReadOnly}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this completed task for{' '}
              <span className="font-semibold">{deletingTask?.employee_name}</span>?
              This action cannot be undone and will remove the task and its attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
