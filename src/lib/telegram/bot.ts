import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import type { TelegramConnectionToken, TelegramConnection } from '@/types/database'

// Bot instance (use env vars)
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

export const bot = new Bot(token)

// Use service role client for webhook (no user context)
// The webhook handler runs without authentication, so we need direct DB access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Handle /start command with deep link parameter
bot.command('start', async (ctx) => {
  const payload = ctx.match // Contains the connection token from deep link

  if (!payload) {
    await ctx.reply('Please use the connection link from the Audy.not app.')
    return
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
