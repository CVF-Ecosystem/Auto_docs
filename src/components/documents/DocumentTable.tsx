import Link from 'next/link'
import { format } from 'date-fns'

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

interface DocumentTableProps {
  documents: Document[]
}

function getStatusBadge(status: string) {
  const styles = {
    draft: 'bg-gray-100 text-gray-800',
    generated: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  }
  
  const labels = {
    draft: 'Nháp',
    generated: 'Đã tạo',
    error: 'Lỗi',
  }
  
  const style = styles[status as keyof typeof styles] || styles.draft
  const label = labels[status as keyof typeof labels] || status
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {label}
    </span>
  )
}

export function DocumentTable({ documents }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Chưa có tài liệu nào
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên file
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {doc.inputFile || 'Text input'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {doc.template.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(doc.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {doc.status === 'generated' && doc.docLink ? (
                    <Link
                      href={doc.docLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Xem tài liệu
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
