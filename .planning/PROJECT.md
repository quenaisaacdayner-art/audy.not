# Audy.not

## What This Is

A social listening copilot that monitors Reddit and Hacker News for users expressing pain points relevant to a founder's product, generates persona-driven draft replies, and notifies the user via Telegram for manual approval before posting. Built for solopreneurs and indie hackers who can build products but struggle with marketing and distribution.

## Core Value

The human stays in the loop. AI curates and drafts; the human approves and posts. This protects reputation and prevents bans while eliminating the tedious work of manual community monitoring.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up and authenticate via Supabase Auth
- [ ] User can connect their Telegram account via deep link flow
- [ ] User can configure their persona (expertise, tone, phrases to avoid)
- [ ] User can add products via URL (Firecrawl + OpenAI auto-generates details) or manually
- [ ] System polls Reddit for posts matching user's keywords in configured subreddits
- [ ] System filters posts through AI intent classification (pain points and recommendation requests only)
- [ ] System generates persona-driven draft replies for qualifying posts
- [ ] User receives Telegram notifications with draft replies and inline action buttons
- [ ] User can approve, regenerate, or discard opportunities via Telegram
- [ ] System tracks usage against plan limits (Free: 10/month, Pro: 200/month)
- [ ] User can upgrade to Pro via Stripe Checkout
- [ ] User can manage subscription via Stripe Customer Portal
- [ ] Dashboard shows usage stats and recent mentions
- [ ] App supports English and Portuguese (pt-BR) via next-intl

### Out of Scope

- Hacker News integration — Focus on Reddit first; HN has different API patterns
- Multiple language support for replies — Start with English posts only
- Team/multi-user accounts — Solopreneur focus; team features are post-validation
- Custom AI model fine-tuning — GPT-4o-mini is sufficient for MVP
- Reply scheduling — Manual posting is the MVP flow
- Analytics dashboard — Usage stats are enough; detailed analytics is post-validation
- Mobile app — Telegram is the mobile interface
- Browser extension — Web dashboard + Telegram is sufficient
- Bulk actions on mentions — One-by-one is fine for MVP volume
- Export/reports — Not needed for validation
- A/B testing of reply styles — Manual iteration is faster for MVP
- Integrations (Notion, Slack, etc.) — Telegram only for MVP
- Custom subreddit rules — Global rules are enough
- Sentiment analysis graphs — Intent score is enough

## Context

**Target User:** Solopreneurs and indie hackers who can build products but struggle with marketing. They want to do social selling but don't have time to monitor communities manually, and they're afraid of looking like spam bots.

**Business Model:**
- Free: 10 opportunities/month, 1 product
- Pro ($19/month): 200 opportunities/month, 5 products

**Key Differentiator:** Semi-automatic (copilot) instead of fully automatic. The AI curates and drafts; the human approves and posts. This protects against bans and maintains authenticity.

**External Services (ready to configure):**
- Supabase (PostgreSQL + Auth)
- Stripe (payments)
- Telegram Bot API (notifications)
- OpenAI API (intent filtering + reply generation)
- Firecrawl (URL scraping for product auto-sync)
- Vercel (hosting + cron)

## Constraints

- **Tech Stack**: Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS, shadcn/ui — Locked per spec
- **File Structure**: Frozen after initial setup — No new folders without explicit approval
- **Validation**: All inputs validated with Zod, all DB queries parameterized — No exceptions
- **Commits**: Atomic commits only — One feature per commit, format: `feat(scope): description`
- **Dependencies**: Only packages listed in spec — Ask before adding new ones
- **Secrets**: All API keys in environment variables — Never commit .env files

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Telegram for notifications instead of email | Instant delivery, inline actions, mobile-friendly without building an app | — Pending |
| Human-in-the-loop required for posting | Protects against bans, maintains authenticity, key differentiator | — Pending |
| Reddit first, HN later | Simpler API, larger community volume, faster validation | — Pending |
| Usage counted at draft generation, not approval | Fair to user (they don't waste quota on discards), simpler billing logic | — Pending |
| GPT-4o-mini for both layers | Cost-effective, fast enough for near-realtime, sufficient quality for MVP | — Pending |
| Firecrawl for URL scraping | Reliable extraction, handles JS-rendered pages, better than DIY scraping | — Pending |
| URL-first product creation | Reduces friction, auto-generates keywords/subreddits, manual fallback available | — Pending |

---
*Last updated: 2026-01-19 after requirements definition*
