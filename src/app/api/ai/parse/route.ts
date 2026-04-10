import { NextRequest, NextResponse } from 'next/server'
import { parseTextToJson, TemplateField } from '@/services/ai/parse'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`ai-parse:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 20 AI parse requests per minute.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { text, templateId } = body
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }
    
    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch template with fields from database
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Convert Prisma fields to TemplateField format
    const fields: TemplateField[] = template.fields.map(f => ({
      fieldName: f.fieldName,
      fieldLabel: f.fieldLabel,
      fieldType: f.fieldType,
      required: f.required
    }))
    
    // Parse text to JSON
    const parsedFields = await parseTextToJson(text, fields)
    
    return NextResponse.json({
      fields: parsedFields,
      templateId: template.id
    })
    
  } catch (error) {
    console.error('AI parse error:', error)
    return NextResponse.json(
      { 
        error: 'AI parsing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
