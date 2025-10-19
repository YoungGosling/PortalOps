'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Trash2, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { masterFilesApi } from '@/lib/api'
import { toast } from 'sonner'
import type { MasterFile } from '@/types'

export function MasterFiles() {
  const [files, setFiles] = useState<MasterFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const data = await masterFilesApi.getAttachments()
      setFiles(data)
    } catch (error) {
      toast.error('Failed to load master files')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await masterFilesApi.downloadAttachment(fileId)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = files.find(f => f.id === fileId)?.fileName || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file')
      console.error(error)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading master files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Files</h1>
        <p className="text-muted-foreground">
          Central repository of all bill attachments uploaded via the Payment Register
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">About Master Files</p>
              <p className="text-sm text-muted-foreground mt-1">
                All files uploaded as "Bill Attachments" in the Payment Register are automatically stored here.
                This page provides a centralized view of all billing documents across all products and services.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Total files: <span className="font-medium">{files.length}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No files uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Upload bill attachments in the Payment Register to see them here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(file => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {file.fileName}
                        </div>
                      </TableCell>
                      <TableCell>{file.serviceName}</TableCell>
                      <TableCell>{file.productName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(file.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file.id)}
                            disabled={deleting === file.id}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



