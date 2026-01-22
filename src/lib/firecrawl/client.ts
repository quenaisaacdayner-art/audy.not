import Firecrawl from '@mendable/firecrawl-js'

const apiKey = process.env.FIRECRAWL_API_KEY
if (!apiKey) {
  console.warn('FIRECRAWL_API_KEY not set - scraping will fail')
}

const firecrawl = apiKey ? new Firecrawl({ apiKey }) : null

export interface ScrapeResult {
  success: boolean
  content: string | null
  error?: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  if (!firecrawl) {
    return {
      success: false,
      content: null,
      error: 'Firecrawl is not configured. Please set FIRECRAWL_API_KEY.'
    }
  }

  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    })

    // Check if we got meaningful content
    // Note: scrape() throws on error, returns Document directly on success
    if (!result.markdown || result.markdown.trim().length < 100) {
      return {
        success: false,
        content: null,
        error: 'Could not extract meaningful content from this URL.'
      }
    }

    return {
      success: true,
      content: result.markdown
    }
  } catch (error) {
    console.error('Firecrawl scrape error:', error)
    return {
      success: false,
      content: null,
      error: error instanceof Error ? error.message : 'Failed to scrape URL'
    }
  }
}
