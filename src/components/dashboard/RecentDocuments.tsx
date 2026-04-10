import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Document {
  id: string
  inputFile: string | null
  createdAt: Date
  status: string
  docLink: string | null
  template: {
    name: string
  }
}

interface RecentDocumentsProps {
  documents: Document[]
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tài liệu gần đây</h2>
        <p className="text-gray-500 text-center py-8">Chưa có tài liệu nào</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tài liệu gần đây</h2>
        <Link 
          href="/documents" 
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      
      <div className="space-y-3">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {doc.inputFile || 'Text input'}
              </p>
              <p className="text-xs text-gray-500">
                {doc.template.name} • {formatDistanceToNow(new Date(doc.createdAt), { 
                  addSuffix: true,
                  locale: vi 
                })}
              </p>
            </div>
            
            {doc.status === 'generated' && doc.docLink && (
              <Link
                href={doc.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
              >
                Xem
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
