import { createTool } from '@mastra/core'
import { z } from 'zod'
// Import duckduckgo-search as a module (no longer used)
// import duckduckgoSearch from 'duckduckgo-search'
import { search, SafeSearchType } from 'duck-duck-scrape'

// Define the input schema for the search tool
const searchInputSchema = z.object({
  query: z.string().min(1, 'Search query must not be empty'),
  maxResults: z.number().min(1).max(10).optional().default(5),
  region: z.string().optional().default('wt-wt'),
})

// Define the output schema for the search tool
const searchOutputSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string().optional(),
      position: z.number(),
      snippet: z.string().optional(),
      snippet_html: z.string().optional(),
      favicon: z.string().optional(),
      domain: z.string().optional(),
    })
  ),
  timestamp: z.string(),
})

// Helper function to add delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Create the search tool
export const searchTool = createTool({
  id: 'webSearch',
  description:
    'Performs web searches using DuckDuckGo and returns relevant results',
  inputSchema: searchInputSchema,
  outputSchema: searchOutputSchema,
  execute: async ({ context }) => {
    try {
      // Add retry logic with exponential backoff
      const maxRetries = 3
      let retryCount = 0
      let lastError

      while (retryCount < maxRetries) {
        try {
          // Add a delay before each request to avoid rate limiting
          // Increase delay with each retry
          const delayTime = 1000 * Math.pow(2, retryCount)
          await delay(delayTime)

          // Use duck-duck-scrape's search function
          const searchResults = await search(context.query, {
            safeSearch: SafeSearchType.MODERATE,
            locale: context.region || 'wt-wt',
            count: context.maxResults || 5,
          })

          // Transform the results to match our schema
          const transformedResults = searchResults.results.map(
            (result, index) => ({
              title: result.title,
              url: result.url,
              description: result.description || '',
              position: index,
              snippet: result.description,
              snippet_html: result.description,
              favicon: result.favicon || '',
              domain: new URL(result.url).hostname,
            })
          )

          return {
            query: context.query,
            results: transformedResults,
            timestamp: new Date().toISOString(),
          }
        } catch (error) {
          lastError = error
          console.warn(`Search attempt ${retryCount + 1} failed:`, error)
          retryCount++

          // If this is not a rate limiting error, don't retry
          if (
            !(error instanceof Error) ||
            !error.message.includes('DDG detected an anomaly')
          ) {
            break
          }
        }
      }

      // If we've exhausted all retries, throw the last error
      console.error('Search error after retries:', lastError)
      throw new Error(
        `Failed to perform search after ${maxRetries} attempts: ${
          lastError instanceof Error ? lastError.message : String(lastError)
        }`
      )
    } catch (error) {
      console.error('Search error:', error)
      throw new Error(
        `Failed to perform search: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  },
})
