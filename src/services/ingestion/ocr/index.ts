export interface OcrEngine {
  extract(buffer: Buffer, mimeType: string): Promise<string>
}

export type OcrMode = 'gemini' | 'tesseract'

export async function getOcrEngine(mode: OcrMode): Promise<OcrEngine> {
  if (mode === 'gemini') {
    const { GeminiOcrEngine } = await import('./gemini')
    return new GeminiOcrEngine()
  } else {
    const { TesseractOcrEngine } = await import('./tesseract')
    return new TesseractOcrEngine()
  }
}
