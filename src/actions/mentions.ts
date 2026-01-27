'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Mention } from '@/types/database'
import { mentionStatusSchema, type MentionStatus } from '@/lib/validations/mention'

export interface CreateMentionInput {
  product_id: string
  user_id: string
  reddit_post_id: string
  reddit_permalink: string
  reddit_title: string
  reddit_content: string | null
  reddit_author: string
  reddit_subreddit: string
  reddit_created_at: string
  intent: 'pain_point' | 'recommendation_request'
  confidence: number
  draft_reply: string | null
}

/**
 * Creates a new mention record.
 * Called by cron job - no user auth check needed here (cron validates CRON_SECRET).
 */
export async function createMention(
  input: CreateMentionInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentions')
    .insert({
      product_id: input.product_id,
      user_id: input.user_id,
      reddit_post_id: input.reddit_post_id,
      reddit_permalink: input.reddit_permalink,
      reddit_title: input.reddit_title,
      reddit_content: input.reddit_content,
      reddit_author: input.reddit_author,
      reddit_subreddit: input.reddit_subreddit,
      reddit_created_at: input.reddit_created_at,
      intent: input.intent,
      confidence: input.confidence,
      draft_reply: input.draft_reply,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Mention create error:', error)
    return { success: false, error: 'Failed to create mention' }
  }

  return { success: true, id: data.id }
}

/**
 * Checks if a mention already exists for a product/post combination.
 * Used for deduplication in cron job.
 */
export async function checkMentionExists(
  productId: string,
  redditPostId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentions')
    .select('id')
    .eq('product_id', productId)
    .eq('reddit_post_id', redditPostId)
    .maybeSingle()

  if (error) {
    console.error('Mention exists check error:', error)
    return false // On error, allow creation (will fail on unique constraint if duplicate)
  }

  return data !== null
}

/**
 * Retrieves mentions for the authenticated user.
 * Supports filtering by status and product.
 */
export async function getMentions(filters?: {
  status?: MentionStatus
  productId?: string
}): Promise<(Mention & { product_name?: string })[]> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return []
  }

  let query = supabase
    .from('mentions')
    .select(`
      *,
      products!inner(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get mentions error:', error)
    return []
  }

  // Transform to include product_name at top level
  return (data || []).map((mention) => ({
    ...mention,
    product_name: (mention.products as { name: string })?.name,
    products: undefined, // Remove nested products object
  }))
}

/**
 * Retrieves a single mention by ID for the authenticated user.
 */
export async function getMention(id: string): Promise<(Mention & { product_name?: string }) | null> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('mentions')
    .select(`
      *,
      products!inner(name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    console.error('Get mention error:', error)
    return null
  }

  return {
    ...data,
    product_name: (data.products as { name: string })?.name,
    products: undefined,
  }
}

/**
 * Updates the status of a mention.
 * Used for approving, discarding, or regenerating mentions.
 */
export async function updateMentionStatus(
  id: string,
  status: MentionStatus
): Promise<{ success: boolean; error?: string }> {
  // Validate status
  const validationResult = mentionStatusSchema.safeParse(status)
  if (!validationResult.success) {
    return { success: false, error: 'Invalid status' }
  }

  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error: updateError } = await supabase
    .from('mentions')
    .update({
      status: validationResult.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Mention status update error:', updateError)
    return { success: false, error: 'Failed to update mention status' }
  }

  revalidatePath('/mentions')
  revalidatePath(`/mentions/${id}`)

  return { success: true }
}
