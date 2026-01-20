# Requirements: Audy.not

**Defined:** 2026-01-19
**Core Value:** The human stays in the loop. AI curates and drafts; the human approves and posts.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email/password
- [ ] **AUTH-02**: User can sign up with Google OAuth
- [ ] **AUTH-03**: User session persists across browser refresh
- [ ] **AUTH-04**: User is redirected to onboarding after first signup

### Onboarding

- [ ] **ONBR-01**: User can connect Telegram via deep link flow
- [ ] **ONBR-02**: User can configure persona (expertise, tone, phrases to avoid)
- [ ] **ONBR-03**: User can add first product (via URL auto-sync or manually) to complete onboarding
- [ ] **ONBR-04**: User is redirected to dashboard after completing onboarding

### Products

- [ ] **PROD-01**: User enters SaaS URL; system uses Firecrawl + OpenAI to auto-generate name, description, keywords, and suggested subreddits
- [ ] **PROD-02**: User can view list of their products
- [ ] **PROD-03**: User can edit existing product
- [ ] **PROD-04**: User can delete product
- [ ] **PROD-05**: User is limited to 1 product on Free plan, 5 on Pro
- [ ] **PROD-06**: If URL scraping fails or is partial, user can manually fill/edit all fields

### Monitoring

- [ ] **MNTR-01**: System polls Reddit for new posts in user's configured subreddits
- [ ] **MNTR-02**: System filters posts by user's configured keywords
- [ ] **MNTR-03**: System classifies post intent via AI (pain point / recommendation request)
- [ ] **MNTR-04**: System generates persona-driven draft reply for qualifying posts
- [ ] **MNTR-05**: System deduplicates posts (same post not processed twice per product)

### Telegram

- [ ] **TELE-01**: User receives notification when new opportunity is found
- [ ] **TELE-02**: Notification includes post title, subreddit, draft reply, and link
- [ ] **TELE-03**: User can approve opportunity via inline button
- [ ] **TELE-04**: User can regenerate draft via inline button
- [ ] **TELE-05**: User can discard opportunity via inline button
- [ ] **TELE-06**: User receives welcome message when Telegram is connected

### Mentions

- [ ] **MENT-01**: User can view list of all mentions with status filters
- [ ] **MENT-02**: User can see mention details (post, draft, status, timestamps)
- [ ] **MENT-03**: Mentions track status: pending, approved, discarded, regenerated

### Billing

- [ ] **BILL-01**: New users start on Free plan (10 opportunities/month)
- [ ] **BILL-02**: User can upgrade to Pro ($19/month) via Stripe Checkout
- [ ] **BILL-03**: User can manage subscription via Stripe Customer Portal
- [ ] **BILL-04**: System updates plan when Stripe webhook fires
- [ ] **BILL-05**: Pro users get 200 opportunities/month and 5 products

### Usage

- [ ] **USAG-01**: System tracks opportunities used per billing period
- [ ] **USAG-02**: Opportunity is counted when draft is generated (not on approval)
- [ ] **USAG-03**: User sees usage stats on dashboard
- [ ] **USAG-04**: User receives Telegram notification when limit is reached
- [ ] **USAG-05**: System resets usage counters monthly

### Dashboard

- [ ] **DASH-01**: User sees current usage vs limit
- [ ] **DASH-02**: User sees recent mentions with status
- [ ] **DASH-03**: User can navigate to products, mentions, settings

### Settings

- [ ] **SETT-01**: User can update persona configuration
- [ ] **SETT-02**: User can view/disconnect Telegram connection
- [ ] **SETT-03**: User can change preferred language (en / pt-BR)
- [ ] **SETT-04**: User can access billing settings

### Marketing

- [ ] **MRKT-01**: Landing page explains product value proposition
- [ ] **MRKT-02**: Landing page shows pricing (Free vs Pro)
- [ ] **MRKT-03**: Landing page has sign up CTA

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Hacker News Integration

- **HCKN-01**: System polls Hacker News for relevant posts
- **HCKN-02**: System handles HN-specific post formats and threading

### Advanced Analytics

- **ANLY-01**: User can view conversion rates (approved vs total opportunities)
- **ANLY-02**: User can see which subreddits yield best opportunities
- **ANLY-03**: User can export mention history

### Team Features

- **TEAM-01**: Multiple users can share a workspace
- **TEAM-02**: Team members can review each other's drafts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat/DM monitoring | Privacy concerns, API complexity, not core to value prop |
| Auto-posting replies | Core differentiator is human-in-the-loop; auto-post defeats this |
| Mobile app | Telegram IS the mobile interface |
| Browser extension | Web dashboard + Telegram is sufficient for MVP |
| Bulk actions on mentions | One-by-one is fine for MVP volume |
| Reply scheduling | Manual posting is the MVP flow |
| Custom AI fine-tuning | GPT-4o-mini is sufficient |
| Multiple reply languages | English posts only for MVP |
| Integrations (Slack, Notion) | Telegram only for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| ONBR-01 | TBD | Pending |
| ONBR-02 | TBD | Pending |
| ONBR-03 | TBD | Pending |
| ONBR-04 | TBD | Pending |
| PROD-01 | TBD | Pending |
| PROD-02 | TBD | Pending |
| PROD-03 | TBD | Pending |
| PROD-04 | TBD | Pending |
| PROD-05 | TBD | Pending |
| PROD-06 | TBD | Pending |
| MNTR-01 | TBD | Pending |
| MNTR-02 | TBD | Pending |
| MNTR-03 | TBD | Pending |
| MNTR-04 | TBD | Pending |
| MNTR-05 | TBD | Pending |
| TELE-01 | TBD | Pending |
| TELE-02 | TBD | Pending |
| TELE-03 | TBD | Pending |
| TELE-04 | TBD | Pending |
| TELE-05 | TBD | Pending |
| TELE-06 | TBD | Pending |
| MENT-01 | TBD | Pending |
| MENT-02 | TBD | Pending |
| MENT-03 | TBD | Pending |
| BILL-01 | TBD | Pending |
| BILL-02 | TBD | Pending |
| BILL-03 | TBD | Pending |
| BILL-04 | TBD | Pending |
| BILL-05 | TBD | Pending |
| USAG-01 | TBD | Pending |
| USAG-02 | TBD | Pending |
| USAG-03 | TBD | Pending |
| USAG-04 | TBD | Pending |
| USAG-05 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| SETT-01 | TBD | Pending |
| SETT-02 | TBD | Pending |
| SETT-03 | TBD | Pending |
| SETT-04 | TBD | Pending |
| MRKT-01 | TBD | Pending |
| MRKT-02 | TBD | Pending |
| MRKT-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 (pending roadmap creation)

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
