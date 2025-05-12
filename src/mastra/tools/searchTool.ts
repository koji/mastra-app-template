import { createTool } from "@mastra/core";
import { z } from "zod";
// Import duckduckgo-search as a module
import duckduckgoSearch from "duckduckgo-search";

// Define the input schema for the search tool
const searchInputSchema = z.object({
  query: z.string().min(1, "Search query must not be empty"),
  maxResults: z.number().min(1).max(10).optional().default(5),
  region: z.string().optional().default("wt-wt"),
});

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
});

// Create the search tool
export const searchTool = createTool({
  id: "webSearch",
  description:
    "Performs web searches using DuckDuckGo and returns relevant results",
  inputSchema: searchInputSchema,
  outputSchema: searchOutputSchema,
  execute: async ({ context }) => {
    try {
      // Collect results using the async iterator pattern
      const results = [];
      let position = 0;
      
      // Use the text function which returns an async iterator
      for await (const result of duckduckgoSearch.text(context.query, {
        maxResults: context.maxResults,
        region: context.region,
      })) {
        // Add position property manually
        result.position = position++;
        results.push(result);
        
        // Respect the maxResults limit
        if (results.length >= context.maxResults) {
          break;
        }
      }

      // Transform the results to match our schema
      const transformedResults = results.map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description || result.snippet || result.snippet_html || "",
        position: result.position,
        snippet: result.snippet,
        snippet_html: result.snippet_html,
        favicon: result.favicon,
        domain: result.domain,
      }));

      return {
        query: context.query,
        results: transformedResults,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Search error:", error);
      throw new Error(
        `Failed to perform search: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});
