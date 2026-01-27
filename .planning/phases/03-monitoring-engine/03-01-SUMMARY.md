---
phase: 03-monitoring-engine
plan: 01
subsystem: data-layer
tags: [database, types, zod, mentions]
dependency-graph:
  requires: [02-01]
  provides: [mentions-schema, mention-types, ai-validation-schemas]
  affects: [03-02, 03-03, 03-04, 03-05]
tech-stack:
  added: []
  patterns: [composite-unique-key, singleton-table, zod-structured-outputs]
file-tracking:
  key-files:
    created:
      - supabase/migrations/00003_mentions.sql
      - src/lib/validations/mention.ts
    modified:
      - src/types/database.ts
decisions:
  - id: composite-dedup-key
    choice: "UNIQUE(product_id, reddit_post_id)"
    rationale: "Prevents duplicate mentions per product while allowing same post to match multiple products"
  - id: monitoring-state-singleton
    choice: "id INTEGER CHECK(id = 1)"
    rationale: "Single row tracks last run, simpler than alternative approaches"
  - id: service-role-only-state
    choice: "No RLS policies for monitoring_state"
    rationale: "Only cron/service role needs access, no user access required"
metrics:
  duration: 4m
  completed: 2026-01-27
---

# Phase 3 Plan 1: Mentions Schema and Types Summary

**One-liner:** Database schema for mentions with composite deduplication, TypeScript types, and Zod schemas for AI structured outputs.

## What Was Built

### Database Schema (00003_mentions.sql)
- **mentions table** with 16 columns tracking Reddit posts matched to products
- Composite unique constraint on `(product_id, reddit_post_id)` for deduplication
- RLS policies for user isolation (view/create/update/delete own mentions)
- Check constraints for intent, status, and confidence range
- Indexes on `(user_id, status)` and `product_id` for query performance
- **monitoring_state singleton table** for tracking last monitoring run

### TypeScript Types (src/types/database.ts)
- `Mention` interface with all 16 fields, typed intent and status enums
- `MonitoringState` interface with nullable stats object
- Database interface extended with mentions and monitoring_state tables

### Zod Validation Schemas (src/lib/validations/mention.ts)
- `PostIntentSchema` for AI intent classification (pain_point/recommendation_request/not_relevant)
- `DraftReplySchema` for AI reply generation
- `mentionStatusSchema` for status validation in actions

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Composite deduplication | `UNIQUE(product_id, reddit_post_id)` | Same Reddit post can match multiple products, but not twice per product |
| Monitoring state pattern | Singleton table with `CHECK(id = 1)` | Simple tracking without complex state management |
| Service role access only | No RLS policies on monitoring_state | Cron job runs as service role, no user access needed |

## Deviations from Plan

None - plan executed exactly as written.

## Artifacts Produced

| Artifact | Purpose |
|----------|---------|
| `supabase/migrations/00003_mentions.sql` | Database schema for mentions and monitoring state |
| `src/types/database.ts` | TypeScript interfaces matching database schema |
| `src/lib/validations/mention.ts` | Zod schemas for AI structured outputs |

## Next Phase Readiness

**Prerequisites for 03-02 (Reddit Client):**
- [x] Mention types available for Reddit post mapping
- [x] PostIntentSchema ready for AI classification
- [x] DraftReplySchema ready for reply generation

**User Action Required:**
- Execute `supabase/migrations/00003_mentions.sql` in Supabase Dashboard SQL Editor
