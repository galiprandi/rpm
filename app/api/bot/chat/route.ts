import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { composeSystemPrompt, type BotContext, type UserRole } from '@/lib/bot/promptComposer';
import { botTools } from '@/lib/bot/tools';

// Configure OpenAI (using Vercel AI Gateway or direct OpenAI)
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Get user role from session (default to ADMIN for phase 1)
    const userRole: UserRole = context?.role || 'ADMIN';

    // Get current URL context
    const urlContext = {
      path: context?.url?.path || '/',
      search: context?.url?.search || '',
      hash: context?.url?.hash || '',
    };

    // Compose system prompt with role and context
    const botContext: BotContext = {
      role: userRole,
      currentUrl: urlContext,
      userId: context?.userId,
    };

    const systemPrompt = composeSystemPrompt(botContext);

    // Stream response with tools
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      tools: botTools,
      temperature: 0.7,
    });

    // Return as UI message stream (for useChat)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Bot chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
