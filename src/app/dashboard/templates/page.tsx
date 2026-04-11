import { prisma } from '@/lib/prisma'
import { LayoutTemplate, Layers, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    where: { status: 'active' },
    include: {
      fields: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50/50 pb-20">
      <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 flex items-center gap-3">
            <LayoutTemplate className="text-blue-600" />
            Kho Mẫu Tài Liệu (Templates)
          </h1>
          <p className="text-slate-500 mt-2">Dưới đây là các loại biểu mẫu công ty đã được tích hợp AI nhận diện tự động.</p>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/40 shadow-sm">
            <LayoutTemplate size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">Chưa có Template nào</h3>
            <p className="text-slate-500 mt-2">Vui lòng thêm các Schema AI vào hệ thống.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="group flex flex-col bg-white/70 backdrop-blur-xl border border-white hover:border-blue-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-blue-600 shadow-sm">
                    <Layers size={24} />
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">
                    Active
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{template.name}</h3>
                <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">{template.description || "Không có mô tả."}</p>
                
                <div className="space-y-4 pt-4 border-t border-slate-100 mb-4 flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cấu trúc dữ liệu AI ({template.fields.length} trường):</p>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.slice(0, 5).map(field => (
                      <span key={field.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
                        {field.fieldName}
                        {field.required && <span className="text-red-400 ml-0.5">*</span>}
                      </span>
                    ))}
                    {template.fields.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200">
                        +{template.fields.length - 5} nữa
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Cập nhật {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true, locale: vi })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
