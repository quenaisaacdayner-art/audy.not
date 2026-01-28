# Phase 2: Onboarding and Products - Research

**Researched:** 2026-01-21
**Domain:** Multi-step onboarding flow with Telegram integration, Firecrawl web scraping, and OpenAI structured outputs
**Confidence:** HIGH

## Summary

This research covers the implementation of a multi-step onboarding flow with three external integrations: Telegram bot for user connection, Firecrawl API for SaaS URL scraping, and OpenAI structured outputs for generating product details. The phase builds on Phase 1's foundation (Next.js 16, Supabase, shadcn/ui).

The key architectural decisions center on:
1. Using **grammY** for Telegram bot development (TypeScript-native, modern middleware, excellent documentation)
2. **Firecrawl SDK** (`@mendable/firecrawl-js`) for web scraping with Zod schema support
3. **OpenAI SDK** with `zodResponseFormat` for type-safe structured outputs
4. **URL-based or database-persisted onboarding state** for step resumption
5. **Database triggers** for welcome message delivery upon Telegram connection

**Primary recommendation:** Build the onboarding as a single page with conditional step rendering, persist progress in the database, and use Server Actions for all external API calls (Telegram verification, Firecrawl scraping, OpenAI generation).

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammy | 1.x | Telegram bot framework | TypeScript-native, modern middleware, excellent docs, supports webhooks |
| @mendable/firecrawl-js | latest | Web scraping API | Official SDK, Zod support, handles proxies/anti-bot |
| openai | 4.x | OpenAI API client | Official SDK with `zodResponseFormat` for structured outputs |
| qrcode.react | 4.x | QR code generation | Most popular React QR library, SVG support |
| zod | 4.x | Schema validation | Already in project, used by all three integrations |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.x | Form state management | Already in project, multi-step form handling |
| @hookform/resolvers | 3.x | Zod form validation | Already in project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| grammY | node-telegram-bot-api | NTBA lacks TypeScript support, event-emitter architecture less maintainable |
| grammY | Telegraf | Telegraf lags behind Bot API versions, less active development |
| qrcode.react | react-qr-code | Both work, qrcode.react has larger community |

**Installation:**

```bash
npm install grammy @mendable/firecrawl-js openai qrcode.react
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (protected)/
│   │   └── onboarding/
│   │       └── page.tsx           # Multi-step onboarding container
│   └── api/
│       └── telegram/
│           └── webhook/
│               └── route.ts       # Telegram bot webhook handler
├── components/
│   ├── onboarding/
│   │   ├── onboarding-stepper.tsx # Step indicator bar
│   │   ├── persona-step.tsx       # Step 1: First product setup
│   │   ├── telegram-step.tsx      # Step 2: Telegram connection (optional)
│   │   └── product-step.tsx       # Step 3:  Persona configuration
│   └── ui/
│       └── skeleton.tsx           # Loading skeletons for product fields
├── lib/
│   ├── telegram/
│   │   └── bot.ts                 # grammY bot instance and handlers
│   ├── firecrawl/
│   │   └── client.ts              # Firecrawl client wrapper
│   ├── openai/
│   │   └── client.ts              # OpenAI client with product schema
│   └── validations/
│       ├── persona.ts             # Persona form schema
│       └── product.ts             # Product form schema
├── actions/
│   ├── onboarding.ts              # Onboarding state management
│   ├── telegram.ts                # Telegram connection verification
│   └── products.ts                # Product CRUD and AI generation
└── types/
    └── database.ts                # Extended with new tables
```

### Pattern 1: Telegram Deep Link Flow

**What:** Connect user's Telegram account using a deep link with unique token
**When to use:** User clicks "Connect Telegram" during onboarding

```typescript
// src/lib/telegram/bot.ts
import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN!
export const bot = new Bot(token)

// Handle /start command with deep link parameter
bot.command('start', async (ctx) => {
  const payload = ctx.match // Contains the connection token

  if (payload) {
    // Verify token and link Telegram chat to user
    const result = await linkTelegramToUser(payload, ctx.chat.id, ctx.from?.id)

    if (result.success) {
      await ctx.reply(
        `Welcome to Audy.not!

Your account is now connected. Here's what to expect:

- You'll receive notifications when someone mentions topics relevant to your products
- Each notification includes action buttons: Reply, Ignore, or Snooze
- Reply: Opens a draft response for you to customize
- Ignore: Dismisses the notification
- Snooze: Temporarily pauses notifications for that topic

You're all set! Return to the app to continue onboarding.`
      )
    } else {
      await ctx.reply('Connection failed. Please try again from the app.')
    }
  } else {
    await ctx.reply('Please use the connection link from the Audy.not app.')
  }
})

export function generateDeepLink(connectionToken: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  return `https://t.me/${botUsername}?start=${connectionToken}`
}
```

```typescript
// src/app/api/telegram/webhook/route.ts
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { webhookCallback } from 'grammy'
import { bot } from '@/lib/telegram/bot'

export const POST = webhookCallback(bot, 'std/http')
```

### Pattern 2: Firecrawl + OpenAI Product Generation Pipeline

**What:** Scrape URL, then generate product details with OpenAI
**When to use:** User enters a SaaS URL to auto-populate product fields

```typescript
// src/lib/firecrawl/client.ts
import Firecrawl from '@mendable/firecrawl-js'

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!
})

export async function scrapeUrl(url: string) {
  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    })
    return { success: true, content: result.markdown }
  } catch (error) {
    console.error('Firecrawl error:', error)
    return { success: false, content: null, error: 'Failed to scrape URL' }
  }
}
```

```typescript
// src/lib/openai/client.ts
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export const ProductDetailsSchema = z.object({
  name: z.string().describe('Product name'),
  description: z.string().describe('Brief product description (2-3 sentences)'),
  keywords: z.array(z.string()).describe('5-10 relevant keywords for monitoring'),
  subreddits: z.array(z.string()).describe('5-10 relevant subreddits (without r/ prefix)'),
})

export type ProductDetails = z.infer<typeof ProductDetailsSchema>

export async function generateProductDetails(
  websiteContent: string
): Promise<ProductDetails | null> {
  try {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing SaaS products. Given website content, extract:
1. Product name
2. A concise description (2-3 sentences)
3. Keywords that people might use when discussing this type of product
4. Relevant subreddits where the target audience might discuss similar products or problems`
        },
        {
          role: 'user',
          content: `Analyze this website and extract product details:\n\n${websiteContent}`
        }
      ],
      response_format: zodResponseFormat(ProductDetailsSchema, 'product_details'),
    })

    return completion.choices[0]?.message?.parsed ?? null
  } catch (error) {
    console.error('OpenAI error:', error)
    return null
  }
}
```

```typescript
// src/actions/products.ts
'use server'

import { scrapeUrl } from '@/lib/firecrawl/client'
import { generateProductDetails } from '@/lib/openai/client'
import { createClient } from '@/lib/supabase/server'

export async function generateProductFromUrl(url: string) {
  // Step 1: Scrape the URL
  const scrapeResult = await scrapeUrl(url)

  if (!scrapeResult.success || !scrapeResult.content) {
    return {
      success: false,
      partial: true,
      error: 'Could not scrape the URL. Please fill in the details manually.'
    }
  }

  // Step 2: Generate product details with OpenAI
  const productDetails = await generateProductDetails(scrapeResult.content)

  if (!productDetails) {
    return {
      success: false,
      partial: true,
      error: 'Could not generate product details. Please fill in manually.'
    }
  }

  return { success: true, data: productDetails }
}
```

### Pattern 3: Multi-Step Onboarding with Database Persistence

**What:** Track onboarding progress in database, resume on return visits
**When to use:** Always - ensures users can resume where they left off

```typescript
// src/actions/onboarding.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingStep = 'persona' | 'telegram' | 'product'

export async function getOnboardingState() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      onboarding_completed,
      onboarding_step,
      persona:personas(id),
      telegram:telegram_connections(id),
      products(id)
    `)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  // Determine current step based on what's completed
  const hasPersona = profile?.persona !== null
  const hasTelegram = profile?.telegram !== null
  const hasProduct = (profile?.products?.length ?? 0) > 0

  let currentStep: OnboardingStep = 'persona'
  if (hasPersona && !hasTelegram && !hasProduct) currentStep = 'telegram'
  if (hasPersona && hasProduct) currentStep = 'product' // At final step

  // Override with saved step if user explicitly navigated
  if (profile?.onboarding_step) {
    currentStep = profile.onboarding_step as OnboardingStep
  }

  return { currentStep, hasPersona, hasTelegram, hasProduct }
}

export async function completeOnboarding() {
  const supabase = await createClient()

  await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id)

  redirect('/dashboard')
}
```

### Pattern 4: QR Code with Deep Link

**What:** Display QR code for mobile users to scan and connect Telegram
**When to use:** Telegram step of onboarding

```tsx
// src/components/onboarding/telegram-step.tsx
'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TelegramStepProps {
  deepLink: string
  onCheckConnection: () => Promise<boolean>
  onSkip: () => void
}

export function TelegramStep({ deepLink, onCheckConnection, onSkip }: TelegramStepProps) {
  const [checking, setChecking] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    const isConnected = await onCheckConnection()
    setConnected(isConnected)
    setChecking(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Connect Telegram</h2>
        <p className="text-muted-foreground">
          Scan the QR code with your phone or click the button below
        </p>
      </div>

      <div className="flex justify-center">
        <QRCodeSVG value={deepLink} size={200} />
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild variant="outline">
          <a href={deepLink} target="_blank" rel="noopener noreferrer">
            Open in Telegram
          </a>
        </Button>

        <Button onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking...' : 'Check Connection'}
        </Button>

        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>

      {connected && (
        <p className="text-center text-green-600">
          Telegram connected successfully!
        </p>
      )}
    </div>
  )
}
```

### Pattern 5: Inline Skeleton Loading for Product Fields

**What:** Show skeleton placeholders while AI generates product details
**When to use:** After user submits URL, while waiting for Firecrawl + OpenAI

```tsx
// src/components/onboarding/product-step.tsx (partial)
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ProductFormProps {
  loading: boolean
  data: {
    name: string
    description: string
    keywords: string[]
    subreddits: string[]
  } | null
}

export function ProductForm({ loading, data }: ProductFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Product Name</label>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Input defaultValue={data?.name} placeholder="e.g., Acme Analytics" />
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <Textarea
            defaultValue={data?.description}
            placeholder="Brief description of your product..."
          />
        )}
      </div>

      {/* Keywords and subreddits fields follow same pattern */}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Don't poll for Telegram connection:** Use manual "Check Connection" button per CONTEXT.md decision, not WebSockets or intervals
- **Don't skip URL requirement:** Per CONTEXT.md, URL is required to start adding a product (even if scraping fails)
- **Don't block on scraping failure:** Show error toast + inline hints, allow manual fill
- **Don't create separate pages per step:** Use single page with step state for simpler navigation
- **Don't store connection tokens permanently:** Generate short-lived tokens (15-30 min expiry)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telegram bot handling | Raw HTTP API calls | grammY | Middleware, type safety, session management |
| Web scraping with JS rendering | Puppeteer/Playwright | Firecrawl | Handles anti-bot, proxies, rate limits |
| Structured AI output parsing | Manual JSON.parse | zodResponseFormat | Type-safe, automatic schema conversion |
| QR code generation | Canvas manipulation | qrcode.react | Handles error correction, sizing |
| Multi-step form validation | Manual state tracking | react-hook-form with FormProvider | Shared state across steps |
| Exponential backoff/retry | Custom retry loops | Firecrawl SDK built-in | Handles 429, 5xx automatically |

**Key insight:** All three external APIs (Telegram, Firecrawl, OpenAI) have official SDKs with TypeScript support. Use them instead of raw HTTP calls.

## Common Pitfalls

### Pitfall 1: Telegram Webhook Not Receiving Updates

**What goes wrong:** Bot doesn't respond to /start commands
**Why it happens:** Webhook URL not set, or Next.js caching responses
**How to avoid:**
1. Set `export const dynamic = 'force-dynamic'` in route.ts
2. Register webhook with `curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/telegram/webhook`
3. Only HTTPS with valid cert works for webhooks
**Warning signs:** Bot works with polling but not webhooks

### Pitfall 2: Firecrawl Returns Empty Content

**What goes wrong:** Scrape returns but content is blank or minimal
**Why it happens:** Site blocks scraping, heavy JS rendering, or paywall
**How to avoid:**
1. Always check `result.markdown` is not empty
2. Show graceful fallback with manual entry option
3. Consider timeout parameter for slow sites
**Warning signs:** Works for some URLs but not others

### Pitfall 3: OpenAI Schema Validation Errors

**What goes wrong:** `zodResponseFormat` throws during parsing
**Why it happens:** Zod schema incompatible with JSON Schema subset OpenAI supports
**How to avoid:**
1. Use only basic Zod types (string, number, boolean, array, object)
2. Avoid `.optional()` at top level
3. Test schema with small prompts first
**Warning signs:** "Invalid schema" errors in console

### Pitfall 4: Deep Link Token Reuse Attack

**What goes wrong:** Attacker uses intercepted token to link their Telegram to victim's account
**Why it happens:** Tokens don't expire or aren't single-use
**How to avoid:**
1. Generate cryptographically random tokens (nanoid or crypto.randomUUID)
2. Set short expiry (15-30 minutes)
3. Delete token after successful use
4. Verify token belongs to requesting user
**Warning signs:** Users report wrong Telegram accounts linked

### Pitfall 5: Onboarding State Race Condition

**What goes wrong:** User completes step but state doesn't update before navigation
**Why it happens:** Optimistic UI without waiting for database confirmation
**How to avoid:**
1. Use Server Actions with proper await
2. Don't navigate until action confirms success
3. Use `revalidatePath` after state updates
**Warning signs:** Steps show as incomplete after refresh

### Pitfall 6: Product Keywords/Subreddits as Single String

**What goes wrong:** AI returns comma-separated string instead of array
**Why it happens:** Schema description unclear, model interprets loosely
**How to avoid:**
1. Use `.array(z.string())` in Zod schema
2. Include clear examples in system prompt
3. Handle both array and string in fallback parsing
**Warning signs:** Type errors when mapping over keywords

## Code Examples

Verified patterns from official sources:

### Firecrawl Basic Scrape

```typescript
// Source: https://github.com/firecrawl/firecrawl
import Firecrawl from '@mendable/firecrawl-js'

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! })

const result = await firecrawl.scrape('https://example.com', {
  formats: ['markdown', 'html'],
})

console.log(result.markdown)
```

### OpenAI Structured Output with Zod

```typescript
// Source: https://github.com/openai/openai-node/blob/master/helpers.md
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
})

const client = new OpenAI()

const completion = await client.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'Extract product information.' },
    { role: 'user', content: websiteContent },
  ],
  response_format: zodResponseFormat(ProductSchema, 'product'),
})

const product = completion.choices[0]?.message?.parsed
```

### grammY Webhook Handler for Next.js

```typescript
// Source: https://www.launchfa.st/blog/telegram-nextjs-app-router
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { Bot, webhookCallback } from 'grammy'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('start', async (ctx) => {
  const payload = ctx.match // Deep link parameter
  await ctx.reply(`Received: ${payload}`)
})

export const POST = webhookCallback(bot, 'std/http')
```

### QR Code Generation

```tsx
// Source: https://github.com/zpao/qrcode.react
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG
  value="https://t.me/mybot?start=token123"
  size={200}
  bgColor="#ffffff"
  fgColor="#000000"
/>
```

## Database Schema

New tables needed for Phase 2:

```sql
-- Personas table
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expertise TEXT,
  tone TEXT, -- 'professional' | 'casual' | 'friendly' | 'technical' | 'witty' | custom text
  phrases_to_avoid TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- One persona per user
);

-- Telegram connections table
CREATE TABLE public.telegram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  telegram_user_id BIGINT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id), -- One connection per user
  UNIQUE(telegram_chat_id) -- One user per chat
);

-- Connection tokens (temporary, for deep link flow)
CREATE TABLE public.telegram_connection_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  keywords TEXT[] DEFAULT '{}',
  subreddits TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connection_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- User can only access own data
CREATE POLICY "Users can manage own persona" ON public.personas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own telegram connection" ON public.telegram_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tokens" ON public.telegram_connection_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Add onboarding_step to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'persona';

-- Index for token lookup (no user context in webhook)
CREATE INDEX idx_telegram_tokens_token ON public.telegram_connection_tokens(token);
CREATE INDEX idx_telegram_connections_chat_id ON public.telegram_connections(telegram_chat_id);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-telegram-bot-api | grammY | 2024 | TypeScript-native, better middleware |
| Manual JSON parsing for AI | zodResponseFormat | 2024 | Type-safe structured outputs |
| Custom web scraping | Firecrawl API | 2024-2025 | Handles anti-bot, JS rendering |
| GPT-4 for all tasks | GPT-4o-mini | 2024 | 60%+ cheaper, good for structured extraction |
| Separate pages per wizard step | Single page with state | 2024 | Simpler routing, shared form context |

**Deprecated/outdated:**
- `node-telegram-bot-api`: No TypeScript, event-emitter architecture
- Manual polling in web UI for state changes: Use Server Actions + revalidation
- GPT-3.5 Turbo: GPT-4o-mini is cheaper and better

## Open Questions

Things that couldn't be fully resolved:

1. **Telegram webhook SSL for local development**
   - What we know: Webhooks require HTTPS with valid certificate
   - What's unclear: Best local dev approach (ngrok, cloudflared, or use polling locally)
   - Recommendation: Use long polling for local dev, webhooks for production

2. **Firecrawl rate limits on free tier**
   - What we know: Firecrawl has rate limits, built-in retry handles 429
   - What's unclear: Exact limits on free/paid tiers
   - Recommendation: Implement loading state, timeout after 30s, fallback to manual

3. **Token cleanup strategy**
   - What we know: Connection tokens should expire
   - What's unclear: Cron job vs on-demand cleanup
   - Recommendation: Delete expired tokens when generating new ones (lazy cleanup)

## Sources

### Primary (HIGH confidence)
- [grammY Official Docs](https://grammy.dev/guide/) - Bot setup, webhooks, middleware
- [grammY Commands Guide](https://grammy.dev/guide/commands) - Deep link parameter handling
- [Telegram Bot Features](https://core.telegram.org/bots/features) - Deep link format, start parameters
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - zodResponseFormat usage
- [OpenAI Node SDK Helpers](https://github.com/openai/openai-node/blob/master/helpers.md) - Zod integration examples
- [Firecrawl GitHub](https://github.com/firecrawl/firecrawl) - SDK usage, Zod extraction
- [qrcode.react](https://github.com/zpao/qrcode.react) - QR code component usage
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy patterns

### Secondary (MEDIUM confidence)
- [grammY with Next.js App Router](https://www.launchfa.st/blog/telegram-nextjs-app-router) - Webhook setup for Next.js
- [grammY vs node-telegram-bot-api](https://grammy.dev/resources/comparison) - Framework comparison
- [shadcn Multi-Step Form](https://shadcn-ui-multi-form.vercel.app/) - Multi-step form patterns
- [React State Management 2025](https://www.developerway.com/posts/react-state-management-2025) - URL state with nuqs

### Tertiary (LOW confidence)
- Firecrawl Zod schema issues (GitHub issues #1836, #2072) - May need manual JSON schema conversion

## Metadata

**Confidence breakdown:**
- Telegram integration: HIGH - grammY well-documented, patterns verified
- Firecrawl integration: HIGH - Official SDK with clear examples
- OpenAI structured outputs: HIGH - Official helper with Zod support
- Onboarding flow: HIGH - Standard patterns, shadcn/ui components
- Database schema: MEDIUM - RLS patterns from Phase 1, needs testing

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - APIs stable)

---

## Implementation Notes for Planner

Per CONTEXT.md user decisions that must be reflected in plans:

1. **Step order:** product -> Telegram -> person (fixed)
2. **Stepper bar:** Show at top with current position (Step X of 3)
3. **Telegram optional:** Can skip, connect later from settings
4. **Persona required:** Four fields - expertise, tone, phrases to avoid, target audience
5. **Tone presets:** Dropdown with Professional, Casual, Friendly, Technical, Witty + Custom
6. **Product URL required:** Must enter URL to start (even if scraping fails)
7. **Loading UX:** Inline skeleton loading for product fields
8. **Scrape failure:** Toast notification AND inline hints on affected fields
9. **Connection check:** Manual "Check Connection" button (no websocket/polling)
10. **QR + deep link:** Show QR for mobile, button for desktop
11. **Welcome message:** Detailed, explains notifications and action buttons
12. **Resume flow:** If user abandons, resume at exact step on next login

**Claude's discretion areas:**
- Whether to pre-fill default persona values
- Exact tone preset options (list given, can adjust)
- Stepper bar visual design
- Error message wording
- Skeleton animation style
