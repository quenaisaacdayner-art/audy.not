---
phase: 02-onboarding-and-products
plan: 02
subsystem: telegram-integration
tags: [telegram, grammy, webhooks, deep-links, bot]

dependency-graph:
  requires: [02-01]
  provides: [telegram-bot, webhook-handler, deep-link-generator]
  affects: [02-03, 02-06, 02-08]

tech-stack:
  added: []
  patterns:
    - grammY webhookCallback for Next.js App Router
    - Deep link authentication with connection tokens
    - Nullable bot pattern for optional env vars

key-files:
  created:
    - src/lib/telegram/bot.ts
    - src/app/api/telegram/webhook/route.ts
  modified:
    - src/types/database.ts
    - .env.local.example

decisions:
  - decision: Make bot nullable when env vars missing
    rationale: Allows development without Telegram configuration
    phase: 02-02

metrics:
  duration: ~5 minutes
  tasks: 3/3
  completed: 2026-01-22
---

# Phase 02 Plan 02: Telegram Bot Setup Summary

**One-liner:** grammY Telegram bot with /start deep link handler, webhook endpoint, and graceful fallback when credentials unavailable.

## What Was Built

### Task 1: Telegram Bot Instance and Handlers
Created `src/lib/telegram/bot.ts` with:

1. **Bot instance** - grammY Bot with conditional creation
   - Only creates bot if `TELEGRAM_BOT_TOKEN` is set
   - Uses `createClient` from `@supabase/supabase-js` with service role key
   - Logs warning instead of throwing when env vars missing

2. **/start command handler** - Deep link authentication flow
   - Extracts payload from `ctx.match` (deep link parameter)
   - If no payload: replies asking user to use app link
   - If payload exists:
     - Queries `telegram_connection_tokens` table for valid token
     - Checks expiry date, deletes expired tokens
     - Updates or inserts into `telegram_connections` table
     - Deletes used token (single-use security)
     - Sends detailed welcome message

3. **Welcome message** - Explains what to expect
   - Describes notifications for Reddit mentions
   - Lists action buttons: Approve, Regenerate, Discard
   - Reminds user they stay in control
   - Directs user back to app to continue onboarding

4. **generateDeepLink helper** - Creates bot deep links
   - Format: `https://t.me/{botUsername}?start={token}`
   - Throws if `TELEGRAM_BOT_USERNAME` not set

### Task 2: Telegram Webhook Route
Created `src/app/api/telegram/webhook/route.ts` with:

- `dynamic = 'force-dynamic'` - Prevents Next.js caching
- `fetchCache = 'force-no-store'` - Ensures fresh responses
- `POST` handler using grammY's `webhookCallback`
- Graceful fallback: returns 503 if bot not configured

### Task 3: Environment Variables
Updated `.env.local.example` with:

- `SUPABASE_SERVICE_ROLE_KEY` - Required for webhook handler
- `TELEGRAM_BOT_TOKEN` - From BotFather
- `TELEGRAM_BOT_USERNAME` - Bot username without @

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 104d184 | feat | Create Telegram bot instance with grammY |
| e3d6820 | feat | Create Telegram webhook route |
| 5900f8c | chore | Update environment variables and graceful fallback |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Database type interface for supabase-js**
- **Found during:** Task 1
- **Issue:** Database interface missing required fields for supabase-js v2 typed client
- **Fix:** Added `Relationships`, `Views`, `Functions`, `Enums`, `CompositeTypes` to Database interface
- **Files modified:** `src/types/database.ts`
- **Commit:** 104d184

**2. [Rule 2 - Missing Critical] Made bot nullable for development**
- **Found during:** Task 3 (build verification)
- **Issue:** App wouldn't build/run without Telegram credentials configured
- **Fix:** Made bot creation conditional, webhook returns 503 when unavailable
- **Files modified:** `src/lib/telegram/bot.ts`, `src/app/api/telegram/webhook/route.ts`
- **Commit:** 5900f8c

## User Setup Required

**Create Telegram bot:**

1. Open Telegram and message @BotFather
2. Send `/newbot` and follow prompts
3. Copy the token provided (format: `123456789:ABC-DEF...`)
4. Note the username shown (without @)

**Configure environment:**

```bash
# Add to .env.local
TELEGRAM_BOT_TOKEN=123456789:ABC-DEF...
TELEGRAM_BOT_USERNAME=your_bot_username
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Register webhook (after deployment):**

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/telegram/webhook"
```

**Requirements:**
- HTTPS with valid SSL certificate
- Publicly accessible URL
- For local dev: use ngrok/cloudflared or long polling

## Next Phase Readiness

**Ready for:** 02-03 (Telegram Connection Step)

**Dependencies satisfied:**
- [x] Bot instance with /start handler
- [x] Webhook endpoint for receiving updates
- [x] `generateDeepLink` function for UI
- [x] Connection flow creates/updates `telegram_connections`

**Blockers:** None

## Verification Results

- [x] `src/lib/telegram/bot.ts` exports bot and generateDeepLink
- [x] /start handler validates token, creates connection, sends welcome
- [x] `src/app/api/telegram/webhook/route.ts` exports POST handler
- [x] force-dynamic and fetchCache exports present
- [x] `.env.local.example` includes Telegram variables
- [x] `npm run build` passes

## Files Changed

```
src/lib/telegram/bot.ts                    (created, 158 lines)
src/app/api/telegram/webhook/route.ts      (created, 27 lines)
src/types/database.ts                      (modified, +6 lines)
.env.local.example                         (modified, +10 lines)
```
