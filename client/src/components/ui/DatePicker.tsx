import React from 'react'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { TextField } from '@mui/material'
import { Calendar } from 'lucide-react'
import dayjs, { Dayjs } from 'dayjs'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  monthYearOnly?: boolean
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className = "",
  monthYearOnly = false 
}: DatePickerProps) {
  
  // Convert string value to Dayjs object
  const parseValue = (dateString: string): Dayjs | null => {
    if (!dateString) return null
    
    try {
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dayjs(dateString)
      }
      
      // Handle MM/DD/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dayjs(dateString, 'MM/DD/YYYY')
      }
      
      // Handle MM/YYYY format (convert to first day of month)
      if (/^\d{2}\/\d{4}$/.test(dateString)) {
        return dayjs(dateString + '/01', 'MM/YYYY/DD')
      }
      
      // Try to parse as regular date
      const parsed = dayjs(dateString)
      return parsed.isValid() ? parsed : null
    } catch {
      return null
    }
  }

  // Convert Dayjs object to string format for storage
  const formatValue = (date: Dayjs | null): string => {
    if (!date || !date.isValid()) return ''
    return date.format('YYYY-MM-DD')
  }

  const selectedDate = parseValue(value)

  const handleChange = (date: Dayjs | null) => {
    onChange(formatValue(date))
  }

  // Custom TextField component with our styling
  const CustomTextField = (params: any) => (
    <div className={`relative ${className}`}>
      <TextField
        {...params}
        placeholder={placeholder}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            backgroundColor: 'white',
            '& fieldset': {
              borderColor: '#d1d5db',
            },
            '&:hover fieldset': {
              borderColor: '#9ca3af',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
              borderWidth: '2px',
            },
          },
          '& .MuiInputBase-input': {
            padding: '8px 12px',
            cursor: 'pointer',
          },
          '& .MuiInputBase-root': {
            paddingRight: '40px !important',
          }
        }}
        InputProps={{
          ...params.InputProps,
          readOnly: true,
        }}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        value={selectedDate}
        onChange={handleChange}
        enableAccessibleFieldDOMStructure={false}
        slots={{
          textField: CustomTextField,
        }}
        views={monthYearOnly ? ['year', 'month'] : ['year', 'month', 'day']}
        openTo={monthYearOnly ? 'month' : 'day'}
        format={monthYearOnly ? 'MM/YYYY' : 'MM/DD/YYYY'}
        slotProps={{
          popper: {
            sx: {
              zIndex: 9999,
            },
          },
          desktopPaper: {
            sx: {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          },
        }}
      />
    </LocalizationProvider>
  )
}
