# Roadmap: Audy.not

**Created:** 2026-01-19
**Depth:** Standard (6 phases)
**Coverage:** 39/39 requirements mapped

## Overview

This roadmap delivers Audy.not in 6 phases, following the natural dependency chain: foundation and auth first, then onboarding and products, then the core monitoring loop, then Telegram notifications to complete the value proposition, then dashboard/settings for user visibility, and finally billing/marketing for monetization. Each phase delivers a coherent, verifiable capability.

---

## Phase 1: Foundation and Authentication

**Goal:** Users can create accounts and access protected routes.

**Dependencies:** None (starting point)

**Requirements:**
- AUTH-01: User can sign up with email/password
- AUTH-02: User can sign up with Google OAuth
- AUTH-03: User session persists across browser refresh
- AUTH-04: User is redirected to onboarding after first signup

**Success Criteria:**
1. User can create a new account using email/password and sees the onboarding screen
2. User can create a new account using Google OAuth and sees the onboarding screen
3. User can close browser, reopen, and remain logged in without re-entering credentials
4. Returning user (onboarding complete) lands on dashboard; new user lands on onboarding

**Notes:**
- Includes project scaffolding: Next.js 15, Supabase client, Tailwind, shadcn/ui base components
- Database schema for users table
- Auth middleware for protected routes

**Plans:** 5 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold (Next.js 15, Tailwind, shadcn/ui)
- [x] 01-02-PLAN.md — Supabase utilities and auth middleware
- [x] 01-03-PLAN.md — Database schema (profiles table with trigger)
- [x] 01-04-PLAN.md — Auth UI components and server actions
- [x] 01-05-PLAN.md — Protected routes and landing page integration

---

## Phase 2: Onboarding and Products

**Goal:** Users can complete onboarding by connecting Telegram, configuring persona, and adding their first product.

**Dependencies:** Phase 1 (auth must exist)

**Requirements:**
- ONBR-01: User can connect Telegram via deep link flow
- ONBR-02: User can configure persona (expertise, tone, phrases to avoid)
- ONBR-03: User can add first product (via URL auto-sync or manually) to complete onboarding
- ONBR-04: User is redirected to dashboard after completing onboarding
- TELE-06: User receives welcome message when Telegram is connected
- PROD-01: User enters SaaS URL; system uses Firecrawl + OpenAI to auto-generate name, description, keywords, and suggested subreddits
- PROD-02: User can view list of their products
- PROD-03: User can edit existing product
- PROD-04: User can delete product
- PROD-06: If URL scraping fails or is partial, user can manually fill/edit all fields

**Success Criteria:**
1. User can click Telegram deep link, open Telegram, start the bot, and see their connection confirmed in the app
2. User receives a welcome message in Telegram immediately after connecting
3. User can fill out persona form (expertise, tone, phrases to avoid) and see it saved
4. User can enter a SaaS URL and see auto-generated product details (name, description, keywords, subreddits)
5. User can manually edit any auto-generated field or fill all fields manually if scraping fails
6. After completing all onboarding steps, user is automatically redirected to dashboard

**Notes:**
- Telegram bot setup (node-telegram-bot-api)
- Firecrawl integration for URL scraping
- OpenAI integration for product detail generation
- Database schema for products, personas, telegram_connections

---

## Phase 3: Monitoring Engine

**Goal:** System automatically discovers and processes Reddit opportunities for user's products.

**Dependencies:** Phase 2 (products must exist to monitor)

**Requirements:**
- MNTR-01: System polls Reddit for new posts in user's configured subreddits
- MNTR-02: System filters posts by user's configured keywords
- MNTR-03: System classifies post intent via AI (pain point / recommendation request)
- MNTR-04: System generates persona-driven draft reply for qualifying posts
- MNTR-05: System deduplicates posts (same post not processed twice per product)
- MENT-01: User can view list of all mentions with status filters
- MENT-02: User can see mention details (post, draft, status, timestamps)
- MENT-03: Mentions track status: pending, approved, discarded, regenerated

**Success Criteria:**
1. System runs on schedule (cron) and finds new Reddit posts matching user's subreddits and keywords
2. Posts are classified by AI intent and only pain points / recommendation requests create mentions
3. Each qualifying post has a persona-driven draft reply generated automatically
4. Same Reddit post is never processed twice for the same product (deduplication works)
5. User can view mentions list with status filters and see full mention details including draft reply

**Notes:**
- Reddit API integration (read-only, no auth needed for public posts)
- Vercel cron for scheduled polling
- OpenAI for intent classification and reply generation
- Database schema for mentions, monitoring_state

**Plans:** 5 plans

Plans:
- [ ] 03-01-PLAN.md — Database schema and TypeScript types for mentions
- [ ] 03-02-PLAN.md — Reddit client for fetching public posts
- [ ] 03-03-PLAN.md — AI classification and reply generation
- [ ] 03-04-PLAN.md — Cron monitoring engine
- [ ] 03-05-PLAN.md — Mentions list and detail UI

---

## Phase 4: Telegram Notifications and Actions

**Goal:** Users receive opportunities via Telegram and can take action without leaving the chat.

**Dependencies:** Phase 3 (mentions must exist to notify about)

**Requirements:**
- TELE-01: User receives notification when new opportunity is found
- TELE-02: Notification includes post title, subreddit, draft reply, and link
- TELE-03: User can approve opportunity via inline button
- TELE-04: User can regenerate draft via inline button
- TELE-05: User can discard opportunity via inline button

**Success Criteria:**
1. When a new mention is created, user receives Telegram notification within seconds
2. Notification shows post title, subreddit name, draft reply text, and clickable link to original post
3. User can tap "Approve" button and see mention status change to approved (ready to copy/post)
4. User can tap "Regenerate" button and receive a new draft reply in the same chat
5. User can tap "Discard" button and the mention is marked as discarded (no further notifications)

**Notes:**
- Telegram inline keyboards for action buttons
- Webhook handler for button callbacks
- Real-time status updates in database

---

## Phase 5: Dashboard and Settings

**Goal:** Users can view their activity and configure their account settings.

**Dependencies:** Phase 4 (need mentions and actions to display)

**Requirements:**
- DASH-01: User sees current usage vs limit
- DASH-02: User sees recent mentions with status
- DASH-03: User can navigate to products, mentions, settings
- SETT-01: User can update persona configuration
- SETT-02: User can view/disconnect Telegram connection
- SETT-03: User can change preferred language (en / pt-BR)
- SETT-04: User can access billing settings
- USAG-01: System tracks opportunities used per billing period
- USAG-02: Opportunity is counted when draft is generated (not on approval)
- USAG-03: User sees usage stats on dashboard
- USAG-04: User receives Telegram notification when limit is reached
- USAG-05: System resets usage counters monthly

**Success Criteria:**
1. Dashboard displays current opportunities used vs monthly limit (e.g., "7/10 opportunities used")
2. Dashboard shows recent mentions with their current status (pending/approved/discarded)
3. User can navigate from dashboard to products list, mentions list, and settings page
4. User can update persona settings and see changes reflected in future draft generation
5. User can see Telegram connection status and disconnect if desired
6. User can switch between English and Portuguese and see UI update immediately
7. User receives Telegram notification when they hit their monthly opportunity limit

**Notes:**
- next-intl setup for i18n
- Usage tracking increments on draft generation, not approval
- Monthly reset via cron job

---

## Phase 6: Billing and Marketing

**Goal:** Users can upgrade to Pro and new visitors can discover and sign up for the product.

**Dependencies:** Phase 5 (usage limits must work before billing enforces them)

**Requirements:**
- BILL-01: New users start on Free plan (10 opportunities/month)
- BILL-02: User can upgrade to Pro ($19/month) via Stripe Checkout
- BILL-03: User can manage subscription via Stripe Customer Portal
- BILL-04: System updates plan when Stripe webhook fires
- BILL-05: Pro users get 200 opportunities/month and 5 products
- PROD-05: User is limited to 1 product on Free plan, 5 on Pro
- MRKT-01: Landing page explains product value proposition
- MRKT-02: Landing page shows pricing (Free vs Pro)
- MRKT-03: Landing page has sign up CTA

**Success Criteria:**
1. New user account is created with Free plan (10 opportunities/month, 1 product limit)
2. Free user trying to add second product sees upgrade prompt
3. User can click "Upgrade to Pro" and complete Stripe Checkout flow
4. After successful payment, user immediately has Pro limits (200 opportunities, 5 products)
5. User can access Stripe Customer Portal to update payment method or cancel subscription
6. Landing page clearly explains what Audy.not does and why it's valuable
7. Landing page shows Free vs Pro pricing with feature comparison
8. Visitor can click sign up CTA and reach the registration page

**Notes:**
- Stripe Checkout integration
- Stripe webhooks for subscription lifecycle
- Landing page (public, unauthenticated)
- Plan enforcement in product creation and monitoring

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation and Authentication | 4 | Complete |
| 2 | Onboarding and Products | 10 | Complete |
| 3 | Monitoring Engine | 8 | Planned |
| 4 | Telegram Notifications and Actions | 5 | Pending |
| 5 | Dashboard and Settings | 12 | Pending |
| 6 | Billing and Marketing | 8 | Pending |

**Total:** 39 requirements across 6 phases

---

## Dependency Graph

```
Phase 1: Foundation and Authentication
    |
    v
Phase 2: Onboarding and Products
    |
    v
Phase 3: Monitoring Engine
    |
    v
Phase 4: Telegram Notifications and Actions
    |
    v
Phase 5: Dashboard and Settings
    |
    v
Phase 6: Billing and Marketing
```

All phases are sequential. Each phase depends on the previous phase completing.

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-26*
