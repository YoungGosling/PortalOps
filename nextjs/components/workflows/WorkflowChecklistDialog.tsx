'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchAddUserAction } from '@/api/users/add_user/action';
import { fetchQueryServicesAction } from '@/api/services/query_services/action';
import { queryProductsAction } from '@/api/products/query_products/action';
import { queryTaskAction } from '@/api/inbox/query_task/action';
import { uploadAttachmentAction } from '@/api/inbox/upload_attachment/action';
import { completeTaskAction } from '@/api/inbox/complete_task/action';
import { downloadAttachmentAction } from '@/api/inbox/download_attachment/action';
import type { WorkflowTask, ProductWithServiceAdmin, Service } from '@/types';
import { toast } from 'sonner';
import { Loader2, Printer, Upload, FileText, ListTodo, X, Download } from 'lucide-react';
import { PrintableChecklist } from './PrintableChecklist';
import { ServiceProductSelector } from '@/components/products/ServiceProductSelector';

interface WorkflowChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: WorkflowTask | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function WorkflowChecklistDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
  readOnly = false,
}: WorkflowChecklistDialogProps) {
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState<WorkflowTask | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProductIdsToRemove, setSelectedProductIdsToRemove] = useState<Set<string>>(new Set());
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const isOnboarding = task?.type === 'onboarding';
  const isOffboarding = task?.type === 'offboarding';
  // Check if user has selected a file OR if there's already an uploaded attachment
  const hasAttachment = !!attachmentFile || !!taskDetails?.attachment_path;

  // Fetch full task details when dialog opens
  useEffect(() => {
    if (open && task) {
      fetchTaskDetails();
      if (task.type === 'onboarding') {
        fetchServicesWithProducts();
      }
    } else {
      setTaskDetails(null);
      setSelectedProductIds([]);
      setSelectedProductIdsToRemove(new Set());
      setAttachmentFile(null);
      setShowProductSelector(false);
      setServices([]);
    }
  }, [open, task]);

  const fetchTaskDetails = async () => {
    if (!task) return;
    
    try {
      console.log('Fetching task details for task:', task.id);
      console.log('Task type:', task.type);
      
      const details = await queryTaskAction(task.id);
      console.log('Received task details:', details);
      console.log('Assigned products:', details.assigned_products);
      
      setTaskDetails(details);
      
      // Pre-select products for onboarding (department defaults)
      if (details.type === 'onboarding' && details.assigned_products) {
        console.log('Setting selected product IDs for onboarding:', details.assigned_products.map(p => p.product_id));
        setSelectedProductIds(details.assigned_products.map(p => p.product_id));
      }
      
      // For offboarding, initialize selectedProductIdsToRemove with all products (default: full removal)
      if (details.type === 'offboarding' && details.assigned_products) {
        console.log('Offboarding assigned products:', details.assigned_products);
        const allProductIds = details.assigned_products.map(p => p.product_id);
        setSelectedProductIdsToRemove(new Set(allProductIds));
      }
    } catch (error: any) {
      console.error('Failed to fetch task details:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // Show more specific error message
      const errorMessage = error?.message || 'Failed to load task details';
      toast.error(errorMessage);
      
      // Close the dialog on error
      onOpenChange(false);
    }
  };

  const fetchServicesWithProducts = async () => {
    setLoadingServices(true);
    try {
      // Fetch services
      const servicesResponse = await fetchQueryServicesAction(1, 100);
      
      // For each service, fetch its products
      const servicesWithProducts: Service[] = await Promise.all(
        servicesResponse.data.map(async (service) => {
          try {
            const productsResponse = await queryProductsAction(service.id, 1, 100);
            return {
              ...service,
              vendor: service.vendor ?? undefined,
              products: productsResponse.products,
              product_count: productsResponse.products.length,
            };
          } catch (error) {
            console.warn(`Failed to fetch products for service ${service.id}:`, error);
            return {
              ...service,
              vendor: service.vendor ?? undefined,
              products: [],
              product_count: 0,
            };
          }
        })
      );
      
      setServices(servicesWithProducts);
    } catch (error: any) {
      console.error('Failed to fetch services:', error);
      toast.error(error.message || 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    if (isOffboarding) return; // Read-only for offboarding
    
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Toggle product removal checkbox for offboarding
  const handleProductRemovalToggle = (productId: string) => {
    setSelectedProductIdsToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Toggle all products for removal (select all / deselect all)
  const handleToggleAllProductsRemoval = () => {
    if (!taskDetails?.assigned_products) return;
    
    const allProductIds = taskDetails.assigned_products.map(p => p.product_id);
    const allSelected = allProductIds.every(id => selectedProductIdsToRemove.has(id));
    
    if (allSelected) {
      // Deselect all
      setSelectedProductIdsToRemove(new Set());
    } else {
      // Select all
      setSelectedProductIdsToRemove(new Set(allProductIds));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.pptx', '.txt', '.csv', '.jpg', '.jpeg', '.png'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error(`File type not supported. Allowed formats: ${allowedExtensions.join(', ')}`);
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setAttachmentFile(file);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (taskDetails?.attachment_path) return; // Already uploaded
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.pptx', '.txt', '.csv', '.jpg', '.jpeg', '.png'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error(`File type not supported. Allowed formats: ${allowedExtensions.join(', ')}`);
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setAttachmentFile(file);
    }
  };

  const removeAttachmentFile = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAttachment = async () => {
    if (!taskDetails) return;
    
    try {
      const blob = await downloadAttachmentAction(taskDetails.id);
      
      // Use the original filename if available, otherwise generate one with proper extension
      const filename = taskDetails.attachment_original_name || `checklist_${taskDetails.employee_name}_${taskDetails.id}.pdf`;
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Attachment downloaded successfully');
    } catch (error) {
      toast.error('Failed to download attachment');
      console.error(error);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Use timeout to allow React to render the print component
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskDetails) return;
    
    // Validate attachment file is selected
    if (!attachmentFile && !taskDetails.attachment_path) {
      toast.error('Please select a completed checklist file before submitting');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Upload attachment file first (if new file selected)
      if (attachmentFile) {
        try {
          await uploadAttachmentAction(taskDetails.id, attachmentFile);
          console.log('Attachment uploaded successfully');
        } catch (uploadError: any) {
          throw new Error(`Failed to upload attachment: ${uploadError.message || 'Unknown error'}`);
        }
      }

      // Step 2: For onboarding, create user
      if (isOnboarding) {
        const userData = {
          name: taskDetails.employee_name,
          email: taskDetails.employee_email,
          department: taskDetails.employee_department,
          position: taskDetails.employee_position,
          hire_date: taskDetails.employee_hire_date,
          assignedProductIds: selectedProductIds,
        };
        
        try {
          await fetchAddUserAction(userData);
          toast.success('User created successfully');
        } catch (userError: any) {
          throw new Error(`Failed to create user: ${userError.message || 'Unknown error'}`);
        }
        
        // Step 3: Complete the task
        try {
          await completeTaskAction(taskDetails.id);
          toast.success('Onboarding completed successfully');
        } catch (taskError: any) {
          // Critical: User created but task completion failed
          toast.error(`User created but task completion failed: ${taskError.message || 'Unknown error'}`);
          toast.warning('Please contact admin - user was created but workflow task needs manual completion');
          console.error('CRITICAL: User created but task not completed', {
            taskId: taskDetails.id,
            userName: userData.name,
            userEmail: userData.email,
            error: taskError
          });
          throw taskError;
        }
      } else if (isOffboarding) {
        // For offboarding, complete the task with selected products to remove
        const productsToRemove = Array.from(selectedProductIdsToRemove);
        await completeTaskAction(taskDetails.id, productsToRemove);
        
        // Show different success message based on whether it's full or partial offboarding
        if (selectedProductIdsToRemove.size === taskDetails.assigned_products?.length) {
          toast.success('Offboarding completed successfully - user has been removed');
        } else {
          toast.success('Offboarding completed - user marked as resigned with remaining products');
        }
      }
      
      // Only close dialog and refresh if everything succeeded
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete workflow');
      console.error('Workflow completion error:', error);
      // Don't close dialog on error - let user see the error and retry
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (isOnboarding) return 'Onboarding Checklist';
    if (isOffboarding) return 'Offboarding Checklist';
    return 'Workflow Checklist';
  };

  const getDialogDescription = () => {
    if (isOnboarding) return 'Review employee information, print the checklist, complete it, upload the filled document, and submit.';
    if (isOffboarding) return 'Review employee information, print the checklist, complete it, upload the filled document, and submit to offboard the user.';
    return 'Complete the workflow checklist';
  };

  if (!taskDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Loading Task Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl">{getDialogTitle()}</DialogTitle>
              <DialogDescription>{getDialogDescription()}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Employee Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-3">Employee Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Name</Label>
                    <p className="font-medium">{taskDetails.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium">{taskDetails.employee_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Department</Label>
                    <p className="font-medium">{taskDetails.employee_department || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Position</Label>
                    <p className="font-medium">{taskDetails.employee_position || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {isOnboarding ? 'Hire Date' : 'Hire Date'}
                    </Label>
                    <p className="font-medium">{taskDetails.employee_hire_date || 'N/A'}</p>
                  </div>
                  {isOffboarding && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Resignation Date</Label>
                      <p className="font-medium">{taskDetails.employee_resignation_date || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Assignments */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Product Assignments</h3>
                  {isOnboarding && !readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProductSelector(!showProductSelector)}
                    >
                      <ListTodo className="mr-2 h-4 w-4" />
                      {showProductSelector ? 'Show Table' : 'Assign Products'}
                    </Button>
                  )}
                </div>
                
                {isOnboarding && showProductSelector ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Select services and products to grant access. Selecting a service selects all its active products.
                    </p>
                    <ServiceProductSelector
                      services={services}
                      selectedProductIds={selectedProductIds}
                      onSelectionChange={setSelectedProductIds}
                      loading={loadingServices}
                    />
                    {selectedProductIds.length > 0 && (
                      <p className="text-xs text-muted-foreground pt-2">
                        {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* For offboarding, check assigned_products; for onboarding, check selectedProductIds */}
                    {(isOffboarding ? (!taskDetails.assigned_products || taskDetails.assigned_products.length === 0) : selectedProductIds.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No products assigned</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Service Provider</th>
                              <th className="text-left p-2">Product</th>
                              <th className="text-left p-2">Service Admin</th>
                              {isOffboarding && !readOnly && (
                                <th className="text-center p-2 w-[60px]">
                                  <Checkbox
                                    checked={taskDetails?.assigned_products?.length ? 
                                      taskDetails.assigned_products.every(p => selectedProductIdsToRemove.has(p.product_id)) : false}
                                    onCheckedChange={handleToggleAllProductsRemoval}
                                  />
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {isOnboarding ? (
                              // For onboarding: Build product list from services data
                              services.flatMap(service => 
                                (service.products || [])
                                  .filter(product => selectedProductIds.includes(product.id))
                                  .map(product => ({
                                    product_id: product.id,
                                    product_name: product.name,
                                    service_name: service.name,
                                    service_admins: service.admins || []
                                  }))
                              ).map((product) => (
                                <tr key={product.product_id} className="border-b">
                                  <td className="p-2">{product.service_name}</td>
                                  <td className="p-2">{product.product_name}</td>
                                  <td className="p-2">
                                    {product.service_admins.length > 0
                                      ? product.service_admins.map(a => a.name).join(' / ')
                                      : 'N/A'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              // For offboarding: Use taskDetails.assigned_products
                              (taskDetails.assigned_products || []).map((product) => (
                                <tr key={product.product_id} className="border-b">
                                  <td className="p-2">{product.service_name}</td>
                                  <td className="p-2">{product.product_name}</td>
                                  <td className="p-2">
                                    {product.service_admins.length > 0
                                      ? product.service_admins.map(a => a.name).join(' / ')
                                      : 'N/A'}
                                  </td>
                                  {!readOnly && (
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={selectedProductIdsToRemove.has(product.product_id)}
                                        onCheckedChange={() => handleProductRemovalToggle(product.product_id)}
                                      />
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Warning message for offboarding */}
                    {isOffboarding && !readOnly && taskDetails?.assigned_products && taskDetails.assigned_products.length > 0 && (
                      <div className="mt-4">
                        {selectedProductIdsToRemove.size === taskDetails.assigned_products.length ? (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950/20 dark:border-yellow-900">
                            <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                              <strong>Warning:</strong> This employee will be completely removed from the system
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950/20 dark:border-blue-900">
                            <div className="text-blue-700 dark:text-blue-300 text-sm">
                              <strong>Note:</strong> This employee will be marked as resigned but remain in the system with unchecked products
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Print Button */}
              {!readOnly && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    className="w-full sm:w-auto"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Checklist
                  </Button>
                </div>
              )}

              {/* Attachment Upload */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    {readOnly ? 'Attachment' : 'Upload Attachment'} 
                    {!readOnly && <span className="text-destructive">*</span>}
                  </h3>
                </div>
                <div className="space-y-4">
                  {/* Upload Area */}
                  {!readOnly && !taskDetails.attachment_path && (
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        isDragOver
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      } cursor-pointer`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-muted">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {isDragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
                          </p>
                        </div>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.xlsx,.xls,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                  
                  {/* Selected File */}
                  {!readOnly && attachmentFile && (
                    <Card className="p-3">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{attachmentFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeAttachmentFile}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Already Uploaded */}
                  {taskDetails.attachment_path && (
                    <Card className="p-3">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {taskDetails.attachment_original_name || `checklist_${taskDetails.employee_name}_${taskDetails.id}.pdf`}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                Uploaded
                              </Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadAttachment}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
                            title="Download attachment"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              {readOnly ? (
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant={isOffboarding ? 'destructive' : 'default'}
                    title={!hasAttachment ? 'Please upload a completed checklist file first' : ''}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>{isOffboarding ? 'Complete Offboarding' : 'Complete Onboarding'}</>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Checklist (hidden, rendered for printing) */}
      {isPrinting && taskDetails && (
        <PrintableChecklist
          task={taskDetails}
          selectedProducts={
            isOnboarding
              ? // Build product list from services data based on selectedProductIds
                services.flatMap(service => 
                  (service.products || [])
                    .filter(product => selectedProductIds.includes(product.id))
                    .map(product => ({
                      product_id: product.id,
                      product_name: product.name,
                      service_name: service.name,
                      service_admins: service.admins || []
                    }))
                )
              : taskDetails.assigned_products || []
          }
        />
      )}
    </>
  );
}

