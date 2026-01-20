# Phase 1: Foundation and Authentication - Research

**Researched:** 2026-01-19
**Domain:** Next.js 15 App Router + Supabase Auth + shadcn/ui
**Confidence:** HIGH

## Summary

This research covers the foundation for a Next.js 15 application with Supabase authentication, including email/password and Google OAuth signup flows. The stack uses the App Router pattern with server-side authentication via the `@supabase/ssr` package, which stores sessions in HTTP-only cookies for SSR compatibility and security.

The key architectural decisions center on:
1. Using `@supabase/ssr` (not the deprecated `@supabase/auth-helpers`) for cookie-based auth
2. Middleware for session refresh (Server Components cannot write cookies)
3. Database trigger for automatic profile creation on signup
4. shadcn/ui Dialog component for modal-based auth forms per user decisions
5. Controlled open state for auth modals linked from landing page

**Primary recommendation:** Use Supabase's official Next.js SSR pattern with middleware for token refresh, server/client Supabase utilities separated, and a profiles table with RLS policies for user data.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | React framework with App Router | Locked per spec, provides RSC, middleware, route handlers |
| @supabase/supabase-js | 2.x | Supabase client SDK | Core Supabase integration |
| @supabase/ssr | 0.5.x | Server-side auth for Next.js | Official package for cookie-based SSR auth, replaces deprecated auth-helpers |
| typescript | 5.x | Type safety | Locked per spec |
| tailwindcss | 4.x | Utility-first CSS | Locked per spec |
| shadcn/ui | latest | Component library | Locked per spec, provides Dialog, Form, Button, Input |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.x | Form state management | All forms - shadcn Form is built on it |
| @hookform/resolvers | 3.x | Form validation resolvers | Connects Zod to react-hook-form |
| zod | 3.x | Schema validation | All input validation, type inference |
| server-only | 0.0.1 | Prevent server code in client | Mark server-only modules |
| client-only | 0.0.1 | Prevent client code in server | Mark client-only modules |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | NextAuth.js | NextAuth requires more setup, Supabase is already in stack |
| shadcn Dialog | Custom modal | shadcn provides accessibility, focus trap, overlay built-in |
| Zod | Yup | Zod has better TypeScript inference, faster in v4 |

**Installation:**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers
npm install server-only client-only
npx shadcn@latest init
npx shadcn@latest add button dialog form input label
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page (public)
│   ├── (auth)/                 # Route group for auth (no URL impact)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts    # OAuth callback handler
│   ├── (protected)/            # Route group for protected routes
│   │   ├── layout.tsx          # Protected layout with auth check
│   │   ├── onboarding/
│   │   │   └── page.tsx        # Onboarding flow
│   │   └── dashboard/
│   │       └── page.tsx        # Main dashboard
│   └── api/                    # API routes if needed
├── components/
│   ├── ui/                     # shadcn components (auto-generated)
│   ├── auth/                   # Auth-specific components
│   │   ├── auth-modal.tsx      # Modal container for auth
│   │   ├── login-form.tsx      # Login form
│   │   └── signup-form.tsx     # Signup form
│   └── providers/              # Context providers
│       └── supabase-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── middleware.ts       # updateSession utility
│   ├── validations/
│   │   └── auth.ts             # Zod schemas for auth
│   └── utils.ts                # General utilities
└── middleware.ts               # Next.js middleware (root level)
```

### Pattern 1: Supabase Client Creation

**What:** Separate Supabase clients for browser and server contexts
**When to use:** Always - required for SSR cookie handling
**Example:**

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  )
}
```

### Pattern 2: Middleware for Session Refresh

**What:** Middleware refreshes expired auth tokens since Server Components cannot write cookies
**When to use:** Always - required for session persistence
**Example:**

```typescript
// src/lib/supabase/middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser(), not getSession()
  // getUser() validates the token with Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

```typescript
// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const publicRoutes = ['/', '/auth/callback']
const authRoutes = ['/login', '/signup'] // If using pages instead of modals

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.includes(path)) {
    return supabaseResponse
  }

  // Redirect unauthenticated users from protected routes
  if (!user && !publicRoutes.some(route => path.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: OAuth Callback Route Handler

**What:** Exchanges OAuth code for session after provider redirect
**When to use:** Required for Google OAuth
**Example:**

```typescript
// src/app/(auth)/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // OAuth error - redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth`)
}
```

### Pattern 4: Auth Form with Zod Validation

**What:** Type-safe form validation with Zod schemas
**When to use:** All auth forms
**Example:**

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod'

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

### Pattern 5: Modal-Based Auth (Per User Decision)

**What:** Controlled Dialog for auth forms with landing page visible behind
**When to use:** Auth UI per CONTEXT.md decisions
**Example:**

```typescript
// src/components/auth/auth-modal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'login' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultView = 'signup' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(defaultView)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Logo only at top per user decision */}
          <img src="/logo.svg" alt="Audy.not" className="h-8 w-auto mx-auto" />
          <DialogTitle className="text-center">
            {view === 'login' ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
        </DialogHeader>

        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 6: Database Trigger for Profile Creation

**What:** Automatically create profile row when user signs up
**When to use:** Always - ensures profile exists for every user
**Example:**

```sql
-- Run in Supabase SQL Editor
-- Source: https://supabase.com/docs/guides/auth/managing-user-data

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Anti-Patterns to Avoid

- **Never use `getSession()` on server:** Always use `getUser()` - it validates the token with Supabase Auth server. `getSession()` can be spoofed.
- **Never skip middleware:** Server Components cannot write cookies, so session refresh must happen in middleware.
- **Never store tokens in localStorage:** Use HTTP-only cookies via `@supabase/ssr` for security and SSR compatibility.
- **Never rely solely on middleware for auth:** Due to CVE-2025-29927, always verify auth in Server Components too.
- **Never put all code in app directory:** Keep components, lib, and utils separate from routing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT handling | `@supabase/ssr` | Handles cookie rotation, refresh, SSR edge cases |
| Form validation | Manual validation | Zod + react-hook-form | Type inference, error messages, performance |
| Modal dialogs | Custom portal/overlay | shadcn Dialog | Focus trap, accessibility, keyboard handling |
| OAuth flow | Manual redirect handling | `signInWithOAuth` + callback route | PKCE flow, state management, security |
| Password hashing | bcrypt in app code | Supabase Auth | Handled by Supabase on their servers |
| Email verification | Custom email service | Supabase Auth emails | Templates, rate limiting, deliverability |

**Key insight:** Supabase Auth handles the hard parts (hashing, tokens, email delivery). Your job is to wire up the UI and handle redirects correctly.

## Common Pitfalls

### Pitfall 1: Using getSession() Instead of getUser()

**What goes wrong:** Session can be spoofed from cookies without server validation
**Why it happens:** `getSession()` is faster (no network call), developers optimize prematurely
**How to avoid:** Always use `getUser()` in middleware and Server Components
**Warning signs:** Auth works but users can access protected content by manipulating cookies

### Pitfall 2: Missing Middleware Session Refresh

**What goes wrong:** Users get logged out randomly, especially after browser was closed
**Why it happens:** Access tokens expire (1 hour default), Server Components can't refresh them
**How to avoid:** Middleware must call `getUser()` which triggers refresh
**Warning signs:** Intermittent auth failures, "logged out" after closing tab

### Pitfall 3: Infinite Redirect Loops

**What goes wrong:** Page keeps redirecting between login and protected route
**Why it happens:** Middleware redirects before session is fully established
**How to avoid:** Whitelist `/auth/callback` in middleware, handle loading states
**Warning signs:** Browser shows "too many redirects" error

### Pitfall 4: Profile Trigger Failure Blocks Signup

**What goes wrong:** Users cannot sign up, get generic error
**Why it happens:** Database trigger has bug or constraint violation
**How to avoid:** Test trigger thoroughly, use `security definer`, handle nullable fields
**Warning signs:** Signup fails with no clear error, works after removing trigger

### Pitfall 5: OAuth Redirect URL Mismatch

**What goes wrong:** Google OAuth fails with redirect_uri_mismatch error
**Why it happens:** Callback URL in code doesn't match Google Cloud Console config
**How to avoid:** Exact URL match including trailing slashes, register all environments
**Warning signs:** OAuth works locally but fails in production or vice versa

### Pitfall 6: RLS Blocking Profile Access

**What goes wrong:** Users can't read their own profile after signup
**Why it happens:** RLS enabled but policies not created or incorrect
**How to avoid:** Always create SELECT and UPDATE policies matching `auth.uid() = id`
**Warning signs:** Profile queries return empty/null despite data existing

## Code Examples

Verified patterns from official sources:

### Email/Password Signup

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-signup
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema } from '@/lib/validations/auth'

export async function signUp(formData: FormData) {
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // Generic message per user decision (security-conscious)
    return { error: 'Unable to create account. Please try again.' }
  }

  redirect('/onboarding')
}
```

### Google OAuth Sign In

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
'use client'

import { createClient } from '@/lib/supabase/client'

export async function signInWithGoogle() {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
    },
  })

  if (error) {
    console.error('OAuth error:', error)
    // Return error to show in modal per user decision
    return { error: 'Unable to sign in with Google. Please try again.' }
  }
}
```

### Email/Password Login

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/lib/validations/auth'

export async function signIn(formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Generic message per user decision
    return { error: 'Invalid credentials' }
  }

  // Check if onboarding completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  } else {
    redirect('/onboarding')
  }
}
```

### Check Onboarding Status in Protected Layout

```typescript
// src/app/(protected)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <>{children}</>
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Unified SSR package, auth-helpers deprecated |
| `getSession()` for auth checks | `getUser()` for auth checks | 2024 | Security fix - getUser validates with server |
| localStorage for tokens | HTTP-only cookies | 2024 | SSR compatibility, XSS protection |
| Pages Router patterns | App Router patterns | Next.js 13+ | Server Components, new file conventions |
| shadcn `<Form>` component | `<Field>` component | 2025 | Form abstraction deprecated, Field preferred |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Use `@supabase/ssr` instead
- `supabase.auth.getSession()` on server: Use `getUser()` instead
- `middleware.ts` name in Next.js 15+: Use `proxy.ts` (name changed but code same)
- shadcn Form component: "We are not actively developing this component anymore"

**Note on shadcn Form:** Despite deprecation notice, the Form component still works and is widely used. The Field component is newer but Form remains functional for this phase.

## Open Questions

Things that couldn't be fully resolved:

1. **Session limit enforcement (3-5 concurrent sessions)**
   - What we know: Supabase supports single-session per user (Pro plan+), but not explicit session counts
   - What's unclear: How to limit to exactly 3-5 sessions without single-session mode
   - Recommendation: Start with Supabase defaults, implement custom session tracking in profiles table if needed in later phase

2. **Next.js 15 middleware.ts vs proxy.ts naming**
   - What we know: Some sources mention renaming to `proxy.ts` in Next.js 15
   - What's unclear: Whether this is stable/released or still experimental
   - Recommendation: Use `middleware.ts` (confirmed working), monitor Next.js releases

3. **Exact session expiry configuration for 7 days**
   - What we know: Supabase allows configuring session duration (Pro plan+)
   - What's unclear: Default session duration on free plan
   - Recommendation: Configure in Supabase dashboard Auth settings, test with free plan

## Sources

### Primary (HIGH confidence)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Complete setup guide
- [Supabase Creating Clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Client utilities
- [Supabase signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) - Email login API
- [Supabase signInWithOAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) - OAuth API
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data) - Profile trigger pattern
- [Supabase Sessions](https://supabase.com/docs/guides/auth/sessions) - Session configuration
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) - Security policies
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication) - App Router patterns
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal component
- [shadcn/ui Form](https://ui.shadcn.com/docs/components/form) - Form component
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/next) - Next.js setup

### Secondary (MEDIUM confidence)
- [Next.js + Supabase Cookie-Based Auth 2025 Guide](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1) - Community best practices
- [Supabase Auth GitHub Discussions](https://github.com/orgs/supabase/discussions/27606) - Troubleshooting patterns
- [Next.js Project Structure Best Practices 2025](https://www.wisp.blog/blog/the-ultimate-guide-to-organizing-your-nextjs-15-project-structure) - Folder organization

### Tertiary (LOW confidence)
- Session limit enforcement (3-5) - No official documentation found, needs validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in official docs
- Architecture patterns: HIGH - Directly from Supabase + Next.js official guides
- Pitfalls: HIGH - Documented in official troubleshooting guides
- Session limits: LOW - Custom implementation needed, no standard solution

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable stack)

---

## Implementation Notes for Planner

Per CONTEXT.md user decisions that must be reflected in plans:

1. **Auth UI:** Modal overlay, not dedicated pages
2. **Modal structure:** Separate modals for login vs signup, linked with toggle text
3. **OAuth position:** Google button at top, before email form, with divider
4. **Branding:** Logo only at top of modal (no tagline)
5. **Background:** Landing page visible behind modal with dimmed backdrop
6. **Error handling:** Inline validation under fields, on submit only (not blur)
7. **Error messages:** Generic "Invalid credentials" for wrong password/unknown email
8. **OAuth errors:** Show error inside modal, user can retry
9. **Post-signup:** Direct redirect to onboarding (no intermediate state)
10. **Email verification:** Not required - users can use app immediately
11. **Session:** Always remember (no checkbox), 7-day expiry
12. **Concurrent sessions:** Limited to 3-5 (needs custom implementation)
13. **Session expiry UX:** Modal prompt to re-login without losing page context

**Claude's discretion areas:**
- Loading state pattern (button spinner vs modal overlay)
- Exact styling/spacing of form elements
- Session limit enforcement implementation
