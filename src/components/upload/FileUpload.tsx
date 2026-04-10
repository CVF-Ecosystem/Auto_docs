import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { UploadCloud, FileType, X, Loader2 } from 'lucide-react'

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

  return (
    <div className="w-full space-y-6">
      {/* Drop Zone */}
      <div className="relative group">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500",
          isDragging && "opacity-60 blur-xl"
        )} />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative bg-white/70 backdrop-blur-xl border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300',
            isDragging ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-xl' : 'border-slate-300 hover:border-blue-400',
            disabled && 'opacity-60 cursor-not-allowed border-slate-200'
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
              'flex flex-col items-center justify-center cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            <div className={cn(
              "p-4 rounded-full mb-4 transition-transform duration-500",
              isDragging ? "bg-blue-100 text-blue-600 scale-110" : "bg-slate-50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50"
            )}>
              <UploadCloud size={40} strokeWidth={1.5} />
            </div>
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-2">
              Kéo thả tài liệu vào đây
            </p>
            <p className="text-slate-500 mb-6 font-medium">
              hoặc <span className="text-blue-600 hover:underline">duyệt qua thư mục</span>
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50 px-4 py-2 rounded-full border border-slate-200/50">
              <FileType size={14} />
              PDF, DOCX, XLSX, TXT, Images (Max: 20MB)
            </div>
          </label>
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 text-blue-600 rounded-xl">
                <FileType size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {selectedFile.name.split('.').pop()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setError(null)
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadFile}
            disabled={isUploading || disabled}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-semibold shadow-sm transition-all duration-300 flex items-center justify-center gap-2',
              isUploading || disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Đang xử lý dữ liệu AI...
              </>
            ) : (
              <>
                <UploadCloud size={20} />
                Tải lên & Phân tích cấu trúc
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-medium text-red-800 flex items-center gap-2">
            <span className="p-1 bg-red-100 rounded-full"><X size={14} /></span>
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
