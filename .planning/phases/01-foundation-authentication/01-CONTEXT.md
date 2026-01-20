# Phase 1: Foundation and Authentication - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts and access protected routes. This includes:
- Project scaffolding (Next.js 15, Supabase, Tailwind, shadcn/ui)
- Email/password and Google OAuth signup/login
- Session persistence across browser refresh
- Routing logic: new users → onboarding, returning users → dashboard

</domain>

<decisions>
## Implementation Decisions

### Auth UI style
- Modal overlay (not dedicated pages)
- Separate modals for login vs signup, linked with "Don't have an account?" / "Already have an account?"
- Google OAuth button at top, before email form, with divider
- Logo only at top of modal (no tagline)
- Landing page visible behind modal with dimmed backdrop

### Error handling UX
- Inline validation errors under each field (red text)
- Validation runs on submit only (not on blur or while typing)
- Generic "Invalid credentials" message for wrong password/unknown email (security-conscious)
- OAuth failures show error inside the modal, user can retry immediately

### Post-signup flow
- Direct redirect to onboarding (no intermediate success state or welcome modal)
- No email verification required — users can use the app immediately

### Session behavior
- Always remember (no "Remember me" checkbox)
- Sessions expire after 7 days
- Multiple devices allowed, limited to 3-5 concurrent sessions
- On session expiry: modal prompt to re-login without losing page context

### Claude's Discretion
- Loading state pattern during account creation (button spinner vs modal overlay)
- Exact styling/spacing of form elements
- Implementation of session limit enforcement

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-01-19*
