# Phase 3: Monitoring Engine - Research

**Researched:** 2026-01-26
**Domain:** Reddit monitoring, AI classification, Vercel cron jobs
**Confidence:** HIGH

## Summary

This phase implements an automated Reddit monitoring system that discovers opportunities for user products. The system polls Reddit for new posts in configured subreddits, filters by keywords, classifies post intent via AI (pain point vs recommendation request), and generates persona-driven draft replies.

The architecture follows a cron-based polling pattern using Vercel's built-in cron job system, which triggers a Next.js API route every 15 minutes. Reddit data is fetched via the public JSON API (no OAuth required for public posts), processed through OpenAI for classification and reply generation, and stored in Supabase with proper deduplication.

**Primary recommendation:** Use Vercel cron + Next.js route handler for polling, Reddit `.json` API for fetching posts, OpenAI structured outputs with `zodResponseFormat` for classification (reusing existing pattern), and a `mentions` table with composite unique constraint on `(product_id, reddit_post_id)` for deduplication.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel Cron | Built-in | 15-minute scheduled polling | Native to platform, zero config beyond vercel.json |
| Reddit JSON API | N/A | Fetch public posts | No OAuth needed, simple `.json` URL append |
| openai | ^6.16.0 | AI classification & reply generation | Already in project, `zodResponseFormat` pattern established |
| zod | ^4.3.5 | Schema validation for AI outputs | Already in project, type-safe structured outputs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.91.0 | Database operations | Already in project, RLS configured |

### No New Dependencies Required

This phase reuses existing dependencies:
- `openai` + `zod` for AI (existing)
- `@supabase/supabase-js` for database (existing)
- Native `fetch` for Reddit API (built-in)

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── cron/
│           └── monitor/
│               └── route.ts     # Cron endpoint for polling
├── lib/
│   ├── reddit/
│   │   └── client.ts            # Reddit JSON API client
│   └── openai/
│       └── client.ts            # Extend with classification + reply generation
├── actions/
│   └── mentions.ts              # Mention CRUD operations
└── app/(protected)/
    └── mentions/
        ├── page.tsx             # Mentions list with filters
        └── [id]/
            └── page.tsx         # Mention detail view
```

### Pattern 1: Vercel Cron Job Configuration

**What:** Configure vercel.json for 15-minute polling intervals
**When to use:** All scheduled background tasks

**Configuration (vercel.json):**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/monitor",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Secured Route Handler:**
```typescript
// Source: Vercel docs - Managing Cron Jobs
// app/api/cron/monitor/route.ts
import type { NextRequest } from 'next/server';

export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Process monitoring logic here
    const result = await runMonitoringCycle();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Monitoring error:', error);
    return Response.json({ success: false, error: 'Monitoring failed' }, { status: 500 });
  }
}
```

### Pattern 2: Reddit JSON API Fetching

**What:** Fetch new posts from subreddits using public JSON API
**When to use:** Polling Reddit for new content

**Example:**
```typescript
// Source: Reddit JSON API documentation
// lib/reddit/client.ts

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
  url: string;
  is_self: boolean;
}

interface RedditListingResponse {
  kind: 'Listing';
  data: {
    children: Array<{
      kind: 't3';
      data: RedditPost;
    }>;
    after: string | null;
    before: string | null;
  };
}

export interface FetchResult {
  success: boolean;
  posts: RedditPost[];
  error?: string;
}

const USER_AGENT = 'AudyBot/1.0 (Reddit Monitoring)';

export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<FetchResult> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, posts: [], error: 'Rate limited by Reddit' };
      }
      if (response.status === 403 || response.status === 404) {
        // Private or banned subreddit - skip silently per context decisions
        return { success: true, posts: [] };
      }
      return { success: false, posts: [], error: `HTTP ${response.status}` };
    }

    const data: RedditListingResponse = await response.json();
    const posts = data.data.children.map(child => child.data);

    return { success: true, posts };
  } catch (error) {
    return {
      success: false,
      posts: [],
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
    };
  }
}

export function filterPostsByKeywords(
  posts: RedditPost[],
  keywords: string[]
): RedditPost[] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  return posts.filter(post => {
    const searchText = `${post.title} ${post.selftext}`.toLowerCase();
    return lowerKeywords.some(keyword => searchText.includes(keyword));
  });
}
```

### Pattern 3: AI Classification with Confidence Score

**What:** Classify post intent using OpenAI structured outputs
**When to use:** Determining if a post is a pain point or recommendation request

**Schema Definition:**
```typescript
// Source: OpenAI structured outputs + existing codebase pattern
// lib/validations/mention.ts
import { z } from 'zod';

export const PostIntentSchema = z.object({
  intent: z.enum(['pain_point', 'recommendation_request', 'not_relevant'])
    .describe('The primary intent of the post'),
  confidence: z.number().min(0).max(100)
    .describe('Confidence score as percentage (0-100)'),
  reasoning: z.string()
    .describe('Brief explanation of why this classification was chosen'),
});

export type PostIntent = z.infer<typeof PostIntentSchema>;
```

**Classification Function:**
```typescript
// lib/openai/client.ts (extend existing)
import { zodResponseFormat } from 'openai/helpers/zod';
import { PostIntentSchema, type PostIntent } from '@/lib/validations/mention';

export interface ClassificationResult {
  success: boolean;
  data: PostIntent | null;
  error?: string;
}

export async function classifyPostIntent(
  title: string,
  content: string,
  productContext: { name: string; description: string; keywords: string[] }
): Promise<ClassificationResult> {
  if (!openai) {
    return { success: false, data: null, error: 'OpenAI not configured' };
  }

  try {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing Reddit posts to identify potential customers.

Classify posts into one of these intents:
- "pain_point": User is expressing frustration, struggling with a problem, or seeking help
- "recommendation_request": User is explicitly asking for product/tool/service recommendations
- "not_relevant": Post doesn't indicate a need that could be addressed by products like the one described

Product context:
- Name: ${productContext.name}
- Description: ${productContext.description}
- Keywords: ${productContext.keywords.join(', ')}

Be balanced in your assessment:
- Look for clear signals but also consider implied needs
- Higher confidence (75%+) for explicit requests or clear pain expressions
- Medium confidence (50-74%) for posts that suggest potential interest
- Lower confidence (<50%) for ambiguous cases

All posts with pain_point or recommendation_request intent will be shown to the user, even with low confidence. They can discard irrelevant ones.`
        },
        {
          role: 'user',
          content: `Analyze this Reddit post:

Title: ${title}

Content: ${content || '(no body text)'}

Classify the intent and provide your confidence level.`
        }
      ],
      response_format: zodResponseFormat(PostIntentSchema, 'post_intent'),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return { success: false, data: null, error: 'Failed to parse classification' };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Classification failed',
    };
  }
}
```

### Pattern 4: Persona-Driven Reply Generation

**What:** Generate helpful, natural replies that softly mention the product
**When to use:** Creating draft replies for qualifying posts

**Schema Definition:**
```typescript
// lib/validations/mention.ts (extend)
export const DraftReplySchema = z.object({
  reply: z.string()
    .describe('The draft reply text, plain text only (no markdown)'),
});

export type DraftReply = z.infer<typeof DraftReplySchema>;
```

**Reply Generation Function:**
```typescript
// lib/openai/client.ts (extend existing)
import { DraftReplySchema, type DraftReply } from '@/lib/validations/mention';

export interface ReplyGenerationResult {
  success: boolean;
  data: DraftReply | null;
  error?: string;
}

export async function generateDraftReply(
  post: { title: string; content: string },
  product: { name: string; description: string; url?: string },
  persona: { expertise?: string; tone?: string; phrases_to_avoid?: string }
): Promise<ReplyGenerationResult> {
  if (!openai) {
    return { success: false, data: null, error: 'OpenAI not configured' };
  }

  // Estimate post length for adaptive response
  const postLength = (post.title + post.content).length;
  const lengthGuidance = postLength < 200
    ? 'Keep your reply concise (2-3 sentences)'
    : postLength < 500
    ? 'Match the moderate length of the post (3-5 sentences)'
    : 'Provide a thoughtful, detailed response matching the depth of the post';

  try {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are writing a helpful Reddit reply on behalf of someone with this profile:
${persona.expertise ? `- Expertise: ${persona.expertise}` : ''}
${persona.tone ? `- Communication style: ${persona.tone}` : '- Communication style: helpful and friendly'}
${persona.phrases_to_avoid ? `- Avoid these phrases: ${persona.phrases_to_avoid}` : ''}

Guidelines:
1. ${lengthGuidance}
2. Focus on genuinely helping with their problem first
3. Only mention the product naturally at the end if it's relevant to solving their problem
4. Use plain text only - no markdown, no bullet points, no formatting
5. Sound like a real person sharing advice, not a marketing message
6. If mentioning the product, be subtle: "I've had good results with [product]" not "You should try [product]!"

Product to potentially mention:
- Name: ${product.name}
- What it does: ${product.description}
${product.url ? `- URL: ${product.url}` : ''}`
        },
        {
          role: 'user',
          content: `Write a helpful reply to this post:

Title: ${post.title}

${post.content || '(no body text)'}`
        }
      ],
      response_format: zodResponseFormat(DraftReplySchema, 'draft_reply'),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return { success: false, data: null, error: 'Failed to generate reply' };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Reply generation error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Reply generation failed',
    };
  }
}
```

### Pattern 5: Deduplication with Composite Key

**What:** Prevent processing the same Reddit post twice for the same product
**When to use:** Before creating mentions

**Database approach:**
```sql
-- Composite unique constraint prevents duplicates
CREATE UNIQUE INDEX idx_mentions_product_post
ON mentions(product_id, reddit_post_id);
```

**Code approach:**
```typescript
// Using Supabase upsert or checking before insert
async function createMentionIfNotExists(
  productId: string,
  redditPostId: string,
  mentionData: MentionInsert
): Promise<{ created: boolean; mention: Mention | null }> {
  // Check if already exists
  const { data: existing } = await supabase
    .from('mentions')
    .select('id')
    .eq('product_id', productId)
    .eq('reddit_post_id', redditPostId)
    .single();

  if (existing) {
    return { created: false, mention: null };
  }

  // Insert new mention
  const { data: mention, error } = await supabase
    .from('mentions')
    .insert(mentionData)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      return { created: false, mention: null };
    }
    throw error;
  }

  return { created: true, mention };
}
```

### Anti-Patterns to Avoid

- **Don't use Reddit OAuth for public data**: The `.json` API works for public subreddits without authentication complexity
- **Don't poll too frequently**: 15-minute intervals are reasonable; more frequent polling risks rate limits
- **Don't store raw Reddit HTML**: Store the permalink and essential fields only
- **Don't block on classification failures**: Log errors and continue with other posts
- **Don't forget User-Agent**: Reddit blocks requests without proper User-Agent header

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scheduled execution | Custom interval timer | Vercel Cron | Handles failures, retries, monitoring |
| Reddit API client | Raw fetch wrapper | Structured client with error handling | Rate limits, error codes, edge cases |
| AI structured outputs | Manual JSON parsing | `zodResponseFormat` | Guaranteed schema compliance |
| Deduplication | In-memory tracking | Database unique constraint | Survives restarts, scales |
| Status management | String comparisons | Enum/type with validation | Type safety, prevents typos |

**Key insight:** Vercel Cron + Supabase constraints + OpenAI structured outputs handle the hard problems. Focus on business logic, not infrastructure.

## Common Pitfalls

### Pitfall 1: Reddit Rate Limiting
**What goes wrong:** API returns 429 Too Many Requests
**Why it happens:** Missing User-Agent or too many requests
**How to avoid:** Always set custom User-Agent, respect 15-minute polling interval
**Warning signs:** Intermittent failures, empty results

### Pitfall 2: Private/Banned Subreddit Errors
**What goes wrong:** Errors shown to users for inaccessible subreddits
**Why it happens:** User configured a private or banned subreddit
**How to avoid:** Handle 403/404 silently, return empty posts (per CONTEXT.md decision)
**Warning signs:** Consistent failures for specific subreddits

### Pitfall 3: Long-Running Cron Jobs
**What goes wrong:** Function times out before completing
**Why it happens:** Too many products/subreddits to process in one invocation
**How to avoid:** Set `maxDuration = 60`, process in batches, consider parallel fetching
**Warning signs:** Partial processing, timeout errors in logs

### Pitfall 4: Duplicate Mentions from Race Conditions
**What goes wrong:** Same Reddit post creates multiple mentions
**Why it happens:** Cron job runs while previous is still processing
**How to avoid:** Use database unique constraint, upsert pattern
**Warning signs:** Duplicate entries in mentions table

### Pitfall 5: Missing Cron Secret Validation
**What goes wrong:** Anyone can trigger the monitoring endpoint
**Why it happens:** Forgot to validate CRON_SECRET header
**How to avoid:** Always check `Authorization: Bearer <CRON_SECRET>`
**Warning signs:** Unexpected invocations, potential abuse

### Pitfall 6: AI Classification Failures Blocking Pipeline
**What goes wrong:** One failed classification stops all processing
**Why it happens:** Not handling AI errors gracefully
**How to avoid:** Wrap classification in try/catch, log and continue
**Warning signs:** Incomplete processing runs

## Code Examples

### Complete Monitoring Cycle

```typescript
// app/api/cron/monitor/route.ts
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchSubredditPosts, filterPostsByKeywords } from '@/lib/reddit/client';
import { classifyPostIntent, generateDraftReply } from '@/lib/openai/client';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const stats = { products: 0, posts: 0, mentions: 0 };

  try {
    // 1. Get all products with their user's persona
    const { data: products } = await supabase
      .from('products')
      .select(`
        id, user_id, name, description, keywords, subreddits,
        personas!inner(expertise, tone, phrases_to_avoid)
      `);

    if (!products?.length) {
      return Response.json({ success: true, message: 'No products to monitor' });
    }

    stats.products = products.length;

    // 2. Process each product
    for (const product of products) {
      // Fetch posts from all configured subreddits
      for (const subreddit of product.subreddits) {
        const fetchResult = await fetchSubredditPosts(subreddit);
        if (!fetchResult.success) continue;

        // Filter by keywords
        const relevant = filterPostsByKeywords(fetchResult.posts, product.keywords);
        stats.posts += relevant.length;

        // Process each relevant post
        for (const post of relevant) {
          // Check if already processed (deduplication)
          const { data: existing } = await supabase
            .from('mentions')
            .select('id')
            .eq('product_id', product.id)
            .eq('reddit_post_id', post.id)
            .single();

          if (existing) continue;

          // Classify intent
          const classification = await classifyPostIntent(
            post.title,
            post.selftext,
            { name: product.name, description: product.description, keywords: product.keywords }
          );

          if (!classification.success) continue;
          if (classification.data?.intent === 'not_relevant') continue;

          // Generate draft reply
          const reply = await generateDraftReply(
            { title: post.title, content: post.selftext },
            { name: product.name, description: product.description, url: product.url },
            product.personas
          );

          // Create mention
          await supabase.from('mentions').insert({
            product_id: product.id,
            user_id: product.user_id,
            reddit_post_id: post.id,
            reddit_permalink: `https://reddit.com${post.permalink}`,
            reddit_title: post.title,
            reddit_content: post.selftext,
            reddit_author: post.author,
            reddit_subreddit: post.subreddit,
            reddit_created_at: new Date(post.created_utc * 1000).toISOString(),
            intent: classification.data?.intent,
            confidence: classification.data?.confidence,
            draft_reply: reply.data?.reply || null,
            status: 'pending',
          });

          stats.mentions++;
        }
      }
    }

    // Update last_checked timestamp
    await supabase.rpc('update_monitoring_timestamp');

    return Response.json({ success: true, stats });
  } catch (error) {
    console.error('Monitoring error:', error);
    return Response.json({ success: false, error: 'Monitoring failed' }, { status: 500 });
  }
}
```

### Mentions List Page Pattern

```typescript
// app/(protected)/mentions/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface MentionsPageProps {
  searchParams: Promise<{ status?: string; product?: string }>;
}

export default async function MentionsPage({ searchParams }: MentionsPageProps) {
  const { status, product } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  let query = supabase
    .from('mentions')
    .select(`
      *,
      products(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (product) {
    query = query.eq('product_id', product);
  }

  const { data: mentions } = await query;

  // ... render component
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reddit OAuth required | Public JSON API works | N/A | Simpler, no token refresh |
| Manual JSON parsing | zodResponseFormat | OpenAI SDK 4.0+ | Type-safe, guaranteed schema |
| External cron services | Vercel Cron | 2023 | Integrated, no extra service |
| Hobby plan 10s timeout | Fluid Compute 300s default | 2024 | More processing time |

**Deprecated/outdated:**
- PRAW (Python Reddit API Wrapper): Overkill for simple polling, requires OAuth
- Reddit RSS feeds: Less reliable than JSON API, limited fields

## Open Questions

Things that couldn't be fully resolved:

1. **Reddit API Reliability at Scale**
   - What we know: Public JSON API works, has rate limits (~100 req/10min unauthenticated)
   - What's unclear: Behavior under sustained load, IP-based vs user-agent rate limiting
   - Recommendation: Start with current approach, monitor for 429 errors, consider OAuth if issues arise

2. **AI Cost Optimization**
   - What we know: gpt-4o-mini is cost-efficient (~$0.15/1M input tokens)
   - What's unclear: Exact cost per monitoring cycle depends on post volume
   - Recommendation: Log token usage, set alerts, consider batching if costs rise

3. **Hobby Plan Cron Precision**
   - What we know: Hobby plan has hourly precision (job runs sometime within the hour)
   - What's unclear: Whether 15-minute schedule is honored or approximate
   - Recommendation: Test on actual deployment, document observed behavior

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) - Configuration, security, limits
- [Vercel Cron Jobs - Managing](https://vercel.com/docs/cron-jobs/manage-cron-jobs) - CRON_SECRET validation
- [Vercel Function Duration](https://vercel.com/docs/functions/configuring-functions/duration) - maxDuration configuration

### Secondary (MEDIUM confidence)
- [Simon Willison - Scraping Reddit via JSON API](https://til.simonwillison.net/reddit/scraping-reddit-json) - User-Agent requirements
- [JC Chouinard - Reddit API Documentation](https://www.jcchouinard.com/documentation-on-reddit-apis-json/) - Response structure
- [OpenAI Node SDK helpers.md](https://github.com/openai/openai-node/blob/master/helpers.md) - zodResponseFormat usage
- [Using Zod and zodResponseFormat](https://hooshmand.net/zod-zodresponseformat-structured-outputs-openai/) - Implementation patterns

### Tertiary (LOW confidence)
- Reddit official Data API Wiki mentions OAuth requirement, but practical testing shows public JSON works for read-only public data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project or well-documented
- Architecture: HIGH - Patterns verified against official docs and existing codebase
- Pitfalls: MEDIUM - Based on documented issues and community experience

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain, well-documented stack)
