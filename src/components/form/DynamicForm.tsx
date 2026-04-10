'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TemplateField {
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'date' | 'number' | 'select'
  required: boolean
  order: number
  options?: string[] | null
}

interface DynamicFormProps {
  fields: TemplateField[]
  initialValues?: Record<string, string>
  onSubmit: (values: Record<string, string>) => void
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

export function DynamicForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Xác nhận & Tạo tài liệu',
  isSubmitting = false
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleChange = (fieldName: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    fields.forEach(field => {
      if (field.required && !values[field.fieldName]?.trim()) {
        newErrors[field.fieldName] = `${field.fieldLabel} là bắt buộc`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validate()) {
      onSubmit(values)
    }
  }

  const renderField = (field: TemplateField) => {
    const value = values[field.fieldName] || ''
    const error = errors[field.fieldName]

    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isSubmitting}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isSubmitting}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isSubmitting}
          />
        )

      case 'select':
        const options = Array.isArray(field.options) ? field.options : []
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.fieldName, e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-500' : 'border-gray-300'
            )}
            disabled={isSubmitting}
          >
            <option value="">-- Chọn --</option>
            {options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      default:
        return null
    }
  }

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {sortedFields.map((field) => (
          <div key={field.fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.fieldLabel}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {errors[field.fieldName] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[field.fieldName]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Hủy
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
