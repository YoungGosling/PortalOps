'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface EditPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  submitLabel?: string
  children: React.ReactNode
}

/**
 * Unified Add/Edit Panel Component
 * Used across all modules for consistent create and update operations
 */
export function EditPanel({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  children,
}: EditPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {children}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </div>
    </>
  )
}



