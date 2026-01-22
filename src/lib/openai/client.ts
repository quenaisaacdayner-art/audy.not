import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ProductDetailsSchema, type ProductDetails } from '@/lib/validations/product'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.warn('OPENAI_API_KEY not set - AI generation will fail')
}

const openai = apiKey ? new OpenAI({ apiKey }) : null

export interface GenerationResult {
  success: boolean
  data: ProductDetails | null
  error?: string
}

export async function generateProductDetails(
  websiteContent: string
): Promise<GenerationResult> {
  if (!openai) {
    return {
      success: false,
      data: null,
      error: 'OpenAI is not configured. Please set OPENAI_API_KEY.'
    }
  }

  try {
    // Truncate content if too long (gpt-4o-mini context window)
    const truncatedContent = websiteContent.slice(0, 15000)

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing SaaS products. Given website content, extract:
1. Product name - the official name of the product/service
2. A concise description (2-3 sentences) explaining what the product does
3. Keywords (5-10) that people might use when discussing this type of product or looking for solutions it provides
4. Relevant subreddits (5-10, without r/ prefix) where the target audience might discuss similar products, ask for recommendations, or share pain points

Focus on keywords and subreddits that would help identify people who could benefit from this product.`
        },
        {
          role: 'user',
          content: `Analyze this website and extract product details:\n\n${truncatedContent}`
        }
      ],
      response_format: zodResponseFormat(ProductDetailsSchema, 'product_details'),
    })

    const parsed = completion.choices[0]?.message?.parsed

    if (!parsed) {
      return {
        success: false,
        data: null,
        error: 'AI could not extract product details from this content.'
      }
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error) {
    console.error('OpenAI generation error:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate product details'
    }
  }
}
