/**
 * Reddit JSON API client for public subreddit monitoring.
 * Uses Reddit's public JSON API (no OAuth required for read-only access).
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

export interface FetchResult {
  success: boolean
  posts: RedditPost[]
  error?: string
}

const USER_AGENT = 'AudyBot/1.0 (Reddit Monitoring)'

/**
 * Fetches new posts from a subreddit using Reddit's public JSON API.
 *
 * @param subreddit - Subreddit name without r/ prefix (e.g., "SaaS")
 * @param limit - Maximum number of posts to fetch (default: 25, max: 100)
 * @returns FetchResult with posts array or error message
 *
 * Note: Private/banned subreddits return empty posts array (not error)
 * to allow silent skipping in monitoring loops.
 */
export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<FetchResult> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // Disable Next.js caching
    })

    // Handle rate limiting
    if (response.status === 429) {
      return {
        success: false,
        posts: [],
        error: 'Rate limited by Reddit',
      }
    }

    // Private/banned/nonexistent subreddits - return empty (silent skip)
    if (response.status === 403 || response.status === 404) {
      return {
        success: true,
        posts: [],
        error: `HTTP ${response.status} (private/banned)`,
      }
    }

    // Other HTTP errors
    if (!response.ok) {
      return {
        success: false,
        posts: [],
        error: `HTTP ${response.status}`,
      }
    }

    const text = await response.text()

    // Debug: check if we got valid JSON
    let data: RedditListingResponse
    try {
      data = JSON.parse(text)
    } catch {
      console.error('Reddit response not JSON:', text.substring(0, 500))
      return {
        success: false,
        posts: [],
        error: `Invalid JSON (${text.length} chars): ${text.substring(0, 100)}`,
      }
    }

    // Extract posts from Reddit's listing structure
    const posts = data.data?.children?.map((child) => child.data) || []
    const rawResponse = JSON.stringify(data).substring(0, 150)

    return {
      success: true,
      posts,
      error: `HTTP ${response.status}, children=${data.data?.children?.length || 0}, raw:${rawResponse}`,
    }
  } catch (error) {
    // Network errors or JSON parsing errors
    console.error('Reddit fetch error:', error)
    return {
      success: false,
      posts: [],
      error: error instanceof Error ? error.message : 'Failed to fetch subreddit',
    }
  }
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
