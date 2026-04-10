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
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6 drop-shadow-sm">
          Tài liệu gần đây
        </h2>
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-white/40 border border-dashed border-slate-200">
          <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Chưa có tài liệu nào</p>
          <p className="text-sm text-slate-400 mt-1">Hãy tạo tài liệu đầu tiên của bạn</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 drop-shadow-sm">
          Tài liệu gần đây
        </h2>
        <Link 
          href="/dashboard/documents" 
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 px-4 py-2 rounded-full transition-all flex items-center gap-1"
        >
          Xem tất cả
          <span className="text-lg leading-none">&rsaquo;</span>
        </Link>
      </div>
      
      <div className="space-y-3">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/70 hover:bg-white rounded-xl border border-white hover:border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 gap-4"
          >
            <div className="flex flex-row items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 text-blue-500 rounded-lg shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate mb-1">
                  {doc.inputFile || 'Text input'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    {doc.template.name}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(doc.createdAt), { 
                      addSuffix: true,
                      locale: vi 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {doc.status === 'generated' && doc.docLink && (
              <Link
                href={doc.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center sm:w-auto w-full px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              >
                Mở tài liệu
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link ml-2">
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
