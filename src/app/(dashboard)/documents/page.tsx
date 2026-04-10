import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { Pagination } from '@/components/documents/Pagination'
import { redirect } from 'next/navigation'

interface SearchParams {
  page?: string
  templateId?: string
  status?: string
  startDate?: string
  endDate?: string
}

async function DocumentsContent({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  // Parse query parameters
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const skip = (page - 1) * pageSize
  
  // Build filter conditions
  const where: any = {
    userId: session.user.id
  }
  
  if (searchParams.templateId) {
    where.templateId = searchParams.templateId
  }
  
  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status
  }
  
  if (searchParams.startDate || searchParams.endDate) {
    where.createdAt = {}
    if (searchParams.startDate) {
      where.createdAt.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      // Set to end of day
      const endDate = new Date(searchParams.endDate)
      endDate.setHours(23, 59, 59, 999)
      where.createdAt.lte = endDate
    }
  }
  
  try {
    // Fetch documents and count
    const [documents, totalCount, templates] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          template: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize
      }),
      prisma.document.count({ where }),
      prisma.template.findMany({
        where: { status: 'active' },
        select: { id: true, name: true }
      })
    ])
    
    const totalPages = Math.ceil(totalCount / pageSize)
    
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Lịch sử tài liệu</h1>
        
        <DocumentFilters templates={templates} />
        
        <DocumentTable documents={documents} />
        
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    )
  } catch (error) {
    console.error('Error loading documents:', error)
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Lịch sử tài liệu</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      </div>
    )
  }
}

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Lịch sử tài liệu</h1>
        <div className="text-gray-600">Đang tải...</div>
      </div>
    }>
      <DocumentsContent searchParams={searchParams} />
    </Suspense>
  )
}
