import { FileCategory } from '../file-filter/types'
import { OcrMode, getOcrEngine } from './ocr'
import { extractDocx } from './extractors/docx'
import { extractExcel } from './extractors/excel'
import { extractCsv } from './extractors/csv'
import { extractText as extractPlainText } from './extractors/text'
import { extractPdf } from './extractors/pdf'

/**
 * Main ingestion router
 * Routes files to appropriate extractors based on category
 */
export async function extractText(
  buffer: Buffer,
  filename: string,
  category: FileCategory,
  ocrMode: OcrMode = 'gemini'
): Promise<string> {
  try {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    
    // Handle text-extractable files
    if (category === 'text-extractable') {
      switch (ext) {
        case '.docx':
          return await extractDocx(buffer)
          
        case '.xlsx':
        case '.xls':
          return await extractExcel(buffer)
          
        case '.csv':
          return await extractCsv(buffer)
          
        case '.txt':
          return await extractPlainText(buffer)
          
        default:
          throw new Error(`Unsupported text-extractable format: ${ext}`)
      }
    }
    
    // Handle PDF files
    if (category === 'pdf-text' || category === 'pdf-scan') {
      const pdfResult = await extractPdf(buffer)
      
      // If it's a scan or has minimal text, use OCR
      if (pdfResult.isScan || category === 'pdf-scan') {
        const ocrEngine = await getOcrEngine(ocrMode)
        return await ocrEngine.extract(buffer, 'application/pdf')
      }
      
      return pdfResult.text
    }
    
    // Handle images - always use OCR
    if (category === 'image') {
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp'
      }
      
      const mimeType = mimeTypes[ext] || 'image/jpeg'
      const ocrEngine = await getOcrEngine(ocrMode)
      return await ocrEngine.extract(buffer, mimeType)
    }
    
    throw new Error(`Unable to extract text from category: ${category}`)
  } catch (error) {
    throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
