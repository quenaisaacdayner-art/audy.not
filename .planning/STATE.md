# State: Audy.not

**Session:** 2026-01-27

## Project Reference

**Core Value:** The human stays in the loop. AI curates and drafts; the human approves and posts.

**Current Focus:** Phase 3 COMPLETE. Monitoring engine fully operational.

## Deployment

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/quenaisaacdayner-art/audy.not.git |
| Vercel Production | https://audy-czsgde5bh-quenas-projects-e9d85eb0.vercel.app/ |
| Vercel Env Vars | https://vercel.com/quenas-projects-e9d85eb0/audy-not/settings/environment-variables |

**Testing:** Human verification via Vercel Preview Deployments (not localhost)
**Deploy failures:** Analyze based on Vercel production environment behavior

## Current Position

**Phase:** 3 of 6 (Monitoring Engine) - COMPLETE
**Plan:** 5 of 5 complete
**Status:** Phase complete
**Last activity:** 2026-01-27 - Completed 03-05-PLAN.md (Mentions List and Detail Pages)

**Progress:** [################----] 80%

### Phase 3 Goal
Reddit monitoring engine: poll subreddits, classify intent via AI, generate persona-driven draft replies.

### Phase 3 Progress
1. [x] 03-01: Database Schema for Monitoring
2. [x] 03-02: Reddit Client
3. [x] 03-03: AI Classification and Reply Generation
4. [x] 03-04: Monitoring Cron Job
5. [x] 03-05: Mentions List and Detail Pages

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 3/6 |
| Requirements done | 18/39 |
| Plans executed | 17 |
| Session commits | 43 |

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

### Blockers
| Blocker | Status | Resolution |
|---------|--------|------------|
| (none yet) | | |

## Session Continuity

### What Just Happened
- Executed 03-05-PLAN.md (Mentions List and Detail Pages)
- Created mentions list page with status filter tabs
- Created mention detail page with draft reply display
- Added CopyReplyButton client component for clipboard
- "Last checked: X ago" displays from monitoring_state
- Phase 3 complete
- Commits: 3c3ac7c, 2bf32c8

### What Happens Next
- Phase 4: Telegram Actions
- Execute 04-01: Telegram Notification Handler
- Execute 04-02: Mention Action Buttons

### Context for Next Session
- All planning artifacts in `.planning/` directory
- Tech stack: Next.js 16, TypeScript, Supabase, Tailwind 4, shadcn/ui
- Phase 2 dependencies: grammy, Firecrawl SDK, OpenAI SDK, qrcode.react
- AI clients: src/lib/firecrawl/client.ts, src/lib/openai/client.ts
- Reddit client: src/lib/reddit/client.ts
- Telegram bot: src/lib/telegram/bot.ts exports bot + generateDeepLink
- Mention types: src/types/database.ts (Mention, MonitoringState)
- Zod schemas: src/lib/validations/mention.ts (PostIntentSchema, DraftReplySchema)
- AI functions: classifyPostIntent, generateDraftReply in src/lib/openai/client.ts
- Migration pending: supabase/migrations/00003_mentions.sql
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
*Last updated: 2026-01-27 (Phase 3 complete)*
