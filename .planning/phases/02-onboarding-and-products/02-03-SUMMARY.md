---
phase: 02-onboarding-and-products
plan: 03
subsystem: api
tags: [firecrawl, openai, gpt-4o-mini, zod, web-scraping, ai-generation]

# Dependency graph
requires:
  - phase: 02-01
    provides: npm dependencies (firecrawl-js, openai)
provides:
  - Firecrawl URL scraping client
  - OpenAI product detail generation with structured output
  - Product validation schemas (AI and form)
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Result pattern for API clients (success/data/error structure)
    - zodResponseFormat for type-safe AI outputs
    - Graceful degradation when API keys missing

key-files:
  created:
    - src/lib/firecrawl/client.ts
    - src/lib/openai/client.ts
    - src/lib/validations/product.ts
  modified: []

key-decisions:
  - "gpt-4o-mini for cost efficiency"
  - "Content truncation at 15000 chars for context window"
  - "Minimum 100 chars for meaningful scraped content"
  - "Result pattern with success/data/error for all external APIs"

patterns-established:
  - "External API client pattern: nullable client when unconfigured, Result interface for responses"
  - "AI structured output pattern: Zod schema + zodResponseFormat"

# Metrics
duration: 14min
completed: 2026-01-22
---

# Phase 2 Plan 03: AI Clients Setup Summary

**Firecrawl URL scraping and OpenAI product generation clients with Zod schemas for structured output**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-22T18:19:30Z
- **Completed:** 2026-01-22T18:33:14Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Firecrawl client for URL scraping with markdown extraction
- OpenAI client using gpt-4o-mini with zodResponseFormat for type-safe product details
- Dual Zod schemas: ProductDetailsSchema for AI output, productFormSchema for form validation
- Graceful handling when API keys are missing (warnings, not errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Firecrawl client wrapper** - `53c8dd5` (feat)
2. **Task 2: Create product validation schemas** - `0a1a358` (feat)
3. **Task 3: Create OpenAI client for product generation** - `de5b5dd` (feat)

## Files Created/Modified
- `src/lib/firecrawl/client.ts` - Firecrawl wrapper with scrapeUrl function
- `src/lib/validations/product.ts` - Zod schemas for product details and form validation
- `src/lib/openai/client.ts` - OpenAI wrapper with generateProductDetails function

## Decisions Made
- **gpt-4o-mini model:** Per research, cost-efficient for product analysis
- **15000 char truncation:** Conservative limit for gpt-4o-mini context window
- **100 char minimum content:** Threshold for "meaningful" scraped content
- **Result pattern:** Consistent {success, data, error} interface for all external API responses

## Deviations from Plan

None - plan executed exactly as written.

Note: The Telegram bot graceful handling was discovered during build verification but was already fixed in plan 02-02 (commit `5900f8c`).

## Issues Encountered
- Firecrawl SDK API changed: method is `scrape()` not `scrapeUrl()` as shown in plan
- Firecrawl v2 SDK doesn't return `success` field, throws on error instead
- Both issues resolved by checking SDK type definitions

## User Setup Required

**External services require manual configuration.** Users need:

1. **Firecrawl API Key:**
   - Sign up at https://firecrawl.dev
   - Get API key from dashboard
   - Add `FIRECRAWL_API_KEY=your-key` to `.env.local`

2. **OpenAI API Key:**
   - Sign up at https://platform.openai.com
   - Create API key
   - Add `OPENAI_API_KEY=your-key` to `.env.local`

## Next Phase Readiness
- Ready for 02-04: Product Step with URL Scraping
- Clients can be called from server actions
- AI generation uses 02-02 persona data for better context

---
*Phase: 02-onboarding-and-products*
*Completed: 2026-01-22*
