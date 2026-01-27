import { InlineKeyboard } from 'grammy'
import { bot } from './bot'
import type { Mention } from '@/types/database'

/**
 * Escape HTML special characters for Telegram HTML parse mode
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Format a mention notification message with HTML formatting
 */
export function formatMentionNotification(mention: Mention): string {
  const title = escapeHtml(mention.reddit_title)
  const draft = mention.draft_reply
    ? escapeHtml(mention.draft_reply)
    : '<i>Draft generation failed</i>'

  return `<b>New opportunity in r/${mention.reddit_subreddit}</b>

<b>${title}</b>

<b>Suggested reply:</b>
${draft}

<a href="${mention.reddit_permalink}">View on Reddit</a>`
}

/**
 * Create inline keyboard with action buttons for a mention
 */
export function createMentionKeyboard(mentionId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('Approve', `approve:${mentionId}`)
    .text('Regenerate', `regen:${mentionId}`)
    .text('Discard', `discard:${mentionId}`)
}

/**
 * Send a mention notification to a user's Telegram chat
 */
export async function sendMentionNotification(
  chatId: number,
  mention: Mention
): Promise<{ success: boolean; error?: string }> {
  if (!bot) {
    return { success: false, error: 'Bot not configured' }
  }

  try {
    await bot.api.sendMessage(chatId, formatMentionNotification(mention), {
      parse_mode: 'HTML',
      reply_markup: createMentionKeyboard(mention.id),
      link_preview_options: { is_disabled: true },
    })
    return { success: true }
  } catch (error) {
    console.error('Telegram notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send',
    }
  }
}

/**
 * Send batch notifications with rate limiting
 * Adds 1500ms delay between messages to respect Telegram rate limits
 */
export async function sendBatchNotifications(
  chatId: number,
  mentions: Mention[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i]
    const result = await sendMentionNotification(chatId, mention)

    if (result.success) {
      sent++
    } else {
      failed++
    }

    // Rate limit: 1.5 second delay between messages (except after last one)
    if (i < mentions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }

  return { sent, failed }
}
