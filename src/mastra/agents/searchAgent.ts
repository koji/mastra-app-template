import { cerebras } from "@ai-sdk/cerebras";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
// import { LibSQLStore } from "@mastra/libsql";
import { searchTool } from "../tools/searchTool";

export const searchAgent = new Agent({
  name: "Search Agent",
  instructions: `
      You are a helpful search assistant that uses DuckDuckGo to find information.

      Your primary function is to help users find relevant information on the web. When responding:
      - Use the search tool to find relevant web results
      - Provide concise summaries of the most relevant results
      - Include links to original sources when appropriate
      - If no relevant results are found, explain this to the user
      - Keep responses informative and helpful
    
    # Tools
    - SEARCH_WEB: perform web search
  `,
  model: cerebras("llama-3.3-70b"),
  tools: { SEARCH_WEB: searchTool },
  // memory: new Memory({
  //   // storage: new LibSQLStore({
  //   //   url: "file:../mastra.db", // path is relative to the .mastra/output directory
  //   // }),
  //   options: {
  //     lastMessages: 10,
  //     semanticRecall: false,
  //     threads: {
  //       generateTitle: false,
  //     },
  //   },
  // }),
});
