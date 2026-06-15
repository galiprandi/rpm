import { streamText, convertToModelMessages, validateUIMessages, generateId, stepCountIs } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { composeSystemPrompt, type BotContext, type UserRole } from '@/lib/agents/utils/promptComposer';
import { getToolsForRole } from '@/lib/agents/registry';
import { UserRole as AuthUserRole } from '@/lib/auth/roles';
import { loadChat } from '@/lib/agents/utils/chatHistory';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configure Google Gemini (fallback)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Configure Groq (primary)
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
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
    console.log('📨 Messages sample:', messages ? JSON.stringify(messages[0]).substring(0, 200) : 'none');
    console.log('📨 Message sample:', message ? JSON.stringify(message).substring(0, 200) : 'none');
    
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
      // Old format: use messages directly - use id as chatId for persistence
      chatId = id || 'default';
      allMessages = messages || [];
      console.log('🔄 Using old format with chatId:', chatId);
    }
    
    console.log('📨 Total messages:', allMessages.length);

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

    // Load conversation text history if using new format OR if chatId is provided
    // BUT skip history for confirmations to avoid model repeating original task
    let conversationContext = '';
    const messageText = (message as any)?.content?.[0]?.text || '';
    const isConfirmation = ['sí', 'si', 'confirmar', 'ok'].includes(messageText.toLowerCase().trim());
    
    if ((message || chatId !== 'default') && !isConfirmation) {
      const textHistory = await loadChat(chatId);
      console.log('📚 Loaded history for chatId:', chatId, 'messages:', textHistory.length);
      console.log('📚 History content:', textHistory);
      if (textHistory.length > 0) {
        conversationContext = `\n\nCONVERSATION HISTORY:\n${textHistory.join('\n')}`;
        console.log('💬 Conversation context added, length:', conversationContext.length);
      }
    } else if (isConfirmation) {
      console.log('🔒 Skipping history for confirmation message');
    }

    // Load orchestrator instructions from file
    const orchestratorInstructionsPath = join(process.cwd(), 'lib/agents/orchestrator/instructions.md');
    const orchestratorInstructions = readFileSync(orchestratorInstructionsPath, 'utf-8');
    
    // Use ONLY orchestrator instructions - no other context to avoid conflicts
    let systemPrompt = orchestratorInstructions + 
      `\n\nCHAT_ID: ${chatId}\n\nAVAILABLE TOOLS: delegateCustomer, delegateInventory\n\nYou MUST call one of these tools. Do not respond with text.`;
    
    // Add specific instruction for confirmations
    if (isConfirmation) {
      systemPrompt += `\n\nCONFIRMATION CONTEXT: The user confirmed with "${messageText}". Delegar al agente de clientes con la confirmación.`;
    }
    
    console.log('💬 System prompt length:', systemPrompt.length);

    // Map promptComposer UserRole to auth UserRole for registry
    const roleMap: Record<string, AuthUserRole> = {
      'ADMIN': AuthUserRole.ADMIN,
      'STAFF': AuthUserRole.STAFF,
      'TECHNICIAN': AuthUserRole.ADMIN,
      'SELLER': AuthUserRole.ADMIN,
    };
    const authRole = roleMap[userRole] || AuthUserRole.USER;
    
    // Get tools filtered by user role from central registry
    const roleTools = getToolsForRole(authRole);
    console.log('🔧 Available tools:', Object.keys(roleTools));

    // Ensure all messages have IDs and correct format (required by validateUIMessages)
    const messagesWithIds = allMessages.map((msg: any) => {
      const content = msg.content;
      let parts: any[];
      
      if (Array.isArray(content)) {
        // Already in parts format
        parts = content;
      } else if (typeof content === 'string') {
        // Convert string to parts format
        parts = [{ type: 'text', text: content }];
      } else {
        // Unknown format, try to use as-is
        parts = content || [];
      }
      
      return {
        role: msg.role,
        parts: parts,
        id: msg.id || generateId(),
      };
    });

    // Validate messages with tools (SDK pattern)
    const validatedMessages = await validateUIMessages({
      messages: messagesWithIds,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: roleTools as any,
    });

    console.log('🚀 Starting streamText...');
    
    // Use Groq for better rate limits during testing
    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error('GROQ_MODEL env var is required');
    const model = groq(modelName);

    console.log('🤖 Using model:', modelName, 'Provider: Groq');
    
    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      system: systemPrompt,
      messages: await convertToModelMessages(validatedMessages),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: roleTools as any,
      temperature: 0, // Low temperature for deterministic tool calling
      stopWhen: stepCountIs(10), // Limit to 10 steps for multi-step calls
    });

    console.log('✅ Stream created, returning response');
    
    try {
      // Return as text stream
      return result.toTextStreamResponse();
    } catch (streamError) {
      console.error('❌ Stream error:', streamError);
      return new Response(
        JSON.stringify({ error: 'Stream error', details: streamError instanceof Error ? streamError.message : 'Unknown stream error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Bot chat error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    const isRateLimit = error instanceof Error && (
      error.message?.includes('429') ||
      error.message?.includes('rate_limit') ||
      error.message?.includes('Rate limit')
    );

    if (isRateLimit) {
      return new Response(
        JSON.stringify({ text: 'Límite de uso alcanzado.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
