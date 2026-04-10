import { ensureGeminiConfigured } from '@/lib/gemini'
import { z } from 'zod'

export interface TemplateField {
  fieldName: string
  fieldLabel: string
  fieldType: string
  required: boolean
}

/**
 * Extract structured data from text based on template schema
 */
export async function parseTextToJson(
  text: string,
  fields: TemplateField[]
): Promise<Record<string, string>> {
  try {
    const geminiFlash = ensureGeminiConfigured()
    
    const fieldDescriptions = fields.map(f => 
      `- ${f.fieldName} (${f.fieldLabel}): ${f.fieldType}${f.required ? ' [REQUIRED]' : ''}`
    ).join('\n')
    
    const prompt = `You are a document parser. Extract information from the following text and return it as a JSON object.

Required fields:
${fieldDescriptions}

Document text:
${text}

Respond with ONLY a valid JSON object where keys are the field names and values are the extracted text. If a field cannot be found, use an empty string "". Do not include any explanations or markdown formatting.

Example format:
{
  "fieldName1": "extracted value",
  "fieldName2": "extracted value",
  "fieldName3": ""
}`
    
    let response: string
    let attempt = 0
    const maxAttempts = 2
    
    while (attempt < maxAttempts) {
      try {
        const result = await geminiFlash.generateContent(prompt)
        response = result.response.text()
        
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in response')
        }
        
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>
        
        // Validate that all required fields are present
        const schema = z.object(
          fields.reduce((acc, field) => {
            acc[field.fieldName] = field.required ? z.string().min(1) : z.string()
            return acc
          }, {} as Record<string, z.ZodString>)
        )
        
        const validated = schema.parse(parsed)
        return validated
        
      } catch (error) {
        attempt++
        if (attempt >= maxAttempts) {
          throw error
        }
        
        // Retry with more explicit instructions
        const retryPrompt = `${prompt}

IMPORTANT: Your previous response was invalid. Please ensure:
1. Return ONLY valid JSON, no markdown or explanations
2. Include ALL field names: ${fields.map(f => f.fieldName).join(', ')}
3. Use empty string "" for fields you cannot find`
        
        const retryResult = await geminiFlash.generateContent(retryPrompt)
        const retryResponse = retryResult.response.text()
        
        const retryJsonMatch = retryResponse.match(/\{[\s\S]*\}/)
        if (!retryJsonMatch) {
          continue
        }
        
        const retryParsed = JSON.parse(retryJsonMatch[0]) as Record<string, string>
        
        const schema = z.object(
          fields.reduce((acc, field) => {
            acc[field.fieldName] = field.required ? z.string().min(1) : z.string()
            return acc
          }, {} as Record<string, z.ZodString>)
        )
        
        const retryValidated = schema.parse(retryParsed)
        return retryValidated
      }
    }
    
    throw new Error('Failed to parse text after multiple attempts')
    
  } catch (error) {
    throw new Error(`Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
