import { mastra } from "@/mastra";

// export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const agent = await mastra.getAgent("searchAgent");
  const result = await agent.stream(messages);

  return result.toDataStreamResponse();
}
