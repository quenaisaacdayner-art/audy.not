---
phase: 02
plan: 04
subsystem: onboarding
tags: [persona, validation, zod, react-hook-form, server-actions]
dependency-graph:
  requires: [02-01]
  provides: [persona-validation, persona-actions, persona-ui]
  affects: [02-07]
tech-stack:
  added: []
  patterns: [form-validation, conditional-rendering, upsert-pattern]
key-files:
  created:
    - src/lib/validations/persona.ts
    - src/actions/persona.ts
    - src/components/onboarding/persona-step.tsx
    - src/components/ui/select.tsx
    - src/components/ui/textarea.tsx
  modified: []
decisions:
  - id: tone-presets
    choice: "6 preset tones including Custom option"
    why: "User-friendly defaults with flexibility for custom tones"
  - id: conditional-custom-tone
    choice: "Show customTone field only when tone='Custom'"
    why: "Clean UI, only show what's needed"
  - id: upsert-on-conflict
    choice: "Use Supabase upsert with onConflict: 'user_id'"
    why: "One persona per user, allows editing existing persona"
metrics:
  duration: "5 minutes"
  completed: "2026-01-22"
---

# Phase 2 Plan 4: Persona Step UI Summary

**One-liner:** Persona configuration form with Zod validation, 6 tone presets, and upsert server action

## What Was Built

### 1. Persona Validation Schema (src/lib/validations/persona.ts)

Zod schema defining:
- **expertise**: 5-500 chars, required
- **tone**: String from TONE_PRESETS dropdown
- **customTone**: Optional, required only if tone='Custom'
- **phrasesToAvoid**: Optional, max 500 chars
- **targetAudience**: 5-500 chars, required

Exports:
- `TONE_PRESETS` - Array of tone options
- `TonePreset` - Union type
- `personaFormSchema` - Zod schema with refinement
- `PersonaFormData` - Inferred TypeScript type

### 2. Persona Server Actions (src/actions/persona.ts)

Two server actions:
- `savePersona(formData)` - Validates, upserts to personas table, updates onboarding_step to 'telegram'
- `getPersona()` - Retrieves current user's persona

Features:
- Server-side validation with Zod
- Supabase upsert with onConflict for single-persona-per-user
- Automatic onboarding step progression
- Proper error handling with typed result

### 3. Persona Step UI Component (src/components/onboarding/persona-step.tsx)

React component using react-hook-form with zodResolver:
- 4 form fields with labels and placeholders
- Tone dropdown with 6 presets
- Conditional customTone input
- Loading and error states
- Full-width responsive layout

### 4. UI Components Added

- `src/components/ui/select.tsx` - Radix Select with shadcn styling
- `src/components/ui/textarea.tsx` - Styled textarea component

## Commits

| Hash | Type | Message |
|------|------|---------|
| 4ff5ccb | feat | create persona validation schema |
| 606caa1 | feat | create persona server action |
| ae627c6 | feat | create persona step UI component |

## Verification Results

- [x] src/lib/validations/persona.ts exports personaFormSchema and TONE_PRESETS
- [x] src/actions/persona.ts exports savePersona and getPersona
- [x] src/components/onboarding/persona-step.tsx exists with form fields (180 lines)
- [x] Custom tone field conditionally renders
- [x] `npm run build` passes

## Success Criteria Met

- [x] Persona form has all 4 fields (expertise, tone, phrases, audience)
- [x] Tone dropdown shows presets with custom option
- [x] Form validates before submission (Zod + react-hook-form)
- [x] Server action saves to personas table
- [x] Onboarding step updated to 'telegram' after save

## Deviations from Plan

None - plan executed exactly as written.

## Notes for Integration

The PersonaStep component expects:
```tsx
<PersonaStep
  onComplete={() => router.push('/onboarding?step=telegram')}
  initialData={existingPersona}
/>
```

Integration with onboarding flow will be handled in 02-07.
