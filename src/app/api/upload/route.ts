import { NextRequest, NextResponse } from 'next/server'
import { runFileFilterPipeline } from '@/services/file-filter'
import { extractText } from '@/services/ingestion'
import { OcrMode } from '@/services/ingestion/ocr'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { uploadLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (!checkRateLimit(`upload:${ip}`, 10, 60_000)) {
    uploadLogger.warn({ ip }, 'Rate limit exceeded')
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 uploads per minute.' },
      { status: 429 }
    )
  }

  const start = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const ocrMode = (formData.get('ocrMode') as OcrMode) || 'gemini'

    if (!file) {
      uploadLogger.warn({ ip }, 'No file provided in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    uploadLogger.info({ ip, fileName: file.name, fileSize: file.size, ocrMode }, 'Upload started')

    // Convert file to buffer — processing is fully in-memory, no temp file written to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Run file filter pipeline (5 gates)
    const filterResult = await runFileFilterPipeline(buffer, file.name)

    if (!filterResult.ok) {
      uploadLogger.warn({ ip, fileName: file.name, error: filterResult.error }, 'File filter rejected')
      return NextResponse.json({ error: filterResult.error }, { status: 400 })
    }

    if (!filterResult.category) {
      uploadLogger.error({ ip, fileName: file.name }, 'File category could not be determined')
      return NextResponse.json({ error: 'Unable to determine file category' }, { status: 400 })
    }

    uploadLogger.info({ ip, fileName: file.name, category: filterResult.category }, 'File filter passed')

    // Extract text from file
    const text = await extractText(buffer, file.name, filterResult.category, ocrMode)

    const ocrUsed = filterResult.category === 'image' || filterResult.category === 'pdf-scan'
    const durationMs = Date.now() - start

    uploadLogger.info(
      { ip, fileName: file.name, category: filterResult.category, ocrUsed, ocrMode: ocrUsed ? ocrMode : undefined, durationMs, textLength: text.length },
      'Upload completed'
    )

    return NextResponse.json({
      text,
      category: filterResult.category,
      ocrUsed,
      ocrEngine: ocrUsed ? ocrMode : undefined,
    })

  } catch (error) {
    const durationMs = Date.now() - start
    uploadLogger.error({ ip, durationMs, err: error instanceof Error ? error.message : 'Unknown' }, 'Upload failed')
    return NextResponse.json(
      { error: 'File processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
