import crypto from 'crypto'
import { gasLogger } from '@/lib/logger'

export interface GenerateDocumentResult {
  link: string
}

/**
 * Call Google Apps Script to generate document
 * Includes retry logic for timeouts
 */
export async function generateDocument(
  gasTemplateId: string,
  fields: Record<string, string>
): Promise<GenerateDocumentResult> {
  const gasWebhookUrl = process.env.GAS_WEBHOOK_URL
  
  if (!gasWebhookUrl) {
    throw new Error('GAS_WEBHOOK_URL is not configured')
  }
  
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const payload = JSON.stringify({
        templateDocId: gasTemplateId,
        fields: fields
      })
      
      const gasSecret = process.env.GAS_SECRET
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (gasSecret) {
        const signature = crypto.createHmac('sha256', gasSecret).update(payload).digest('hex')
        headers['X-Signature'] = signature
      }
      
      const response = await fetch(gasWebhookUrl, {
        method: 'POST',
        headers,
        body: payload
      })
      
      if (!response.ok) {
        throw new Error(`GAS returned status ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json() as GenerateDocumentResult
      
      if (!data.link) {
        throw new Error('GAS response missing document link')
      }
      
      return data
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (attempt < maxRetries) {
        gasLogger.warn({ gasTemplateId, attempt, err: errorMessage, retryInMs: retryDelay }, 'GAS attempt failed, retrying')
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        gasLogger.error({ gasTemplateId, attempt, err: errorMessage }, 'GAS failed after max retries')
        throw new Error(`GAS document generation failed after ${maxRetries} attempts: ${errorMessage}`)
      }
    }
  }
  
  throw new Error('GAS document generation failed: max retries exceeded')
}
