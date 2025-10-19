'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'

interface InputWithLabelProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function InputWithLabel({
  className,
  label,
  error,
  helperText,
  id,
  ...props
}: InputWithLabelProps) {
  // Use React.useId() for stable, unique IDs that match on server and client
  const generatedId = React.useId()
  const inputId = id || generatedId

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId}>
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}

