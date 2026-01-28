/**
 * Reddit OAuth client for authenticated API access.
 * Uses client credentials flow (application-only auth) for read-only access.
 *
 * Reddit requires OAuth for all API requests from server IPs.
 * Free tier: 100 requests/minute for non-commercial use.
 */

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

// In-memory cache for access token (valid for ~1 hour)
let tokenCache: TokenCache | null = null

const USER_AGENT = 'AudyBot/1.0 (Reddit Monitoring by /u/audy_bot)'

/**
 * Gets a valid access token, fetching a new one if needed.
 * Uses client credentials flow (no user context, read-only public data).
 */
export async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 5 min buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.token
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Missing Reddit OAuth credentials')
    return null
  }

  try {
    // Basic auth with client_id:client_secret
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      console.error('Reddit OAuth error:', response.status, await response.text())
      return null
    }

    const data: TokenResponse = await response.json()

    // Cache the token
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error('Reddit OAuth fetch error:', error)
    return null
  }
}

/**
 * Clears the token cache (useful for testing or token refresh).
 */
export function clearTokenCache(): void {
  tokenCache = null
}
