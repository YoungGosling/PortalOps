'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { BillAttachment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function MasterFilesPage() {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState<BillAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMasterFiles();
      setFiles(data);
    } catch (error) {
      toast.error('Failed to load files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchFiles();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Archive className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can access master files
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const blob = await apiClient.downloadAttachment(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Files</h1>
        <p className="text-muted-foreground">
          Central repository of all bill attachments
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded mb-2" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-sm text-muted-foreground">
              Bill attachments uploaded in Payment Register will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.product_name} - {file.service_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      {new Date(file.upload_date).toLocaleDateString()}
                    </p>
                    {file.file_size && (
                      <p className="text-sm text-muted-foreground">
                        {(file.file_size / 1024).toFixed(2)} KB
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.filename)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

