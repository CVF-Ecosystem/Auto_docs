import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'

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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Xin chào, {session.user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tạo tài liệu mới
              </Link>
              <LogoutButton />
            </div>
          </div>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard 
              label="Tổng số tài liệu"
              value={totalDocs}
              icon="📄"
            />
            <StatsCard 
              label="Tài liệu hôm nay"
              value={todayDocs}
              icon="📅"
            />
            <StatsCard 
              label="Templates khả dụng"
              value={totalTemplates}
              icon="📋"
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
