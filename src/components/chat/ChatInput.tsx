'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSubmit: (text: string) => void
  onFileUpload?: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSubmit, 
  onFileUpload,
  disabled = false,
  placeholder = 'Nhập text hoặc upload file...'
}: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !disabled) {
      onSubmit(text.trim())
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-end space-x-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            className={cn(
              'w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              'placeholder:text-gray-400'
            )}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2">
          {/* Upload File Button */}
          {onFileUpload && (
            <button
              type="button"
              onClick={onFileUpload}
              disabled={disabled}
              className={cn(
                'p-3 rounded-lg transition-colors',
                disabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              title="Upload file"
            >
              📎
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className={cn(
              'p-3 rounded-lg transition-colors',
              disabled || !text.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
            title="Submit"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to submit, 
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded ml-1">Shift+Enter</kbd> for new line
      </p>
    </form>
  )
}
