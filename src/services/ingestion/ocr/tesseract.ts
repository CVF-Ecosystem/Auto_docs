import Tesseract from 'tesseract.js'
import { OcrEngine } from './index'

export class TesseractOcrEngine implements OcrEngine {
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      // Create a worker with Vietnamese and English language support
      const worker = await Tesseract.createWorker(['vie', 'eng'], 1, {
        logger: () => {} // Disable logging
      })
      
      // Set timeout of 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tesseract OCR timeout after 30 seconds')), 30000)
      })
      
      const ocrPromise = (async () => {
        const { data } = await worker.recognize(buffer)
        await worker.terminate()
        return data.text
      })()
      
      const text = await Promise.race([ocrPromise, timeoutPromise])
      
      return text
    } catch (error) {
      throw new Error(`Tesseract OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
