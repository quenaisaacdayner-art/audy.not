import { Bot, InlineKeyboard } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import type { TelegramConnectionToken, TelegramConnection, Mention, Product, Persona } from '@/types/database'
import { generateDraftReply } from '@/lib/openai/client'
import { escapeHtml } from './notifications'

// Bot instance (use env vars)
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN not set - Telegram bot will not be available')
}

// Use service role client for webhook (no user context)
// The webhook handler runs without authentication, so we need direct DB access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not set - Telegram integration will not work')
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

const supabase = createSupabaseClient()

// Create bot only if token is available
export const bot = token ? new Bot(token) : null

// Set up handlers only if bot and supabase are available
if (bot && supabase) {
  // Handle /start command with deep link parameter
  bot.command('start', async (ctx) => {
    let payload = ctx.match // Contains the connection token from deep link

    // If no payload (e.g. user opened bot via QR code and Telegram didn't pass the token),
    // try to find the most recent pending connection token
    if (!payload) {
      const { data: pendingToken } = await supabase
        .from('telegram_connection_tokens')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single<TelegramConnectionToken>()

      if (pendingToken) {
        payload = pendingToken.token
      } else {
        await ctx.reply(
          'Welcome to Audy.not!\n\nTo connect your account, open the Audy.not app and go to the Telegram connection step. Then scan the QR code or click the link provided.'
        )
        return
      }
    }

    try {
      // Verify token is valid and not expired
      const { data: tokenData, error: tokenError } = await supabase
        .from('telegram_connection_tokens')
        .select('*')
        .eq('token', payload)
        .single<TelegramConnectionToken>()

      if (tokenError || !tokenData) {
        console.error('Token lookup error:', tokenError)
        await ctx.reply(
          'This connection link is invalid or has expired. Please generate a new link from the Audy.not app.'
        )
        return
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at)
      if (expiresAt < new Date()) {
        // Delete expired token
        await supabase
          .from('telegram_connection_tokens')
          .delete()
          .eq('token', payload)

        await ctx.reply(
          'This connection link has expired. Please generate a new link from the Audy.not app.'
        )
        return
      }

      // Check if user already has a telegram connection
      const { data: existingConnection } = await supabase
        .from('telegram_connections')
        .select('id')
        .eq('user_id', tokenData.user_id)
        .single<Pick<TelegramConnection, 'id'>>()

      if (existingConnection) {
        // Update existing connection
        const { error: updateError } = await supabase
          .from('telegram_connections')
          .update({
            telegram_chat_id: ctx.chat.id,
            telegram_user_id: ctx.from?.id ?? null,
          })
          .eq('user_id', tokenData.user_id)

        if (updateError) {
          console.error('Connection update error:', updateError)
          await ctx.reply(
            'Failed to update your connection. Please try again from the app.'
          )
          return
        }
      } else {
        // Create new connection
        const { error: insertError } = await supabase
          .from('telegram_connections')
          .insert({
            user_id: tokenData.user_id,
            telegram_chat_id: ctx.chat.id,
            telegram_user_id: ctx.from?.id ?? null,
          })

        if (insertError) {
          console.error('Connection insert error:', insertError)
          await ctx.reply(
            'Failed to create connection. Please try again from the app.'
          )
          return
        }
      }

      // Delete the used token (single-use)
      await supabase
        .from('telegram_connection_tokens')
        .delete()
        .eq('token', payload)

      // Send welcome message
      await ctx.reply(
        `Welcome to Audy.not!

Your account is now connected. Here's what to expect:

You'll receive notifications when someone on Reddit mentions topics relevant to your products. Each notification shows you the post or comment along with a suggested reply written in your voice.

What you can do with each notification:

- Approve: Post the suggested reply as-is
- Regenerate: Get a new suggested reply with different wording
- Discard: Skip this mention and move on

Remember: You stay in control. Every reply is a suggestion that you approve or customize before it goes live.

Please return to the Audy.not app to continue your onboarding.`
      )
    } catch (error) {
      console.error('Telegram bot error:', error)
      await ctx.reply(
        'An unexpected error occurred. Please try again from the app.'
      )
    }
  })

  // Handle approve callback
  bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
    const mentionId = ctx.match[1]
    try {
      const { error } = await supabase
        .from('mentions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', mentionId)

      if (error) throw error

      await ctx.answerCallbackQuery({ text: 'Approved! Ready to post.' })
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    } catch (error) {
      console.error('Approve error:', error)
      await ctx.answerCallbackQuery({ text: 'Failed to approve. Try again.' })
    }
  })

  // Handle discard callback
  bot.callbackQuery(/^discard:(.+)$/, async (ctx) => {
    const mentionId = ctx.match[1]
    try {
      const { error } = await supabase
        .from('mentions')
        .update({ status: 'discarded', updated_at: new Date().toISOString() })
        .eq('id', mentionId)

      if (error) throw error

      await ctx.answerCallbackQuery({ text: 'Discarded.' })
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    } catch (error) {
      console.error('Discard error:', error)
      await ctx.answerCallbackQuery({ text: 'Failed to discard. Try again.' })
    }
  })

  // Handle regenerate callback
  bot.callbackQuery(/^regen:(.+)$/, async (ctx) => {
    const mentionId = ctx.match[1]
    try {
      // Fetch mention with product details
      const { data: mention, error: mentionError } = await supabase
        .from('mentions')
        .select('*, products(name, description, url)')
        .eq('id', mentionId)
        .single<Mention & { products: Pick<Product, 'name' | 'description' | 'url'> }>()

      if (mentionError || !mention) {
        await ctx.answerCallbackQuery({ text: 'Mention not found.' })
        return
      }

      // Check regeneration limit
      if (mention.regeneration_count >= 3) {
        await ctx.answerCallbackQuery({
          text: 'Regeneration limit reached (3/3). You can still approve or discard.',
          show_alert: true,
        })
        return
      }

      // Show generating feedback
      await ctx.answerCallbackQuery({ text: 'Generating new draft...' })

      // Fetch persona for the user
      const { data: persona } = await supabase
        .from('personas')
        .select('expertise, tone, phrases_to_avoid')
        .eq('user_id', mention.user_id)
        .single<Pick<Persona, 'expertise' | 'tone' | 'phrases_to_avoid'>>()

      // Generate new draft
      const product = mention.products
      const reply = await generateDraftReply(
        { title: mention.reddit_title, content: mention.reddit_content || '' },
        {
          name: product.name,
          description: product.description || '',
          url: product.url || undefined,
        },
        persona || { expertise: null, tone: null, phrases_to_avoid: null }
      )

      if (!reply.success || !reply.data) {
        await ctx.reply('Failed to generate new draft. Please try again.')
        return
      }

      // Update mention with new draft and increment regeneration_count
      const newCount = mention.regeneration_count + 1
      const { error: updateError } = await supabase
        .from('mentions')
        .update({
          draft_reply: reply.data.reply,
          regeneration_count: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentionId)

      if (updateError) {
        console.error('Update error:', updateError)
        await ctx.reply('Failed to save new draft. Please try again.')
        return
      }

      // Format attempt label
      const attemptLabel = newCount === 3 ? '(final attempt)' : `(attempt ${newCount}/3)`

      // Build new message with updated draft
      const title = escapeHtml(mention.reddit_title)
      const draft = escapeHtml(reply.data.reply)
      const message = `<b>New opportunity in r/${mention.reddit_subreddit}</b> ${attemptLabel}

<b>${title}</b>

<b>Suggested reply:</b>
${draft}

<a href="${mention.reddit_permalink}">View on Reddit</a>`

      // Create new keyboard (same buttons)
      const keyboard = new InlineKeyboard()
        .text('Approve', `approve:${mentionId}`)
        .text('Regenerate', `regen:${mentionId}`)
        .text('Discard', `discard:${mentionId}`)

      // Send new message (not edit)
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true },
      })
    } catch (error) {
      console.error('Regenerate error:', error)
      await ctx.reply('An error occurred while regenerating. Please try again.')
    }
  })

  // Catch-all callback handler (prevents stuck loading spinner)
  bot.on('callback_query:data', async (ctx) => {
    console.warn('Unknown callback query:', ctx.callbackQuery.data)
    await ctx.answerCallbackQuery()
  })
}

/**
 * Generate a Telegram deep link for the bot
 * @param connectionToken - The unique token to identify the connection attempt
 * @returns The deep link URL that opens Telegram and starts the bot with the token
 */
export function generateDeepLink(connectionToken: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) {
    throw new Error('TELEGRAM_BOT_USERNAME is not set')
  }
  return `https://t.me/${botUsername}?start=${connectionToken}`
}
