# State: Audy.not

**Session:** 2026-01-23

## Project Reference

**Core Value:** The human stays in the loop. AI curates and drafts; the human approves and posts.

**Current Focus:** Phase 2 in progress - Onboarding and Products. Plan 08 (Product CRUD Pages) complete.

## Deployment

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/quenaisaacdayner-art/audy.not.git |
| Vercel Production | https://audy-czsgde5bh-quenas-projects-e9d85eb0.vercel.app/ |
| Vercel Env Vars | https://vercel.com/quenas-projects-e9d85eb0/audy-not/settings/environment-variables |

**Testing:** Human verification via Vercel Preview Deployments (not localhost)
**Deploy failures:** Analyze based on Vercel production environment behavior

## Current Position

**Phase:** 2 of 6 (Onboarding and Products)
**Plan:** 8 of 9 complete
**Status:** In progress
**Last activity:** 2026-01-23 - Completed 02-08-PLAN.md

**Progress:** [########--] 80%

### Phase 2 Goal
Multi-step onboarding flow: Persona -> Telegram -> Product with AI-assisted product generation.

### Phase 2 Progress
1. [x] 02-01: Database Setup and Dependencies
2. [x] 02-02: Telegram Bot Setup
3. [x] 02-03: AI Clients Setup (Firecrawl + OpenAI)
4. [x] 02-04: Persona Step UI
5. [x] 02-05: Telegram Connection Step
6. [x] 02-06: Product Step with URL Scraping
7. [x] 02-07: Onboarding Flow Integration
8. [x] 02-08: Product CRUD Pages
9. [ ] 02-09: Settings Page

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 1/6 |
| Requirements done | 8/39 |
| Plans executed | 13 |
| Session commits | 34 |

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

### Blockers
| Blocker | Status | Resolution |
|---------|--------|------------|
| (none yet) | | |

## Session Continuity

### What Just Happened
- Fixed onboarding step order: Product(1) -> Telegram(2) -> Persona(3)
- Updated getOnboardingState() to calculate step from completion, not stale saved data
- Added step persistence in onboarding-client.tsx for resume scenarios

### What Happens Next
- Test onboarding flow fix via Vercel Preview Deployment
- Continue UAT verification for Phase 2
- Execute 02-09: Settings Page after UAT passes

### Context for Next Session
- All planning artifacts in `.planning/` directory
- Tech stack: Next.js 16, TypeScript, Supabase, Tailwind 4, shadcn/ui
- Phase 2 dependencies: grammy, Firecrawl SDK, OpenAI SDK, qrcode.react
- AI clients: src/lib/firecrawl/client.ts, src/lib/openai/client.ts
- Telegram bot: src/lib/telegram/bot.ts exports bot + generateDeepLink
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
*Last updated: 2026-01-23 (deployment info added, onboarding step order fixed)*
