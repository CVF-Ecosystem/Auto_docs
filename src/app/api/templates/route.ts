import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/templates - List all active templates
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.template.findMany({
      where: {
        status: 'active'
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(templates)
    
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new template (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, gasTemplateId, fields } = body
    
    if (!name || !gasTemplateId || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, gasTemplateId, fields' },
        { status: 400 }
      )
    }
    
    // Create template with fields
    const template = await prisma.template.create({
      data: {
        name,
        description,
        gasTemplateId,
        schema: fields, // Store as JSON
        fields: {
          create: fields.map((field: any, index: number) => ({
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType || 'text',
            required: field.required || false,
            order: index,
            options: field.options || null
          }))
        }
      },
      include: {
        fields: true
      }
    })
    
    return NextResponse.json(template, { status: 201 })
    
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
