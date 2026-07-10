import { generateText, stepCountIs } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { getToolsForRole } from '@/lib/agents/registry';
import { UserRole as AuthUserRole } from '@/lib/auth/roles';
import { loadChat } from '@/lib/agents/utils/chatHistory';
import { readFileSync } from 'fs';
import { join } from 'path';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      context?: { role?: string; userId?: string; email?: string };
      id?: string;
      message?: { role?: string; content?: string };
    };

    const { context, id, message } = body;
    const chatId = id || `user-${context?.userId || 'anon'}`;
    const messageText = typeof message?.content === 'string' ? message.content : '';
    const isConfirmation = ['sí', 'si', 'confirmar', 'ok'].includes(messageText.toLowerCase().trim());

    let conversationContext = '';
    if (!isConfirmation) {
      const textHistory = await loadChat(chatId);
      if (textHistory.length > 0) {
        conversationContext = `\n\nCONVERSATION HISTORY:\n${textHistory.join('\n')}`;
      }
    }

    const orchestratorPath = join(process.cwd(), 'lib/agents/orchestrator/instructions.md');
    const orchestratorInstructions = readFileSync(orchestratorPath, 'utf-8');

    const roleTools = getToolsForRole(AuthUserRole.ADMIN);

    const systemPrompt = orchestratorInstructions +
      `\n\nCHAT_ID: ${chatId}` +
      (conversationContext || '') +
      (isConfirmation ? `\n\nCONFIRMACIÓN del usuario: "${messageText}". Ejecutá la tool y devolvé el resultado.` : '');

    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error('GROQ_MODEL env var is required');

    const result = await generateText({
      model: groq(modelName) as any,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageText }],
      tools: roleTools as any,
      temperature: 0,
      stopWhen: stepCountIs(10),
    });

    const responseText = result.text || 'Listo.';
    console.log('✅ Response:', responseText.substring(0, 200));

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
