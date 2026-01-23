---
phase: 02-onboarding-and-products
plan: 06
subsystem: product-onboarding
tags: [url-scraping, ai-generation, forms, skeleton-loading, server-actions]

dependency-graph:
  requires: ["02-01", "02-03"]
  provides: ["product-actions", "product-step-ui"]
  affects: ["02-07"]

tech-stack:
  added: [sonner, badge-component]
  patterns: [skeleton-loading, comma-separated-input, editable-badges]

key-files:
  created:
    - src/actions/products.ts
    - src/components/onboarding/product-step.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/sonner.tsx
  modified:
    - src/app/layout.tsx
    - package.json

decisions:
  - id: comma-separated-input
    choice: "User types comma-separated keywords/subreddits, shown as editable badges"
    rationale: "Simple UX with visual feedback, allows quick editing via X buttons"
  - id: toast-plus-inline-error
    choice: "Show both toast notification and inline warning when generation fails"
    rationale: "Per CONTEXT.md - dual feedback ensures user notices the issue"
  - id: url-first-flow
    choice: "URL input required before showing form fields"
    rationale: "Per CONTEXT.md - URL is required to start, form appears after Generate click"

metrics:
  duration: ~8 minutes (previous session)
  completed: 2026-01-22
---

# Phase 02 Plan 06: Product Step with URL Scraping Summary

AI-powered product form with URL scraping, skeleton loading during generation, and editable badge-based tag inputs.

## What Was Built

### Task 1: Product Server Actions
Created `src/actions/products.ts` with:
- `generateProductFromUrl(url)` - Orchestrates scraping and AI generation
  - Calls Firecrawl to scrape URL content
  - Passes content to OpenAI for product detail extraction
  - Returns ProductDetails or partial error for manual fallback
- `saveProduct(formData)` - Saves product to database
  - Validates with Zod schema
  - Inserts to products table with user_id
  - Revalidates /onboarding and /dashboard paths
- `getUserProducts()` - Retrieves user's products

### Task 2: Skeleton Component
Added `src/components/ui/skeleton.tsx` via shadcn:
- Animated pulse effect for loading states
- Used in form fields during AI generation

### Task 3: Product Step UI Component
Created `src/components/onboarding/product-step.tsx` (282 lines):
- URL input with "Generate" button (Sparkles icon)
- Skeleton placeholders for all form fields during generation
- Form fields:
  - Product Name (Input)
  - Description (Textarea)
  - Keywords (comma-separated with Badge display)
  - Subreddits (comma-separated with r/ prefix badges)
- Editable badges with X button for quick removal
- Error handling: Yellow warning banner + toast when generation fails
- Calls onComplete() after successful save

### Supporting Components Added
- `src/components/ui/badge.tsx` - Tag display component
- `src/components/ui/sonner.tsx` - Toast notification provider
- Updated `src/app/layout.tsx` with Toaster component

## Commits

| Hash | Message | Files |
|------|---------|-------|
| ac6a0a8 | feat(02-06): create product server actions | src/actions/products.ts |
| 1085781 | chore(02-06): add skeleton component | src/components/ui/skeleton.tsx |
| 3bda9a3 | feat(02-06): create product step UI component | product-step.tsx, badge.tsx, sonner.tsx, layout.tsx |

## Verification Results

1. [x] src/actions/products.ts exports generateProductFromUrl and saveProduct
2. [x] src/components/ui/skeleton.tsx exists
3. [x] src/components/onboarding/product-step.tsx has URL input, skeleton loading, form fields
4. [x] Keywords and subreddits show as editable badges
5. [x] Error handling shows both toast and inline hint
6. [x] `npm run build` passes

## Success Criteria Met

- [x] User can enter URL and trigger AI generation
- [x] Skeleton loading visible during generation
- [x] All fields editable after generation
- [x] Manual entry works when generation fails
- [x] Product saved to database on submit

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers
None.

### Concerns
None - product step is fully self-contained.

### Ready For
02-07: Onboarding Flow Integration - all three step components (PersonaStep, TelegramStep, ProductStep) are ready to be composed into the onboarding page.
