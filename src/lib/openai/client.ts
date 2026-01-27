import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ProductDetailsSchema, type ProductDetails } from '@/lib/validations/product'
import { PostIntentSchema, type PostIntent, DraftReplySchema, type DraftReply } from '@/lib/validations/mention'

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

export interface ClassificationResult {
  success: boolean
  data: PostIntent | null
  error?: string
}

export interface ReplyGenerationResult {
  success: boolean
  data: DraftReply | null
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

export async function classifyPostIntent(
  title: string,
  content: string,
  productContext: { name: string; description: string; keywords: string[] }
): Promise<ClassificationResult> {
  if (!openai) {
    return {
      success: false,
      data: null,
      error: 'OpenAI is not configured. Please set OPENAI_API_KEY.'
    }
  }

  try {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing Reddit posts to identify potential customers.

Classify posts into one of these intents:
- "pain_point": User is expressing frustration, struggling with a problem, or seeking help
- "recommendation_request": User is explicitly asking for product/tool/service recommendations
- "not_relevant": Post doesn't indicate a need that could be addressed by products like the one described

Product context:
- Name: ${productContext.name}
- Description: ${productContext.description}
- Keywords: ${productContext.keywords.join(', ')}

Be balanced in your assessment:
- Look for clear signals but also consider implied needs
- Higher confidence (75%+) for explicit requests or clear pain expressions
- Medium confidence (50-74%) for posts that suggest potential interest
- Lower confidence (<50%) for ambiguous cases

All posts with pain_point or recommendation_request intent will be shown to the user, even with low confidence. They can discard irrelevant ones.`
        },
        {
          role: 'user',
          content: `Analyze this Reddit post:

Title: ${title}

Content: ${content || '(no body text)'}

Classify the intent and provide your confidence level.`
        }
      ],
      response_format: zodResponseFormat(PostIntentSchema, 'post_intent'),
    })

    const parsed = completion.choices[0]?.message?.parsed

    if (!parsed) {
      return {
        success: false,
        data: null,
        error: 'Failed to parse classification result.'
      }
    }

    return {
      success: true,
      data: parsed
    }
  } catch (error) {
    console.error('OpenAI classification error:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to classify post intent'
    }
  }
}
