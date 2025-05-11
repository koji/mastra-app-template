import { createCerebras } from '@ai-sdk/cerebras'
import { jsonSchema, streamText } from 'ai'

const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY ?? '',
})

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json()

  const result = streamText({
    model: cerebras('llama3.1-8b'),
    messages,
    system,
    tools: Object.fromEntries(
      Object.entries<{ parameters: unknown }>(tools).map(([name, tool]) => [
        name,
        {
          parameters: jsonSchema(tool.parameters!),
        },
      ])
    ),
  })

  return result.toDataStreamResponse()
}
