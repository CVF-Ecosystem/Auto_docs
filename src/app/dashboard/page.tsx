import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'

import { FileText, CalendarDays, LayoutTemplate, PlusCircle } from 'lucide-react'

// ... skipped down to DashboardContent function...
async function DashboardContent() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  try {
    // Fetch statistics
    const [totalDocs, todayDocs, totalTemplates, recentDocs] = await Promise.all([
      prisma.document.count({
        where: { userId: session.user.id }
      }),
      prisma.document.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.template.count({
        where: { status: 'active' }
      }),
      prisma.document.findMany({
        where: { userId: session.user.id },
        include: { 
          template: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])
    
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/80 via-white to-cyan-50/50">
        <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                Dashboard
              </h1>
              <p className="text-slate-500 mt-1">Xin chào, <span className="font-semibold text-slate-700">{session.user.name}</span>! Chúc một ngày làm việc hiệu quả.</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/dashboard/create"
                className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-0.5 font-medium"
              >
                <PlusCircle size={20} />
                Tạo tài liệu mới
              </Link>
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
              <LogoutButton />
            </div>
          </div>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatsCard 
              label="Tổng số tài liệu"
              value={totalDocs}
              icon={<FileText size={32} strokeWidth={1.5} />}
            />
            <StatsCard 
              label="Tài liệu hôm nay"
              value={todayDocs}
              icon={<CalendarDays size={32} strokeWidth={1.5} />}
            />
            <StatsCard 
              label="Templates khả dụng"
              value={totalTemplates}
              icon={<LayoutTemplate size={32} strokeWidth={1.5} />}
            />
          </div>
          
          {/* Recent Documents */}
          <RecentDocuments documents={recentDocs} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading dashboard:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      </div>
    )
  }
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
