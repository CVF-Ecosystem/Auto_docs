import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables')
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export const geminiFlash = genAI?.getGenerativeModel({ 
  model: 'gemini-1.5-flash' 
}) || null

export function ensureGeminiConfigured() {
  if (!geminiFlash) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return geminiFlash
}
