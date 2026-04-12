import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { composeSystemPrompt, type BotContext, type UserRole } from '@/lib/bot/promptComposer';
import { getToolsForRole } from '@/lib/bot/toolsByRole';

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

    // Convert UI messages to Model messages (required for AI SDK v6)
    const modelMessages = await convertToModelMessages(messages);

    // Get tools filtered by user role (empty for now - TODO: add new tools)
    const roleTools = getToolsForRole(userRole);

    // Stream response with tools
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      system: systemPrompt,
      messages: modelMessages,
      tools: roleTools,
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
