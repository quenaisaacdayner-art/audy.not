import { z } from 'zod'

// Schema for AI-generated product details (used with OpenAI zodResponseFormat)
// Keep simple types for JSON Schema compatibility
export const ProductDetailsSchema = z.object({
  name: z.string().describe('Product name'),
  description: z.string().describe('Brief product description (2-3 sentences)'),
  keywords: z.array(z.string()).describe('5-10 relevant keywords for monitoring Reddit posts'),
  subreddits: z.array(z.string()).describe('5-10 relevant subreddits without r/ prefix'),
})

export type ProductDetails = z.infer<typeof ProductDetailsSchema>

// Schema for product form submission (stricter validation)
export const productFormSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name must be 100 characters or less'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be 500 characters or less'),
  url: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  keywords: z.array(z.string())
    .min(1, 'Add at least one keyword')
    .max(20, 'Maximum 20 keywords allowed'),
  subreddits: z.array(z.string())
    .min(1, 'Add at least one subreddit')
    .max(20, 'Maximum 20 subreddits allowed'),
})

export type ProductFormData = z.infer<typeof productFormSchema>

// Helper to convert comma-separated string to array (for form input)
export function parseCommaSeparated(input: string): string[] {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

// Helper to format array as comma-separated string (for form display)
export function formatAsCommaSeparated(arr: string[]): string {
  return arr.join(', ')
}
