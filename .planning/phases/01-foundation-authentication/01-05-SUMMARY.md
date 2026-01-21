---
phase: 01-foundation-authentication
plan: 05
subsystem: routing
tags: [nextjs, routing, protected-routes, landing-page, auth-modal]

dependency-graph:
  requires:
    - 01-02 (supabase server client for auth checks)
    - 01-03 (profiles table for onboarding status)
    - 01-04 (auth modal, server actions for signOut)
  provides:
    - protected-route-layout
    - onboarding-page
    - dashboard-page
    - landing-page-with-auth
  affects:
    - Phase 2 (onboarding flow will build on onboarding page)
    - Phase 5 (dashboard will be expanded)

tech-stack:
  added: []
  patterns:
    - Route groups for protected routes
    - Server-side auth check in layout
    - Controlled modal state from parent component
    - Suspense boundary for search params

key-files:
  created:
    - src/app/(protected)/layout.tsx
    - src/app/(protected)/onboarding/page.tsx
    - src/app/(protected)/dashboard/page.tsx
  modified:
    - src/app/page.tsx

decisions:
  - id: simple-layout-auth-check
    choice: Layout only checks authentication, not onboarding status
    rationale: Onboarding redirect already handled in server actions and OAuth callback
  - id: page-level-onboarding-checks
    choice: Each protected page checks onboarding_completed and redirects
    rationale: Defense in depth - prevents direct URL access to wrong page
  - id: suspense-for-searchparams
    choice: Wrap useSearchParams in Suspense boundary
    rationale: Required by Next.js for client components using search params

metrics:
  duration: ~8 minutes
  completed: 2026-01-21
---

# Phase 01 Plan 05: Protected Routes and Landing Page Summary

**Complete authentication flow with protected route layout, onboarding/dashboard placeholders, and landing page with auth modal integration**

## What Was Built

This plan wired together all authentication components into a complete flow:

### 1. Protected Route Layout (`src/app/(protected)/layout.tsx`)

Server component that:
- Uses `getUser()` to validate authentication with Supabase server
- Redirects unauthenticated users to home page (`/`)
- Wraps all protected routes (onboarding, dashboard)

### 2. Onboarding Page (`src/app/(protected)/onboarding/page.tsx`)

Placeholder page for new users:
- Checks `onboarding_completed` status from profiles table
- Redirects to `/dashboard` if onboarding already completed
- Shows welcome message and Phase 1 completion notice
- Sign out button with server action

### 3. Dashboard Page (`src/app/(protected)/dashboard/page.tsx`)

Placeholder page for returning users:
- Queries user profile for display name
- Redirects to `/onboarding` if not completed
- Shows personalized welcome with user's name or email
- Sign out button with server action

### 4. Landing Page (`src/app/page.tsx`)

Client component with:
- Header: Audy.not logo, "Sign in" (ghost), "Get started" (primary)
- Hero section with value proposition
- CTA buttons: "Start free trial", "Sign in"
- Auth modal with controlled state (opens to signup or login view)
- Error message display for failed OAuth redirects (wrapped in Suspense)

## Authentication Flow

```
User visits / (landing page)
    |
    v
Click "Get started" or "Sign in"
    |
    v
Auth modal opens (signup or login view)
    |
    +-- Email/password --> Server action --> Redirect
    |
    +-- Google OAuth --> Callback route --> Redirect
    |
    v
Redirect destination (based on profile.onboarding_completed):
    - false --> /onboarding
    - true  --> /dashboard
```

## Verification Results

| Check | Status |
|-------|--------|
| `npm run build` passes | PASS |
| Protected layout redirects unauthenticated users | PASS |
| Onboarding page exists (44 lines >= 5) | PASS |
| Dashboard page exists (45 lines >= 5) | PASS |
| Landing page has AuthModal integration | PASS |
| Key link: layout imports createClient from server | PASS |
| Key link: page.tsx renders `<AuthModal>` | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 797072e | feat(01-05): create protected route layout with auth check |
| e1051db | feat(01-05): create onboarding and dashboard placeholder pages |
| 22d48cc | feat(01-05): create landing page with auth modal integration |

## Key Artifacts

```
src/
  app/
    (protected)/
      layout.tsx            # Auth check, redirects unauthenticated
      onboarding/
        page.tsx            # New user placeholder
      dashboard/
        page.tsx            # Returning user placeholder
    page.tsx                # Landing page with auth modal
```

## Phase 1 Completion Status

With this plan complete, Phase 1 authentication foundation is finished:

- [x] Project scaffold with Next.js, Tailwind, shadcn/ui
- [x] Supabase client utilities and middleware
- [x] Database schema with profiles table and RLS
- [x] Auth UI components with server actions
- [x] Protected routes and landing page integration

## Next Phase Readiness

Ready for Phase 2 (User Onboarding):
- Authentication flow is complete
- Onboarding page placeholder ready to expand
- Profile table stores `onboarding_completed` flag
- No blockers identified

**Note:** SQL migration must be run in Supabase Dashboard before testing authentication flows.

---
*Completed: 2026-01-21*
