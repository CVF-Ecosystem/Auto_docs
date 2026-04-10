import { fileTypeFromBuffer } from 'file-type'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { 
  ALLOWED_EXTENSIONS, 
  ALLOWED_MIMES, 
  MAX_FILE_SIZE_BYTES,
  FileCategory,
  GateResult 
} from './types'

/**
 * Gate 1: Extension whitelist check
 */
export function gate1_extension(filename: string): GateResult {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
  
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as any)) {
    return {
      ok: false,
      error: `File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
  }
  
  return { ok: true }
}

/**
 * Gate 2: File size check
 */
export function gate2_filesize(buffer: Buffer): GateResult {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2)
    const maxMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)
    return {
      ok: false,
      error: `File too large (${sizeMB}MB). Maximum allowed: ${maxMB}MB`
    }
  }
  
  return { ok: true }
}

/**
 * Gate 3: MIME type validation using magic bytes
 */
export async function gate3_mimetype(buffer: Buffer, ext: string): Promise<GateResult> {
  try {
    const fileType = await fileTypeFromBuffer(buffer)
    const expectedMime = ALLOWED_MIMES[ext.toLowerCase()]
    
    // Special handling for text files (no magic bytes)
    if (ext === '.txt' || ext === '.csv') {
      return { ok: true }
    }
    
    // Special handling for Office files (complex MIME detection)
    if (ext === '.docx' || ext === '.xlsx' || ext === '.xls') {
      // Check if it's a ZIP-based format (Office files are ZIP archives)
      if (fileType?.mime === 'application/zip' || 
          fileType?.mime === expectedMime ||
          !fileType) {
        return { ok: true }
      }
    }
    
    if (!fileType) {
      return {
        ok: false,
        error: 'Unable to detect file type from content'
      }
    }
    
    if (fileType.mime !== expectedMime) {
      return {
        ok: false,
        error: `File MIME type mismatch. Expected: ${expectedMime}, Got: ${fileType.mime}`
      }
    }
    
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: `MIME type validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Gate 4: File integrity check
 */
export async function gate4_integrity(buffer: Buffer, ext: string): Promise<GateResult> {
  try {
    switch (ext.toLowerCase()) {
      case '.docx':
        await mammoth.extractRawText({ buffer })
        break
        
      case '.xlsx':
      case '.xls':
        XLSX.read(buffer, { type: 'buffer' })
        break
        
      case '.pdf':
        // Dynamic import for pdf-parse
        const pdfParseModule = await import('pdf-parse') as any
        const pdfParseFn = pdfParseModule.default || pdfParseModule
        await pdfParseFn(buffer)
        break
        
      case '.txt':
      case '.csv':
        // Just try to decode as UTF-8
        buffer.toString('utf-8')
        break
        
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
        // For images, we'll validate in OCR layer
        break
    }
    
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: `File appears to be corrupted or invalid: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Gate 5: File type classification
 */
export async function gate5_classify(ext: string, buffer: Buffer): Promise<GateResult> {
  try {
    let category: FileCategory
    
    switch (ext.toLowerCase()) {
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
        category = 'image'
        break
        
      case '.pdf':
        // Check if PDF is scan or text-based
        const pdfParseModule = await import('pdf-parse') as any
        const pdfParseFn = pdfParseModule.default || pdfParseModule
        const pdfData = await pdfParseFn(buffer)
        const textContent = pdfData.text.trim()
        
        if (textContent.length < 50) {
          category = 'pdf-scan'
        } else {
          category = 'pdf-text'
        }
        break
        
      case '.docx':
      case '.xlsx':
      case '.xls':
      case '.csv':
      case '.txt':
        category = 'text-extractable'
        break
        
      default:
        return {
          ok: false,
          error: `Unable to classify file type: ${ext}`
        }
    }
    
    return { ok: true, category }
  } catch (error) {
    return {
      ok: false,
      error: `File classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
