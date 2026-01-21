# Requirements: Audy.not

**Defined:** 2026-01-19
**Core Value:** The human stays in the loop. AI curates and drafts; the human approves and posts.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email/password
- [x] **AUTH-02**: User can sign up with Google OAuth
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User is redirected to onboarding after first signup

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
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| ONBR-01 | Phase 2 | Pending |
| ONBR-02 | Phase 2 | Pending |
| ONBR-03 | Phase 2 | Pending |
| ONBR-04 | Phase 2 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| PROD-05 | Phase 6 | Pending |
| PROD-06 | Phase 2 | Pending |
| MNTR-01 | Phase 3 | Pending |
| MNTR-02 | Phase 3 | Pending |
| MNTR-03 | Phase 3 | Pending |
| MNTR-04 | Phase 3 | Pending |
| MNTR-05 | Phase 3 | Pending |
| TELE-01 | Phase 4 | Pending |
| TELE-02 | Phase 4 | Pending |
| TELE-03 | Phase 4 | Pending |
| TELE-04 | Phase 4 | Pending |
| TELE-05 | Phase 4 | Pending |
| TELE-06 | Phase 2 | Pending |
| MENT-01 | Phase 3 | Pending |
| MENT-02 | Phase 3 | Pending |
| MENT-03 | Phase 3 | Pending |
| BILL-01 | Phase 6 | Pending |
| BILL-02 | Phase 6 | Pending |
| BILL-03 | Phase 6 | Pending |
| BILL-04 | Phase 6 | Pending |
| BILL-05 | Phase 6 | Pending |
| USAG-01 | Phase 5 | Pending |
| USAG-02 | Phase 5 | Pending |
| USAG-03 | Phase 5 | Pending |
| USAG-04 | Phase 5 | Pending |
| USAG-05 | Phase 5 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| SETT-01 | Phase 5 | Pending |
| SETT-02 | Phase 5 | Pending |
| SETT-03 | Phase 5 | Pending |
| SETT-04 | Phase 5 | Pending |
| MRKT-01 | Phase 6 | Pending |
| MRKT-02 | Phase 6 | Pending |
| MRKT-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-21 after Phase 1 completion*
