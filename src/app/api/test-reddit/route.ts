// TEMPORARY: Test Reddit API access from Vercel cloud IPs
// Delete this file after testing

export async function GET() {
  const results: Record<string, unknown>[] = []
  const subreddits = ['SaaS', 'startups', 'Entrepreneur']

  // Test 1: Public JSON API (no OAuth)
  for (const sub of subreddits) {
    const start = Date.now()
    try {
      const url = `https://www.reddit.com/r/${sub}/new.json?limit=5`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AudyBot/1.0 (Reddit Monitoring)',
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })

      const elapsed = Date.now() - start
      const text = await res.text()

      let postCount = 0
      let firstTitle = ''
      try {
        const data = JSON.parse(text)
        const posts = data?.data?.children || []
        postCount = posts.length
        if (posts[0]) {
          firstTitle = posts[0].data?.title?.substring(0, 60) || ''
        }
      } catch {
        // not JSON
      }

      results.push({
        method: 'public_json',
        subreddit: sub,
        status: res.status,
        posts: postCount,
        elapsed,
        sample: firstTitle,
        contentType: res.headers.get('content-type'),
        rateRemaining: res.headers.get('x-ratelimit-remaining'),
        bodyPreview: postCount === 0 ? text.substring(0, 200) : undefined,
      })
    } catch (e) {
      results.push({
        method: 'public_json',
        subreddit: sub,
        status: 'ERROR',
        error: e instanceof Error ? e.message : String(e),
        elapsed: Date.now() - start,
      })
    }

    // Small delay
    await new Promise(r => setTimeout(r, 300))
  }

  // Test 2: OAuth token (check if credentials exist)
  const hasOAuth = Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET)
  results.push({
    method: 'oauth_check',
    hasCredentials: hasOAuth,
    clientIdSet: Boolean(process.env.REDDIT_CLIENT_ID),
    clientSecretSet: Boolean(process.env.REDDIT_CLIENT_SECRET),
  })

  // Summary
  const publicResults = results.filter(r => r.method === 'public_json')
  const totalPosts = publicResults.reduce((sum, r) => sum + (Number(r.posts) || 0), 0)
  const anyBlocked = publicResults.some(r => r.status === 403 || r.status === 429)

  return Response.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalPosts,
      anyBlocked,
      publicApiWorks: totalPosts > 0,
      hasOAuthCredentials: hasOAuth,
    },
    results,
  })
}
