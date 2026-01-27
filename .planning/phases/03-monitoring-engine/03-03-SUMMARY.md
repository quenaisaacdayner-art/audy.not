---
phase: 03-monitoring-engine
plan: 03
subsystem: ai-processing
tags: [openai, classification, reply-generation, gpt-4o-mini, zod]
depends_on:
  requires: [03-01]
  provides: [ai-classification, draft-reply-generation]
  affects: [03-04, 03-05]
tech-stack:
  added: []
  patterns: [zodResponseFormat, adaptive-length-guidance, confidence-scoring]
key-files:
  modified: [src/lib/openai/client.ts]
decisions:
  - id: balanced-assessment
    choice: Balanced AI strictness with confidence scoring
    rationale: Show all pain_point/recommendation_request posts, user can discard irrelevant ones
  - id: adaptive-length
    choice: Match reply length to post length
    rationale: Short posts get 2-3 sentences, medium 3-5, long get detailed response
  - id: soft-mention
    choice: Help-first product mention at end
    rationale: Sound like real person, not marketing message
metrics:
  duration: 4m 28s
  completed: 2026-01-27
---

# Phase 3 Plan 03: AI Classification and Reply Generation Summary

Extended OpenAI client with classifyPostIntent and generateDraftReply using zodResponseFormat for type-safe structured outputs with confidence scoring and adaptive persona-driven replies.

## What Was Built

### Task 1: classifyPostIntent Function
Added AI classification function to categorize Reddit posts.

**Implementation:**
- Three intent categories: `pain_point`, `recommendation_request`, `not_relevant`
- Confidence scoring: 75%+ for explicit, 50-74% for implied, <50% for ambiguous
- Product context injection: name, description, keywords
- Balanced assessment: considers both clear signals and implied needs
- Uses `zodResponseFormat` with `PostIntentSchema` for type-safe outputs

**Commit:** `be28809`

### Task 2: generateDraftReply Function
Added persona-driven reply generation function.

**Implementation:**
- Adaptive length guidance:
  - <200 chars: 2-3 sentences
  - 200-500 chars: 3-5 sentences
  - >500 chars: detailed response
- Persona integration: expertise, tone, phrases_to_avoid (nullable fields)
- Plain text only output (no markdown)
- Soft product mention at end (help-first approach)
- Uses `zodResponseFormat` with `DraftReplySchema` for type-safe outputs

**Commit:** `3f4f7f4`

## Files Modified

| File | Changes |
|------|---------|
| src/lib/openai/client.ts | +171 lines - added ClassificationResult, ReplyGenerationResult interfaces, classifyPostIntent and generateDraftReply functions |

## Exports Added

```typescript
// From src/lib/openai/client.ts
export interface ClassificationResult
export interface ReplyGenerationResult
export async function classifyPostIntent(title, content, productContext): Promise<ClassificationResult>
export async function generateDraftReply(post, product, persona): Promise<ReplyGenerationResult>
```

## Verification Results

| Check | Result |
|-------|--------|
| classifyPostIntent function exists | PASS |
| generateDraftReply function exists | PASS |
| Both use zodResponseFormat | PASS |
| Both handle missing OpenAI config | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Classification confidence | 3-tier (75%+/50-74%/<50%) | Per CONTEXT.md - balanced strictness, show all relevant posts |
| Reply length | Adaptive to post length | Per CONTEXT.md - match depth, feel natural |
| Product mention | Subtle, at end | Per CONTEXT.md - help first, soft sell |
| Model | gpt-4o-mini | Consistent with Phase 2 decision for cost efficiency |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for:** 03-04 (Monitoring Cron Job)

**Dependencies satisfied:**
- classifyPostIntent available for filtering posts
- generateDraftReply available for creating drafts
- Both use Result pattern for error handling

**Integration points:**
- Cron job will call classifyPostIntent after keyword filtering
- Cron job will call generateDraftReply for non-not_relevant posts

---

*Plan 03-03 executed: 2026-01-27*
*Duration: 4m 28s*
*Commits: be28809, 3f4f7f4*
