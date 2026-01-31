/**
 * Reddit client for subreddit monitoring.
 *
 * Strategy:
 * 1. Try Reddit's public JSON API (free, no auth required)
 * 2. If blocked (403/429), fall back to ScrapeCreators API (paid)
 */

export interface RedditPost {
  id: string           // Reddit's post ID (e.g., "1abc23d")
  title: string
  selftext: string     // Post body (empty string for link posts)
  author: string
  subreddit: string    // Without r/ prefix
  permalink: string    // e.g., "/r/SaaS/comments/abc123/title/"
  created_utc: number  // Unix timestamp
  score: number
  num_comments: number
  url: string          // For link posts, the external URL
  is_self: boolean     // true for text posts
}

interface RedditListingResponse {
  kind: 'Listing'
  data: {
    children: Array<{
      kind: 't3'  // t3 = post
      data: RedditPost
    }>
    after: string | null
    before: string | null
  }
}

interface ScrapeCreatorsResponse {
  posts: RedditPost[]
  after: string | null
}

export interface FetchResult {
  success: boolean
  posts: RedditPost[]
  error?: string
  source?: 'public' | 'scrapecreators'
}

const USER_AGENT = 'AudyBot/1.0 (Reddit Monitoring)'

/**
 * Fetch posts from Reddit's public JSON API (no auth required).
 * Returns null on 403/429 to signal that fallback should be tried.
 */
async function fetchFromPublicApi(
  subreddit: string,
  limit: number
): Promise<FetchResult | null> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    // Blocked or rate limited — signal fallback
    if (response.status === 403 || response.status === 429) {
      return null
    }

    // Private/banned/nonexistent subreddits — silent skip
    if (response.status === 404) {
      return { success: true, posts: [], source: 'public' }
    }

    if (!response.ok) {
      return { success: false, posts: [], error: `HTTP ${response.status}`, source: 'public' }
    }

    const text = await response.text()

    let data: RedditListingResponse
    try {
      data = JSON.parse(text)
    } catch {
      console.error('Reddit response not JSON:', text.substring(0, 500))
      return null // Try fallback on invalid response
    }

    const posts = data.data?.children?.map((child) => child.data) || []
    return { success: true, posts, source: 'public' }
  } catch (error) {
    console.error('Reddit public API error:', error)
    return null // Network error — try fallback
  }
}

/**
 * Fetch posts from ScrapeCreators API (paid fallback).
 * Requires SCRAPECREATORS_API_KEY environment variable.
 */
async function fetchFromScrapeCreators(
  subreddit: string,
): Promise<FetchResult> {
  const apiKey = process.env.SCRAPECREATORS_API_KEY
  if (!apiKey) {
    return {
      success: false,
      posts: [],
      error: 'SCRAPECREATORS_API_KEY not configured',
      source: 'scrapecreators',
    }
  }

  const url = `https://api.scrapecreators.com/v1/reddit/subreddit?subreddit=${encodeURIComponent(subreddit)}&sort=new&trim=true`

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('ScrapeCreators error:', response.status, text.substring(0, 200))
      return {
        success: false,
        posts: [],
        error: `ScrapeCreators HTTP ${response.status}`,
        source: 'scrapecreators',
      }
    }

    const data: ScrapeCreatorsResponse = await response.json()
    const posts: RedditPost[] = (data.posts || []).map((post) => ({
      id: post.id || '',
      title: post.title || '',
      selftext: post.selftext || '',
      author: post.author || '',
      subreddit: post.subreddit || subreddit,
      permalink: post.permalink || '',
      created_utc: post.created_utc || 0,
      score: post.score || 0,
      num_comments: post.num_comments || 0,
      url: post.url || '',
      is_self: post.is_self ?? true,
    }))

    return { success: true, posts, source: 'scrapecreators' }
  } catch (error) {
    console.error('ScrapeCreators fetch error:', error)
    return {
      success: false,
      posts: [],
      error: error instanceof Error ? error.message : 'ScrapeCreators request failed',
      source: 'scrapecreators',
    }
  }
}

/**
 * Fetches new posts from a subreddit.
 *
 * Uses a layered approach:
 * 1. Try Reddit's public JSON API (free, no auth)
 * 2. If blocked (403/429), fall back to ScrapeCreators (paid)
 *
 * @param subreddit - Subreddit name without r/ prefix (e.g., "SaaS")
 * @param limit - Maximum number of posts to fetch (default: 25, max: 100)
 * @returns FetchResult with posts array or error message
 */
export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<FetchResult> {
  // Try public API first
  const publicResult = await fetchFromPublicApi(subreddit, limit)

  // If public API returned a result (even empty), use it
  if (publicResult !== null) {
    return publicResult
  }

  // Public API blocked (403/429) or errored — try fallback
  console.warn(`Reddit public API blocked for r/${subreddit}, trying ScrapeCreators fallback`)
  return fetchFromScrapeCreators(subreddit)
}

/**
 * Filters posts by keywords (case-insensitive).
 * Searches both title and selftext (body) of posts.
 *
 * @param posts - Array of RedditPost objects
 * @param keywords - Array of keywords to search for
 * @returns Posts where any keyword appears in title or body
 */
export function filterPostsByKeywords(
  posts: RedditPost[],
  keywords: string[]
): RedditPost[] {
  if (keywords.length === 0) {
    return posts
  }

  const lowerKeywords = keywords.map((k) => k.toLowerCase())

  return posts.filter((post) => {
    const searchText = `${post.title} ${post.selftext}`.toLowerCase()
    return lowerKeywords.some((keyword) => searchText.includes(keyword))
  })
}
