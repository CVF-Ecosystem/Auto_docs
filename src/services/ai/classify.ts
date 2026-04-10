import { ensureGeminiConfigured } from '@/lib/gemini'

export interface ClassificationResult {
  templateId: string
  confidence: number
}

/**
 * Classify text to determine which template it matches
 */
export async function classifyTemplate(
  text: string,
  templates: Array<{ id: string; name: string; description?: string }>
): Promise<ClassificationResult> {
  try {
    const geminiFlash = ensureGeminiConfigured()
    
    if (templates.length === 0) {
      throw new Error('No templates available for classification')
    }
    
    // If only one template, return it with high confidence
    if (templates.length === 1) {
      return {
        templateId: templates[0].id,
        confidence: 1.0
      }
    }
    
    const templateList = templates.map((t, idx) => 
      `${idx + 1}. ID: ${t.id}, Name: ${t.name}${t.description ? `, Description: ${t.description}` : ''}`
    ).join('\n')
    
    const prompt = `You are a document classifier. Given the following text and a list of document templates, determine which template best matches the content.

Available templates:
${templateList}

Document text:
${text.substring(0, 2000)}

Respond with ONLY a valid JSON object in this exact format:
{
  "templateId": "the_template_id",
  "confidence": 0.95
}

The confidence should be a number between 0 and 1.`
    
    const result = await geminiFlash.generateContent(prompt)
    const response = result.response.text()
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response')
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult
    
    // Validate the result
    if (!parsed.templateId || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid classification result format')
    }
    
    // Verify templateId exists
    const templateExists = templates.some(t => t.id === parsed.templateId)
    if (!templateExists) {
      // Fallback to first template
      return {
        templateId: templates[0].id,
        confidence: 0.5
      }
    }
    
    return parsed
  } catch (error) {
    throw new Error(`Template classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
