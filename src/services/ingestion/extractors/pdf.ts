import * as pdfParse from 'pdf-parse'

export interface PdfExtractionResult {
  text: string
  isScan: boolean
}

/**
 * Extract text from PDF file
 * Detects if PDF is a scan (empty or minimal text layer)
 */
export async function extractPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const pdfParseModule = await import('pdf-parse') as any
    const pdfParseFn = pdfParseModule.default || pdfParseModule
    const data = await pdfParseFn(buffer)
    const text = data.text
    
    // If text content is less than 50 characters, consider it a scan
    const isScan = text.trim().length < 50
    
    return {
      text,
      isScan
    }
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
