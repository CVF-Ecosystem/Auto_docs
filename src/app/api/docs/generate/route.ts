import { NextRequest, NextResponse } from 'next/server'
import { generateDocument } from '@/services/gas'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, fields } = body
    
    if (!documentId || !fields) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, fields' },
        { status: 400 }
      )
    }
    
    // Fetch document to get template info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        template: true
      }
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Call Google Apps Script to generate document
    const result = await generateDocument(
      document.template.gasTemplateId,
      fields
    )
    
    // Update document with link and status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        docLink: result.link,
        status: 'generated',
        parsedJson: fields
      }
    })
    
    return NextResponse.json({
      link: result.link
    })
    
  } catch (error) {
    console.error('Generate document error:', error)
    
    // Update document status to error if we have documentId
    const body = await request.json().catch(() => ({}))
    if (body.documentId) {
      await prisma.document.update({
        where: { id: body.documentId },
        data: { status: 'error' }
      }).catch(() => {})
    }
    
    return NextResponse.json(
      { 
        error: 'Document generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
