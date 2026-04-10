import { ensureGeminiConfigured } from '@/lib/gemini'
import { OcrEngine } from './index'

export class GeminiOcrEngine implements OcrEngine {
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const geminiFlash = ensureGeminiConfigured()
      
      // Convert buffer to base64
      const base64Data = buffer.toString('base64')
      
      // Create inline data for Gemini
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
      
      const prompt = 'Extract all text content from this document. Return only the raw text, no formatting or explanations.'
      
      const result = await geminiFlash.generateContent([prompt, imagePart])
      const response = result.response
      const text = response.text()
      
      return text
    } catch (error) {
      throw new Error(`Gemini OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
