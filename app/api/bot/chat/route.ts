import { streamText, convertToModelMessages, validateUIMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { composeSystemPrompt, type BotContext, type UserRole } from '@/lib/agents/utils/promptComposer';
import { getToolsForRole } from '@/lib/agents/utils/toolsByRole';
import { loadChat, saveChat, type ChatMessage } from '@/lib/agents/utils/chatHistory';

// Configure OpenAI (using Vercel AI Gateway or direct OpenAI)
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log('🤖 Bot chat request received');
    const body = await req.json() as {
      messages?: unknown[];
      context?: { role?: string; url?: { path: string; search: string; hash: string }; userId?: string; email?: string };
      id?: string;
      message?: unknown;
    };
    
    // Support both old format (full messages) and new format (last message + id)
    const { messages, context, id, message } = body;
    
    console.log('📨 Request body:', { id, hasMessage: !!message, hasMessages: !!messages, userId: context?.userId });
    
    let allMessages: unknown[];
    let chatId: string;
    
    if (message) {
      // New format: don't load previous messages for validateUIMessages
      // Text history is loaded separately and injected into system prompt
      // Generate chatId from userId for persistence across sessions
      const userId = context?.userId || 'anonymous';
      chatId = id || `user-${userId}`;
      allMessages = [message];
      console.log('🆕 Using new format with chatId:', chatId);
    } else {
      // Old format: use messages directly (for testing)
      chatId = 'default';
      allMessages = messages || [];
      console.log('🔄 Using old format (default chatId)');
    }
    
    console.log('📨 Total messages:', allMessages.length);

    // Load conversation text history if using new format
    let conversationContext = '';
    if (message) {
      const textHistory = await loadChat(chatId);
      console.log('📚 Loaded history for chatId:', chatId, 'messages:', textHistory.length);
      console.log('📚 History content:', textHistory);
      if (textHistory.length > 0) {
        conversationContext = `\n\nCONVERSATION HISTORY:\n${textHistory.join('\n')}`;
        console.log('💬 Conversation context added, length:', conversationContext.length);
      }
    }

    // Extract context from body (new format) or use default
    const userRole: UserRole = (context?.role as UserRole) || 'ADMIN';
    const urlContext = context?.url || { path: '/', search: '', hash: '' };
    const userId = context?.userId;
    const email = context?.email;

    // Compose system prompt with role, context, and conversation history
    const botContext: BotContext = {
      role: userRole,
      currentUrl: urlContext,
      userId,
      email,
    };

    const systemPrompt = composeSystemPrompt(botContext) + conversationContext;
    console.log('💬 System prompt length:', systemPrompt.length);

    // Get tools filtered by user role
    const roleTools = getToolsForRole(userRole);
    console.log('🔧 Available tools:', Object.keys(roleTools));

    // Validate messages with tools (SDK pattern)
    const validatedMessages = await validateUIMessages({
      messages: allMessages,
      tools: roleTools,
    });

    console.log('🚀 Starting streamText...');
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(validatedMessages),
      tools: roleTools,
      temperature: 0.7,
    });

    console.log('✅ Stream created, returning response');
    // Return as UI message stream with onFinish callback to save messages
    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      onFinish: ({ messages }) => {
        saveChat({ chatId, messages: messages as ChatMessage[] });
      },
    });
  } catch (error) {
    console.error('❌ Bot chat error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
