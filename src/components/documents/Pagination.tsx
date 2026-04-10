'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams()
  
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/documents?${params.toString()}`
  }
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
          pages.push(i)
        }
        if (totalPages > maxVisible) {
          pages.push('...')
          pages.push(totalPages)
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
  if (totalPages <= 1) {
    return null
  }
  
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Link
        href={buildUrl(currentPage - 1)}
        className={`px-3 py-2 rounded-md ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
      >
        Trước
      </Link>
      
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          )
        }
        
        const pageNum = page as number
        const isActive = pageNum === currentPage
        
        return (
          <Link
            key={pageNum}
            href={buildUrl(pageNum)}
            className={`px-3 py-2 rounded-md ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {pageNum}
          </Link>
        )
      })}
      
      <Link
        href={buildUrl(currentPage + 1)}
        className={`px-3 py-2 rounded-md ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
      >
        Sau
      </Link>
    </div>
  )
}
