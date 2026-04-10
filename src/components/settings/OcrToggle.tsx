'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OcrToggleProps {
  value?: 'gemini' | 'tesseract'
  onChange?: (mode: 'gemini' | 'tesseract') => void
}

export function OcrToggle({ value, onChange }: OcrToggleProps) {
  const [mode, setMode] = useState<'gemini' | 'tesseract'>(value || 'gemini')
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('ocrMode') as 'gemini' | 'tesseract' | null
    if (saved && !value) {
      setMode(saved)
    }
  }, [value])

  const handleToggle = () => {
    const newMode = mode === 'gemini' ? 'tesseract' : 'gemini'
    setMode(newMode)
    
    // Save to localStorage
    localStorage.setItem('ocrMode', newMode)
    
    // Notify parent
    if (onChange) {
      onChange(newMode)
    }
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">OCR Engine:</span>
        
        <button
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            mode === 'gemini' ? 'bg-blue-600' : 'bg-gray-400'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              mode === 'gemini' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>

        <div className="flex items-center space-x-2">
          <span className={cn(
            'text-sm font-medium',
            mode === 'gemini' ? 'text-blue-600' : 'text-gray-500'
          )}>
            {mode === 'gemini' ? '🌟 Gemini Vision' : '🔧 Tesseract.js'}
          </span>
          
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 w-80 p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-blue-600 mb-1">
                🌟 Gemini Vision (Cloud)
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Độ chính xác cao</li>
                <li>✓ Hỗ trợ tiếng Việt tốt</li>
                <li>✓ Xử lý nhanh</li>
                <li>✗ Cần API key & internet</li>
                <li>✗ Tốn API cost</li>
              </ul>
            </div>
            
            <div className="border-t pt-2">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                🔧 Tesseract.js (Offline)
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Miễn phí, không giới hạn</li>
                <li>✓ Chạy offline</li>
                <li>✓ Không cần API key</li>
                <li>✗ Chậm hơn (30s/page)</li>
                <li>✗ Độ chính xác thấp hơn</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
