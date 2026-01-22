---
phase: 02-onboarding-and-products
plan: 01
subsystem: database-and-dependencies
tags: [supabase, sql, typescript, telegram, firecrawl, openai]

dependency-graph:
  requires: [01-01, 01-02]
  provides: [phase2-database-schema, phase2-npm-packages, typescript-types]
  affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07]

tech-stack:
  added:
    - grammy@1.39.3
    - "@mendable/firecrawl-js@4.11.2"
    - openai@6.16.0
    - qrcode.react@4.2.0
  patterns: []

key-files:
  created:
    - supabase/migrations/00002_phase2_tables.sql
  modified:
    - src/types/database.ts
    - package.json
    - package-lock.json

decisions: []

metrics:
  duration: ~3 minutes
  tasks: 3/3
  completed: 2026-01-22
---

# Phase 02 Plan 01: Database Setup and Dependencies Summary

**One-liner:** Phase 2 database schema with personas, telegram connections, products tables, plus npm packages for Telegram bot, web scraping, and AI generation.

## What Was Built

### Task 1: Phase 2 Database Migration
Created `supabase/migrations/00002_phase2_tables.sql` with:

1. **personas** table - User persona configuration for AI content generation
   - Fields: expertise, tone, phrases_to_avoid, target_audience
   - RLS enabled with user isolation (SELECT, INSERT, UPDATE, DELETE)
   - Unique constraint on user_id (one persona per user)
   - Updated_at trigger using existing handle_updated_at function

2. **telegram_connections** table - Links users to their Telegram chat
   - Fields: telegram_chat_id (BIGINT), telegram_user_id (BIGINT)
   - RLS enabled with user isolation
   - Unique constraints: one connection per user, one user per chat
   - Index on telegram_chat_id for webhook lookups

3. **telegram_connection_tokens** table - Temporary tokens for deep link flow
   - Fields: token (PRIMARY KEY), expires_at
   - RLS enabled with user isolation
   - Index on token for fast lookup during webhook processing

4. **products** table - User products for keyword/subreddit monitoring
   - Fields: name, description, url, keywords (TEXT[]), subreddits (TEXT[])
   - RLS enabled with user isolation
   - Updated_at trigger

5. **profiles** table update - Added onboarding_step column
   - Tracks user progress: 'persona' | 'telegram' | 'product'
   - Default value: 'persona'

### Task 2: TypeScript Database Types
Updated `src/types/database.ts` with:

- `Persona` interface matching SQL table
- `TelegramConnection` interface
- `TelegramConnectionToken` interface
- `Product` interface with keywords/subreddits as string[]
- Added `onboarding_step` to `Profile` interface
- Extended `Database` interface with Row/Insert/Update types for all tables

### Task 3: Phase 2 Dependencies
Installed via npm:

| Package | Version | Purpose |
|---------|---------|---------|
| grammy | 1.39.3 | Telegram bot framework (TypeScript-native) |
| @mendable/firecrawl-js | 4.11.2 | Web scraping API for product URL analysis |
| openai | 6.16.0 | AI structured outputs with zodResponseFormat |
| qrcode.react | 4.2.0 | QR code component for Telegram deep links |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 73799d5 | feat | Create Phase 2 database migration |
| 43b6856 | feat | Update TypeScript database types |
| 43f72e3 | chore | Install Phase 2 dependencies |

## Deviations from Plan

None - plan executed exactly as written.

## Manual Steps Required

**Run SQL migration in Supabase Dashboard:**

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/00002_phase2_tables.sql`
3. Execute the migration
4. Verify tables created in Table Editor

**Note:** The migration depends on `handle_updated_at()` function from `00001_profiles.sql`. Ensure Phase 1 migration was executed first.

## Next Phase Readiness

**Ready for:** 02-02 (Persona Step UI)

**Dependencies satisfied:**
- [x] personas table schema defined
- [x] TypeScript Persona interface available
- [x] profiles.onboarding_step column for progress tracking

**Blockers:** None

## Verification Results

- [x] SQL migration file exists
- [x] Contains all 4 CREATE TABLE statements
- [x] RLS enabled on all tables with user isolation policies
- [x] TypeScript types compile without errors (`npx tsc --noEmit`)
- [x] All npm packages installed and verified

## Files Changed

```
supabase/migrations/00002_phase2_tables.sql  (created, 184 lines)
src/types/database.ts                        (modified, +70 lines)
package.json                                 (modified)
package-lock.json                            (modified)
```
