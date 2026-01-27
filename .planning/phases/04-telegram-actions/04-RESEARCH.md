# Phase 4: Telegram Notifications and Actions - Research

**Researched:** 2026-01-27
**Domain:** Telegram Bot API, grammy framework, inline keyboards, callback queries
**Confidence:** HIGH

## Summary

This phase implements Telegram notifications for new mentions and enables users to take action (approve, regenerate, discard) directly from Telegram using inline keyboard buttons. The existing grammy bot infrastructure (`src/lib/telegram/bot.ts`) handles the `/start` command for connection; this phase extends it with notification sending and callback query handling.

The architecture follows grammy's standard patterns: use `InlineKeyboard` class for button creation, `bot.callbackQuery()` for handling button presses, and `ctx.answerCallbackQuery()` to acknowledge interactions. Notifications are sent after mentions are created in the monitoring cron, with a 1-2 second delay between messages when batching. The regeneration flow sends a new message (not edit-in-place) and caps at 3 attempts per mention.

**Primary recommendation:** Extend the existing webhook route to handle callback queries, use simple callback data encoding (`action:mentionId` format fits well within 64-byte limit), send notifications with HTML formatting for readability, and track regeneration count in the mentions table.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammy | ^1.39.3 | Telegram Bot framework | Already in project, TypeScript-native, modern middleware |
| InlineKeyboard | Built-in | Button creation | grammy's built-in class, chainable API |
| webhookCallback | Built-in | Next.js integration | Already configured at `/api/telegram/webhook` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.91.0 | Database operations | Already in project, service role for webhook context |
| openai | ^6.16.0 | Regenerate draft replies | Reuse existing `generateDraftReply` function |

### No New Dependencies Required

This phase reuses existing dependencies:
- `grammy` for Telegram (existing)
- `@supabase/supabase-js` for database (existing, service role client already in bot.ts)
- `openai` for reply regeneration (existing)

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── telegram/
│       ├── bot.ts              # Extend: add callback handlers
│       └── notifications.ts    # NEW: notification sending functions
├── app/
│   └── api/
│       ├── telegram/
│       │   └── webhook/
│       │       └── route.ts    # Already exists, handlers auto-registered
│       └── cron/
│           └── monitor/
│               └── route.ts    # Extend: call notification after mention creation
└── types/
    └── database.ts             # Extend: add regeneration_count to Mention
```

### Pattern 1: Inline Keyboard Creation

**What:** Create action buttons that appear below notification messages
**When to use:** Every mention notification needs approve/regenerate/discard buttons

**Example:**
```typescript
// Source: https://grammy.dev/plugins/keyboard
import { InlineKeyboard } from 'grammy'

function createMentionKeyboard(mentionId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('Approve', `approve:${mentionId}`)
    .text('Regenerate', `regen:${mentionId}`)
    .text('Discard', `discard:${mentionId}`)
}
```

### Pattern 2: Callback Query Handling

**What:** Handle button presses with specific callback data patterns
**When to use:** Each action button needs a corresponding handler

**Example:**
```typescript
// Source: https://grammy.dev/plugins/keyboard
// Register handlers in bot.ts (before webhookCallback is created)

// Handle approve button
bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
  const mentionId = ctx.match[1]
  // Update mention status in database
  await updateMentionStatus(mentionId, 'approved')
  // Acknowledge the callback
  await ctx.answerCallbackQuery({ text: 'Mention approved!' })
  // Optionally update the message
  await ctx.editMessageReplyMarkup({ reply_markup: undefined })
})

// Handle all unmatched callbacks (prevents loading spinner)
bot.on('callback_query:data', async (ctx) => {
  console.warn('Unknown callback:', ctx.callbackQuery.data)
  await ctx.answerCallbackQuery()
})
```

### Pattern 3: HTML Message Formatting

**What:** Format notification messages for readability
**When to use:** All mention notifications

**Example:**
```typescript
// Source: https://core.telegram.org/bots/api#html-style
function formatMentionNotification(mention: Mention): string {
  // HTML tags supported: <b>, <i>, <a>, <code>, <pre>
  // Characters to escape: < > & (only outside tags)
  const escapedTitle = escapeHtml(mention.reddit_title)
  const escapedDraft = escapeHtml(mention.draft_reply || 'No draft available')

  return `<b>New opportunity found!</b>

<b>Subreddit:</b> r/${mention.reddit_subreddit}
<b>Title:</b> ${escapedTitle}

<b>Draft reply:</b>
${escapedDraft}

<a href="${mention.reddit_permalink}">View original post</a>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
```

### Pattern 4: Sending Notifications

**What:** Send formatted messages with inline keyboards to user's Telegram
**When to use:** After mention is created in monitoring cron

**Example:**
```typescript
// Source: grammy documentation
import { bot } from '@/lib/telegram/bot'

interface SendNotificationResult {
  success: boolean
  error?: string
}

async function sendMentionNotification(
  chatId: number,
  mention: Mention
): Promise<SendNotificationResult> {
  if (!bot) {
    return { success: false, error: 'Bot not configured' }
  }

  try {
    await bot.api.sendMessage(chatId, formatMentionNotification(mention), {
      parse_mode: 'HTML',
      reply_markup: createMentionKeyboard(mention.id),
      link_preview_options: { is_disabled: true }, // Prevent preview of Reddit link
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Send failed'
    }
  }
}
```

### Pattern 5: Regeneration with New Message

**What:** Generate new draft and send as separate message (per CONTEXT.md decision)
**When to use:** User taps "Regenerate" button

**Example:**
```typescript
// Handle regenerate button
bot.callbackQuery(/^regen:(.+)$/, async (ctx) => {
  const mentionId = ctx.match[1]

  // Fetch mention and check regeneration count
  const mention = await getMentionById(mentionId)
  if (!mention) {
    await ctx.answerCallbackQuery({ text: 'Mention not found' })
    return
  }

  if (mention.regeneration_count >= 3) {
    await ctx.answerCallbackQuery({
      text: 'Regeneration limit reached (3 attempts). You can still approve or discard.',
      show_alert: true
    })
    return
  }

  // Show "working" feedback
  await ctx.answerCallbackQuery({ text: 'Generating new draft...' })

  // Fetch required context and regenerate
  const product = await getProductById(mention.product_id)
  const persona = await getPersonaByUserId(mention.user_id)

  const result = await generateDraftReply(
    { title: mention.reddit_title, content: mention.reddit_content || '' },
    { name: product.name, description: product.description || '', url: product.url || undefined },
    persona
  )

  if (!result.success || !result.data) {
    await ctx.reply('Failed to generate new draft. Please try again.')
    return
  }

  // Update mention with new draft and increment count
  await updateMentionDraft(mentionId, result.data.reply, mention.regeneration_count + 1)

  // Send NEW message with updated draft (don't edit original)
  const attemptLabel = mention.regeneration_count + 1 === 3 ? ' (final attempt)' : ''
  await ctx.reply(
    `<b>New draft${attemptLabel}:</b>\n\n${escapeHtml(result.data.reply)}`,
    {
      parse_mode: 'HTML',
      reply_markup: createMentionKeyboard(mentionId),
    }
  )
})
```

### Pattern 6: Callback Data Encoding

**What:** Encode action and identifier in 64-byte callback_data limit
**When to use:** All inline keyboard buttons

**Recommended format:** `action:uuid` where action is short prefix
- `approve:550e8400-e29b-41d4-a716-446655440000` = 44 bytes (well under limit)
- `regen:550e8400-e29b-41d4-a716-446655440000` = 42 bytes
- `discard:550e8400-e29b-41d4-a716-446655440000` = 44 bytes

**No compression needed** - UUIDs fit comfortably within 64-byte limit with simple prefixes.

### Anti-Patterns to Avoid

- **Don't edit messages for regeneration**: CONTEXT.md specifies send new message instead
- **Don't use MarkdownV2**: Requires extensive escaping; HTML is simpler and sufficient
- **Don't forget answerCallbackQuery**: Loading spinner persists until acknowledged
- **Don't register handlers inside route handler**: Register once at module load
- **Don't skip rate limiting for batch notifications**: Respect 1 msg/sec per chat limit

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button layout | Manual JSON construction | `InlineKeyboard` class | Chainable, type-safe, handles escaping |
| Callback routing | String parsing in single handler | `bot.callbackQuery(/regex/)` | Pattern matching, capture groups |
| Message formatting | String concatenation | HTML with escapeHtml helper | Consistent, handles edge cases |
| Webhook handling | Manual request parsing | `webhookCallback(bot, 'std/http')` | Already configured, handles signature |
| Draft regeneration | New AI function | Existing `generateDraftReply` | Already implemented with persona support |

**Key insight:** grammy's built-in patterns handle the complexity. Focus on business logic (what happens on approve/regenerate/discard), not Telegram protocol details.

## Common Pitfalls

### Pitfall 1: Callback Query Not Answered
**What goes wrong:** Loading spinner never stops on button
**Why it happens:** Handler throws error before `answerCallbackQuery()`
**How to avoid:** Always call `answerCallbackQuery()` in try/catch finally block
**Warning signs:** Users report buttons seem "stuck"

### Pitfall 2: Rate Limiting on Batch Notifications
**What goes wrong:** Some notifications fail with 429 errors
**Why it happens:** Sending multiple notifications without delay
**How to avoid:** Add 1-2 second delay between messages per CONTEXT.md
**Warning signs:** Intermittent notification failures, 429 errors in logs

### Pitfall 3: HTML Escaping Failures
**What goes wrong:** Messages fail to send or display incorrectly
**Why it happens:** Unescaped `<`, `>`, or `&` in user content (Reddit titles)
**How to avoid:** Always escape user content with `escapeHtml()` before embedding
**Warning signs:** Parse errors, truncated messages

### Pitfall 4: Handlers Registered Multiple Times
**What goes wrong:** Callbacks execute multiple times
**Why it happens:** Registering handlers inside request handler (runs on each request)
**How to avoid:** Register handlers at module top level, before webhook export
**Warning signs:** Duplicate database updates, multiple reply messages

### Pitfall 5: Missing Telegram Connection
**What goes wrong:** Notification silently fails
**Why it happens:** User hasn't connected Telegram yet
**How to avoid:** Check for telegram_connection before attempting send, skip gracefully
**Warning signs:** Mentions exist but no notifications received

### Pitfall 6: Service Role Client in Callback Handlers
**What goes wrong:** RLS blocks database operations in webhook context
**Why it happens:** Using user-scoped client in unauthenticated webhook context
**How to avoid:** Use service role client (already set up in bot.ts) for webhook operations
**Warning signs:** Permission denied errors in callback handlers

## Code Examples

### Complete Notification Module

```typescript
// src/lib/telegram/notifications.ts
import { bot } from './bot'
import { InlineKeyboard } from 'grammy'
import type { Mention } from '@/types/database'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatMentionNotification(mention: Mention): string {
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

function createMentionKeyboard(mentionId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('Approve', `approve:${mentionId}`)
    .text('Regenerate', `regen:${mentionId}`)
    .text('Discard', `discard:${mentionId}`)
}

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

// Helper for batch sending with rate limiting
export async function sendBatchNotifications(
  chatId: number,
  mentions: Mention[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const mention of mentions) {
    const result = await sendMentionNotification(chatId, mention)
    if (result.success) {
      sent++
    } else {
      failed++
    }

    // Rate limit: 1-2 second delay between messages
    if (mentions.indexOf(mention) < mentions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  return { sent, failed }
}
```

### Callback Handlers Registration

```typescript
// src/lib/telegram/bot.ts (extend existing)
import { Bot, InlineKeyboard } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { generateDraftReply } from '@/lib/openai/client'

// ... existing bot setup code ...

if (bot && supabase) {
  // ... existing /start handler ...

  // Handle approve button
  bot.callbackQuery(/^approve:(.+)$/, async (ctx) => {
    const mentionId = ctx.match[1]

    try {
      const { error } = await supabase
        .from('mentions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', mentionId)

      if (error) throw error

      await ctx.answerCallbackQuery({ text: 'Approved! Ready to post.' })
      // Remove buttons after action
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    } catch (error) {
      console.error('Approve error:', error)
      await ctx.answerCallbackQuery({ text: 'Failed to approve. Try again.' })
    }
  })

  // Handle discard button
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

  // Handle regenerate button
  bot.callbackQuery(/^regen:(.+)$/, async (ctx) => {
    const mentionId = ctx.match[1]

    try {
      // Fetch mention with product and persona
      const { data: mention, error: fetchError } = await supabase
        .from('mentions')
        .select(`
          *,
          products!inner(name, description, url),
          personas:user_id(expertise, tone, phrases_to_avoid)
        `)
        .eq('id', mentionId)
        .single()

      if (fetchError || !mention) {
        await ctx.answerCallbackQuery({ text: 'Mention not found.' })
        return
      }

      const regenCount = mention.regeneration_count || 0
      if (regenCount >= 3) {
        await ctx.answerCallbackQuery({
          text: 'Regeneration limit reached (3 attempts). You can still approve or discard.',
          show_alert: true,
        })
        return
      }

      await ctx.answerCallbackQuery({ text: 'Generating new draft...' })

      // Generate new draft
      const result = await generateDraftReply(
        { title: mention.reddit_title, content: mention.reddit_content || '' },
        {
          name: mention.products.name,
          description: mention.products.description || '',
          url: mention.products.url || undefined,
        },
        mention.personas || {}
      )

      if (!result.success || !result.data) {
        await ctx.reply('Failed to generate new draft. Please try again.')
        return
      }

      // Update mention
      await supabase
        .from('mentions')
        .update({
          draft_reply: result.data.reply,
          regeneration_count: regenCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentionId)

      // Send new message with updated draft
      const attemptLabel = regenCount + 1 === 3 ? ' (final attempt)' : ` (attempt ${regenCount + 2}/3)`
      const keyboard = new InlineKeyboard()
        .text('Approve', `approve:${mentionId}`)
        .text(regenCount + 1 < 3 ? 'Regenerate' : 'Regenerate', `regen:${mentionId}`)
        .text('Discard', `discard:${mentionId}`)

      await ctx.reply(
        `<b>New draft${attemptLabel}:</b>\n\n${escapeHtml(result.data.reply)}`,
        { parse_mode: 'HTML', reply_markup: keyboard }
      )
    } catch (error) {
      console.error('Regenerate error:', error)
      await ctx.answerCallbackQuery({ text: 'Error generating draft.' })
    }
  })

  // Catch-all for unknown callbacks (prevents stuck loading)
  bot.on('callback_query:data', async (ctx) => {
    console.warn('Unknown callback query:', ctx.callbackQuery.data)
    await ctx.answerCallbackQuery()
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
```

### Integration with Monitoring Cron

```typescript
// src/app/api/cron/monitor/route.ts (extend existing)
import { sendMentionNotification } from '@/lib/telegram/notifications'

// After creating mention, send notification
if (mentionResult.success && mentionResult.id) {
  stats.mentions_created++

  // Get user's telegram connection
  const { data: telegramConnection } = await supabase
    .from('telegram_connections')
    .select('telegram_chat_id')
    .eq('user_id', product.user_id)
    .single()

  if (telegramConnection?.telegram_chat_id) {
    // Fetch full mention for notification
    const { data: fullMention } = await supabase
      .from('mentions')
      .select('*')
      .eq('id', mentionResult.id)
      .single()

    if (fullMention) {
      await sendMentionNotification(telegramConnection.telegram_chat_id, fullMention)

      // Rate limit between notifications
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual button JSON | `InlineKeyboard` class | grammy 1.0+ | Type-safe, chainable |
| String callback routing | Regex pattern matching | grammy 1.0+ | Cleaner handler registration |
| Markdown formatting | HTML formatting | Always preferred | Simpler escaping rules |
| Edit message for updates | New message (per CONTEXT) | Project decision | Better UX, preserves history |

**Deprecated/outdated:**
- `parse_mode: "Markdown"` (legacy) - Use `"HTML"` or `"MarkdownV2"` instead
- Manual JSON for reply_markup - Use `InlineKeyboard` class

## Open Questions

Things that couldn't be fully resolved:

1. **Quiet Hours Queue Persistence**
   - What we know: CONTEXT.md mentions quiet hours are configurable in Phase 5
   - What's unclear: Whether to queue notifications during quiet hours now or defer
   - Recommendation: Skip notification sending during quiet hours (check before send), defer queue persistence to Phase 5

2. **Message Edit vs New Message for Status Updates**
   - What we know: Regenerate sends new message per CONTEXT.md
   - What's unclear: Should approve/discard also send confirmation message or just remove buttons?
   - Recommendation: Just remove buttons (via `editMessageReplyMarkup`) for approve/discard - minimal and sufficient

3. **Notification Failure Handling**
   - What we know: Telegram API can fail (rate limits, network issues)
   - What's unclear: Should failed notifications be retried or logged for manual check?
   - Recommendation: Log failures, don't retry (mention exists in DB, user can see in web UI)

## Sources

### Primary (HIGH confidence)
- [grammY Keyboard Plugin](https://grammy.dev/plugins/keyboard) - InlineKeyboard API, callback query handling
- [grammY Basics](https://grammy.dev/guide/basics) - Message sending, parse modes
- [Telegram Bot API](https://core.telegram.org/bots/api) - HTML formatting, callback_data limits
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq) - Rate limits (1 msg/sec per chat, 30 msg/sec global)

### Secondary (MEDIUM confidence)
- [grammY Next.js Example](https://www.launchfa.st/blog/telegram-nextjs-app-router) - webhookCallback setup pattern
- [grammY Context Reference](https://grammy.dev/ref/core/context) - editMessageText, answerCallbackQuery methods

### Tertiary (LOW confidence)
- Community discussions on callback_data encoding - UUIDs confirmed to fit within 64-byte limit

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - grammy already in project, patterns documented
- Architecture: HIGH - Extends existing bot.ts and webhook route
- Pitfalls: HIGH - Common issues well-documented in grammy docs and Telegram FAQ

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable domain, grammy API mature)
