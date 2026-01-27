---
phase: 03-monitoring-engine
plan: 04
subsystem: monitoring-engine
tags: [cron, reddit, ai, vercel, supabase]
dependency-graph:
  requires: ["03-01", "03-02", "03-03"]
  provides: ["cron-endpoint", "mention-actions", "automated-monitoring"]
  affects: ["03-05", "04-01"]
tech-stack:
  added: []
  patterns: ["vercel-cron", "service-role-queries", "cron-secret-auth"]
key-files:
  created:
    - vercel.json
    - src/app/api/cron/monitor/route.ts
    - src/actions/mentions.ts
  modified: []
decisions:
  - id: separate-persona-query
    choice: "Fetch persona in separate query per product"
    reason: "No explicit FK relationship between products and personas tables"
  - id: maxduration-60
    choice: "60 second maxDuration for cron"
    reason: "Allow adequate time for AI processing across multiple products/posts"
metrics:
  duration: "3m"
  completed: "2026-01-27"
---

# Phase 03 Plan 04: Monitoring Cron Job Summary

**One-liner:** Vercel cron endpoint polls Reddit, classifies posts via AI, generates draft replies, creates mentions with deduplication.

## What Was Built

### Mention Server Actions (`src/actions/mentions.ts`)
- `createMention`: Insert new mention records (cron job use)
- `checkMentionExists`: Deduplication check by product_id + reddit_post_id
- `getMentions`: Retrieve user's mentions with filters and product name join
- `getMention`: Single mention detail for authenticated user
- `updateMentionStatus`: Update mention status (for Phase 4 Telegram actions)

### Vercel Cron Configuration (`vercel.json`)
- Schedule: `*/15 * * * *` (every 15 minutes)
- Route: `/api/cron/monitor`
- Note: Hobby plan may limit to hourly; schedule expresses intent

### Monitoring Cron Endpoint (`src/app/api/cron/monitor/route.ts`)
- **Authorization:** Validates `Bearer ${CRON_SECRET}` header
- **Processing flow:**
  1. Fetch all products from database
  2. For each product with configured subreddits:
     - Fetch user's persona for reply context
     - Poll each subreddit for new posts
     - Filter posts by product keywords
     - Deduplicate against existing mentions
     - Classify intent via `classifyPostIntent`
     - Skip `not_relevant` posts
     - Generate draft reply via `generateDraftReply`
     - Create mention record
  3. Update `monitoring_state` with run statistics
- **maxDuration:** 60 seconds (adequate for AI calls)
- **Stats tracking:** Products processed, posts found, mentions created

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 50e8777 | feat | Add mentions server actions |
| 9578318 | chore | Configure Vercel cron for monitoring |
| 4324a36 | feat | Implement monitoring cron endpoint |

## Decisions Made

### Separate Persona Query
**Decision:** Fetch persona separately per product rather than join
**Rationale:** No explicit FK relationship between products and personas tables; both link via user_id but not directly to each other.

### maxDuration = 60
**Decision:** Allow 60 seconds for cron execution
**Rationale:** Each post requires AI classification and reply generation; processing multiple products with multiple subreddits needs adequate time.

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

Before the cron job will work:
1. Generate CRON_SECRET: `openssl rand -hex 32`
2. Add to Vercel Environment Variables:
   - Name: `CRON_SECRET`
   - Value: Generated secret
   - Environment: Production

## What Links Together

```
vercel.json
  ├── schedules /api/cron/monitor every 15 minutes

src/app/api/cron/monitor/route.ts
  ├── uses → fetchSubredditPosts (src/lib/reddit/client.ts)
  ├── uses → filterPostsByKeywords (src/lib/reddit/client.ts)
  ├── uses → classifyPostIntent (src/lib/openai/client.ts)
  ├── uses → generateDraftReply (src/lib/openai/client.ts)
  └── uses → createMention, checkMentionExists (src/actions/mentions.ts)

src/actions/mentions.ts
  ├── getMentions, getMention → Phase 03-05 (Mentions List/Detail)
  └── updateMentionStatus → Phase 04-01 (Telegram Notifications)
```

## Verification Results

- [x] vercel.json exists with cron schedule
- [x] src/actions/mentions.ts exports all required functions
- [x] src/app/api/cron/monitor/route.ts exists with GET handler
- [x] CRON_SECRET validation in place
- [x] maxDuration = 60 configured
- [x] TypeScript compilation passes
- [x] Production build passes

## Next Phase Readiness

**Phase 03-05 Dependencies Met:**
- `getMentions` and `getMention` actions ready for UI pages
- Mention type includes `product_name` for display

**Phase 04-01 Dependencies Met:**
- `updateMentionStatus` ready for Telegram bot actions
- Mentions include all Reddit post data for notification formatting
