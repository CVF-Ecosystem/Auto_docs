'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUploadComplete?: (result: UploadResult) => void
  ocrMode?: 'gemini' | 'tesseract'
  disabled?: boolean
}

export interface UploadResult {
  text: string
  category: string
  ocrUsed: boolean
  ocrEngine?: string
}

export function FileUpload({ 
  onFileSelect, 
  onUploadComplete,
  ocrMode = 'gemini',
  disabled = false 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    setSelectedFile(file)
    setError(null)
    onFileSelect(file)
  }

  const uploadFile = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('ocrMode', ocrMode)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (onUploadComplete) {
        onUploadComplete(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
    switch (ext) {
      case '.pdf': return '📄'
      case '.docx': return '📝'
      case '.xlsx':
      case '.xls': return '📊'
      case '.csv': return '📋'
      case '.txt': return '📃'
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp': return '🖼️'
      default: return '📎'
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-blue-500 bg-blue-50',
          !isDragging && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id="file-input"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp"
        />
        
        <label
          htmlFor="file-input"
          className={cn(
            'cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        >
          <div className="text-4xl mb-4">📁</div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag & drop file here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported: PDF, DOCX, XLSX, CSV, TXT, Images (max 20MB)
          </p>
        </label>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setError(null)
              }}
              className="text-gray-400 hover:text-gray-600"
              disabled={isUploading}
            >
              ✕
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadFile}
            disabled={isUploading || disabled}
            className={cn(
              'w-full py-2 px-4 rounded-lg font-medium transition-colors',
              isUploading || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
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
                Processing...
              </span>
            ) : (
              'Upload & Process'
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <span className="font-medium">Error:</span> {error}
          </p>
        </div>
      )}
    </div>
  )
}
