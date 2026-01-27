import { z } from 'zod'

// Schema for AI-generated post intent classification (used with OpenAI zodResponseFormat)
export const PostIntentSchema = z.object({
  intent: z.enum(['pain_point', 'recommendation_request', 'not_relevant'])
    .describe('The primary intent of the post'),
  confidence: z.number().min(0).max(100)
    .describe('Confidence score as percentage (0-100)'),
  reasoning: z.string()
    .describe('Brief explanation of why this classification was chosen'),
})

export type PostIntent = z.infer<typeof PostIntentSchema>

// Schema for AI-generated draft reply (used with OpenAI zodResponseFormat)
export const DraftReplySchema = z.object({
  reply: z.string()
    .describe('The draft reply text, plain text only (no markdown)'),
})

export type DraftReply = z.infer<typeof DraftReplySchema>

// Schema for validating mention status updates
export const mentionStatusSchema = z.enum(['pending', 'approved', 'discarded', 'regenerated'])

export type MentionStatus = z.infer<typeof mentionStatusSchema>
