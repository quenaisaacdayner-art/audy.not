import type { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { fetchSubredditPosts, filterPostsByKeywords } from '@/lib/reddit/client'
import { classifyPostIntent, generateDraftReply } from '@/lib/openai/client'
import { createMention, checkMentionExists } from '@/actions/mentions'
import { sendMentionNotification } from '@/lib/telegram/notifications'
import type { Mention } from '@/types/database'

export const maxDuration = 60 // Allow up to 60 seconds for processing

interface ProductWithPersona {
  id: string
  user_id: string
  name: string
  description: string | null
  url: string | null
  keywords: string[] | null
  subreddits: string[] | null
}

interface Persona {
  expertise: string | null
  tone: string | null
  phrases_to_avoid: string | null
}

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const stats = { products: 0, posts_found: 0, mentions_created: 0 }
  const debug: string[] = []

  try {
    // 2. Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, user_id, name, description, url, keywords, subreddits')

    if (productsError) {
      console.error('Failed to fetch products:', productsError)
      return Response.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    if (!products?.length) {
      return Response.json({
        success: true,
        message: 'No products to monitor',
        stats,
      })
    }

    stats.products = products.length
    debug.push(`Found ${products.length} products`)

    // 3. Process each product
    for (const product of products as ProductWithPersona[]) {
      debug.push(`Product: ${product.name}, subreddits: ${JSON.stringify(product.subreddits)}`)
      // Skip if no subreddits configured
      if (!product.subreddits?.length) {
        debug.push(`Skipping ${product.name} - no subreddits`)
        continue
      }

      // Fetch persona for this product's user
      const { data: persona } = await supabase
        .from('personas')
        .select('expertise, tone, phrases_to_avoid')
        .eq('user_id', product.user_id)
        .single()

      // Fetch posts from all subreddits
      for (const subreddit of product.subreddits) {
        const fetchResult = await fetchSubredditPosts(subreddit)
        debug.push(`r/${subreddit}: posts=${fetchResult.posts.length}${fetchResult.error ? ` (${fetchResult.error})` : ''}`)
        if (!fetchResult.success) {
          continue
        }

        // Filter by keywords
        const relevant = product.keywords?.length
          ? filterPostsByKeywords(fetchResult.posts, product.keywords)
          : fetchResult.posts

        stats.posts_found += relevant.length

        // Process each relevant post
        for (const post of relevant) {
          // Deduplication check
          const exists = await checkMentionExists(product.id, post.id)
          if (exists) continue

          // Classify intent
          const classification = await classifyPostIntent(
            post.title,
            post.selftext,
            {
              name: product.name,
              description: product.description || '',
              keywords: product.keywords || [],
            }
          )

          if (!classification.success) {
            console.warn(
              `Classification failed for post ${post.id}:`,
              classification.error
            )
            continue
          }

          // Skip not_relevant posts
          if (classification.data?.intent === 'not_relevant') continue

          // Generate draft reply
          const typedPersona: Persona = persona || {
            expertise: null,
            tone: null,
            phrases_to_avoid: null,
          }

          const reply = await generateDraftReply(
            { title: post.title, content: post.selftext },
            {
              name: product.name,
              description: product.description || '',
              url: product.url || undefined,
            },
            typedPersona
          )

          // Create mention (even if reply generation failed - draft_reply can be null)
          const mentionResult = await createMention({
            product_id: product.id,
            user_id: product.user_id,
            reddit_post_id: post.id,
            reddit_permalink: `https://reddit.com${post.permalink}`,
            reddit_title: post.title,
            reddit_content: post.selftext || null,
            reddit_author: post.author,
            reddit_subreddit: post.subreddit,
            reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
            intent: classification.data!.intent as
              | 'pain_point'
              | 'recommendation_request',
            confidence: classification.data!.confidence,
            draft_reply: reply.data?.reply || null,
          })

          if (mentionResult.success && mentionResult.id) {
            stats.mentions_created++

            // Fetch user's telegram connection
            const { data: telegramConnection } = await supabase
              .from('telegram_connections')
              .select('telegram_chat_id')
              .eq('user_id', product.user_id)
              .single()

            if (telegramConnection?.telegram_chat_id) {
              // Fetch the full mention for notification
              const { data: fullMention } = await supabase
                .from('mentions')
                .select('*')
                .eq('id', mentionResult.id)
                .single<Mention>()

              if (fullMention) {
                await sendMentionNotification(telegramConnection.telegram_chat_id, fullMention)

                // Rate limit: 1.5s delay between notifications per CONTEXT.md
                await new Promise(resolve => setTimeout(resolve, 1500))
              }
            }
          }
        }
      }
    }

    // 4. Update monitoring state
    await supabase.from('monitoring_state').upsert({
      id: 1,
      last_checked_at: new Date().toISOString(),
      last_run_stats: stats,
    })

    return Response.json({ success: true, stats, debug })
  } catch (error) {
    console.error('Monitoring error:', error)
    return Response.json(
      { success: false, error: 'Monitoring failed' },
      { status: 500 }
    )
  }
}
