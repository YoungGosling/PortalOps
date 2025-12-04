'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { importAssignmentsAction } from '@/api/users/import_assignments/action';
import { toast } from 'sonner';
import { Loader2, Upload, X, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportAssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportAssignmentsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportAssignmentsDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success_count: number;
    failed_count: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const excelFile = droppedFiles.find(file => 
      file.name.match(/\.(xlsx|xls)$/i)
    );
    
    if (excelFile) {
      setSelectedFile(excelFile);
      setImportResult(null);
    } else {
      toast.error('Please select an Excel file (.xlsx or .xls)');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast.error('Please select an Excel file (.xlsx or .xls)');
      }
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setUploading(true);
      const result = await importAssignmentsAction(selectedFile);
      setImportResult(result);
      
      if (result.success_count > 0) {
        toast.success(`Successfully imported ${result.success_count} product assignment(s)`);
        if (result.failed_count > 0) {
          toast.warning(`${result.failed_count} assignment(s) failed to import`);
        }
        onSuccess();
      } else {
        toast.error('No assignments were imported. Please check the errors.');
      }
    } catch (error: any) {
      console.error('Error importing assignments:', error);
      toast.error(error.message || 'Failed to import product assignments');
      // Don't set importResult on error, keep the form visible
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setImportResult(null);
      setIsDragOver(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Product Assignments</DialogTitle>
          <DialogDescription>
            Upload an Excel file with Employee, Email, and product columns.
            Mark assignments with &apos;Y&apos;. All users must exist in the system.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/templates/assignment_template.xlsx';
                link.download = 'assignment_import_template.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Template downloaded successfully');
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!importResult && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isDragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Excel files only (.xlsx, .xls)
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format: Employee | Email | Product1 | Product2 | ...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mark assignments with &apos;Y&apos; in product columns
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          )}

          {/* Selected File */}
          {selectedFile && !importResult && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-900 dark:text-green-100">
                      Success: {importResult.success_count}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-900 dark:text-red-100">
                      Failed: {importResult.failed_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span>Errors:</span>
                  </div>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-destructive">
                          {error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!importResult ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

