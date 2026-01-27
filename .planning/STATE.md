# State: Audy.not

**Session:** 2026-01-27

## Project Reference

**Core Value:** The human stays in the loop. AI curates and drafts; the human approves and posts.

**Current Focus:** Phase 4 in progress. Telegram notification infrastructure ready.

## Deployment

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/quenaisaacdayner-art/audy.not.git |
| Vercel Production | https://audy-czsgde5bh-quenas-projects-e9d85eb0.vercel.app/ |
| Vercel Env Vars | https://vercel.com/quenas-projects-e9d85eb0/audy-not/settings/environment-variables |

**Testing:** Human verification via Vercel Preview Deployments (not localhost)
**Deploy failures:** Analyze based on Vercel production environment behavior

## Current Position

**Phase:** 4 of 6 (Telegram Notifications and Actions)
**Plan:** 1 of 2 complete
**Status:** In progress
**Last activity:** 2026-01-27 - Completed 04-01-PLAN.md (Telegram Notification Handler)

**Progress:** [#################---] 85%

### Phase 4 Goal
Deliver mentions to users via Telegram and enable in-chat actions (approve, regenerate, discard).

### Phase 4 Progress
1. [x] 04-01: Telegram Notification Handler
2. [ ] 04-02: Mention Action Buttons (callback handlers)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 3/6 |
| Requirements done | 19/39 |
| Plans executed | 18 |
| Session commits | 46 |

## Accumulated Context

### Key Decisions
| Decision | Rationale | Phase |
|----------|-----------|-------|
| Next.js 16.1.4 | Latest stable at scaffold time | 1 |
| Tailwind CSS 4 | create-next-app default, CSS variables | 1 |
| shadcn New York style | Clean SaaS appearance | 1 |
| getUser() over getSession() | Validates token with Supabase Auth server, more secure | 1 |
| Middleware pattern (not proxy) | Still works in Next.js 16, follows Supabase docs | 1 |
| RLS user isolation | Users can only access their own profile row | 1 |
| Trigger-based profile creation | Auto-create profile on auth signup | 1 |
| Server Actions with Zod | Native form handling with validation | 1 |
| Generic auth error messages | Security - don't reveal if email exists | 1 |
| Simple layout auth check | Layout only checks auth, onboarding check in pages | 1 |
| Suspense for search params | Required by Next.js for client components | 1 |
| grammy for Telegram | TypeScript-native, modern middleware, excellent docs | 2 |
| Firecrawl for scraping | Official SDK, handles anti-bot, JS rendering | 2 |
| openai with zodResponseFormat | Type-safe structured outputs | 2 |
| One persona per user | UNIQUE(user_id) constraint on personas table | 2 |
| Nullable bot pattern | Allows dev without Telegram config, returns 503 | 2 |
| gpt-4o-mini for products | Cost efficient for product analysis | 2 |
| Result pattern for APIs | {success, data, error} structure for all external APIs | 2 |
| Manual connection check | No websocket/polling for Telegram, user clicks button | 2 |
| 30-minute token expiry | Balance security and convenience for Telegram connection | 2 |
| Comma-separated tag input | User types comma-separated keywords/subreddits, shown as editable badges | 2 |
| Toast + inline error | Dual feedback (toast + inline warning) when AI generation fails | 2 |
| Server-client split | Server page loads state, client component manages transitions | 2 |
| Fixed step order | Product -> Telegram -> Persona, no backwards navigation | 2 |
| Delete confirmation dialog | AlertDialog for destructive actions to prevent accidental data loss | 2 |
| Edit form pattern reuse | Comma-separated inputs with badges, consistent with onboarding | 2 |
| Silent skip 403/404 | Private/banned subreddits return empty posts, not errors | 3 |
| User-Agent for Reddit | AudyBot/1.0 (Reddit Monitoring) - required by Reddit API | 3 |
| Composite dedup key | UNIQUE(product_id, reddit_post_id) for mentions deduplication | 3 |
| Monitoring state singleton | Single row tracks last run with CHECK(id = 1) | 3 |
| Service role only state | No RLS on monitoring_state, cron uses service role | 3 |
| Balanced AI strictness | Show all pain_point/recommendation_request posts, user discards irrelevant | 3 |
| Adaptive reply length | Match reply length to post length (<200/200-500/>500 chars) | 3 |
| Soft product mention | Help-first approach, subtle mention at end | 3 |
| Client-side status filtering | Simple UX, no server round-trips for filter changes | 3 |
| Copy reply client component | Clipboard API requires client-side JS | 3 |
| Simple callback data format | action:uuid fits within 64-byte Telegram limit | 4 |
| 1500ms batch delay | Rate limiting for Telegram (1 msg/sec per chat) | 4 |

### Technical Debt
| Item | Priority | Phase |
|------|----------|-------|
| (none yet) | | |

### Discovered TODOs
| TODO | Context | Phase |
|------|---------|-------|
| Execute SQL migration | Run 00001_profiles.sql in Supabase Dashboard | 1 |
| Configure Google OAuth | Add callback URL in Google Cloud Console | 1 |
| Execute Phase 2 migration | Run 00002_phase2_tables.sql in Supabase Dashboard | 2 |
| Create Telegram bot | Via @BotFather, get token and username | 2 |
| Register webhook | curl API to setWebhook after deployment | 2 |
| Get Firecrawl API key | Sign up at firecrawl.dev | 2 |
| Get OpenAI API key | Create at platform.openai.com | 2 |
| Execute Phase 3 migration | Run 00003_mentions.sql in Supabase Dashboard | 3 |
| Execute Phase 4 migration | Run 00004_regeneration_count.sql in Supabase Dashboard | 4 |

### Blockers
| Blocker | Status | Resolution |
|---------|--------|------------|
| (none yet) | | |

## Session Continuity

### What Just Happened
- Executed 04-01-PLAN.md (Telegram Notification Handler)
- Created migration for regeneration_count column on mentions table
- Updated Mention type with regeneration_count field
- Created notification module with HTML formatting and inline keyboard
- sendMentionNotification and sendBatchNotifications ready for integration
- Commits: 7bbaa83, e9c4a49, 4074e57

### What Happens Next
- Execute 04-02: Mention Action Buttons (callback handlers for approve/regen/discard)
- Integrate notification sending with monitoring cron

### Context for Next Session
- All planning artifacts in `.planning/` directory
- Tech stack: Next.js 16, TypeScript, Supabase, Tailwind 4, shadcn/ui
- Phase 2 dependencies: grammy, Firecrawl SDK, OpenAI SDK, qrcode.react
- AI clients: src/lib/firecrawl/client.ts, src/lib/openai/client.ts
- Reddit client: src/lib/reddit/client.ts
- Telegram bot: src/lib/telegram/bot.ts exports bot + generateDeepLink
- Telegram notifications: src/lib/telegram/notifications.ts exports sendMentionNotification, sendBatchNotifications
- Mention types: src/types/database.ts (Mention with regeneration_count, MonitoringState)
- Zod schemas: src/lib/validations/mention.ts (PostIntentSchema, DraftReplySchema)
- AI functions: classifyPostIntent, generateDraftReply in src/lib/openai/client.ts
- Migrations pending: 00003_mentions.sql, 00004_regeneration_count.sql
- Mentions UI:
  - src/app/(protected)/mentions/page.tsx (list)
  - src/app/(protected)/mentions/mentions-list.tsx (client filtering)
  - src/app/(protected)/mentions/[id]/page.tsx (detail)
  - src/app/(protected)/mentions/[id]/copy-reply-button.tsx (copy)
- Onboarding flow complete (all in src/app/(protected)/onboarding/)
- Product CRUD complete:
  - src/actions/products.ts (full CRUD + AI generation)
  - src/app/(protected)/products/page.tsx (list)
  - src/app/(protected)/products/[id]/page.tsx (detail)
  - src/app/(protected)/products/[id]/edit/page.tsx (edit)
- Auth flow complete from Phase 1
- Mode: yolo (minimal confirmations)
- Depth: standard

---
*State initialized: 2026-01-19*
*Last updated: 2026-01-27 (04-01 complete)*
