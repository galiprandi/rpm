import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createProductTool } from '@/lib/agents/simple/createProductTool';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// In-memory message store for single-agent validation
const messageStore = new Map<string, Array<{ role: string; content: string }>>();

const SYSTEM_PROMPT = `Eres un asistente especializado en crear productos para el sistema de inventario.

REGLAS:
1. Si el usuario quiere crear un producto pero NO ha proporcionado todos los datos requeridos (nombre, categoría, precio de costo, stock), pregúntale amablemente por los datos que faltan.
2. Si el usuario ha proporcionado los datos requeridos, llama a la herramienta "createProduct" para crear el producto.
3. Siempre responde en español.
4. Sé conciso y claro.

DATOS REQUERIDOS para crear un producto:
- name: nombre del producto
- categoryId: ID de la categoría (ej: "1")
- costPrice: precio de costo (número)
- stock: cantidad en stock (número)

DATOS OPCIONALES:
- sku, description, barcode, replacementCost, minStock, supplierId, location`;

export async function POST(req: Request) {
  try {
    console.log('🤖 [SIMPLE] Bot chat request received');
    const body = await req.json() as {
      message?: { content: string; role: string };
      context?: { userId?: string };
      id?: string;
    };

    const chatId = body.id || `user-${body.context?.userId || 'anonymous'}`;
    const userMessage = body.message?.content || '';

    console.log('📨 [SIMPLE] chatId:', chatId, 'message:', userMessage);

    // Accumulate messages
    const messages = messageStore.get(chatId) || [];
    messages.push({ role: 'user', content: userMessage });
    messageStore.set(chatId, messages);

    console.log('📚 [SIMPLE] Total messages in history:', messages.length);

    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error('GROQ_MODEL env var is required');
    const model = groq(modelName);

    console.log('🤖 [SIMPLE] Using model:', modelName);

    // Call LLM with full history
    const result = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      system: SYSTEM_PROMPT,
      messages: messages as any,
      tools: { createProduct: createProductTool },
      temperature: 0.7,
    });

    console.log('📝 [SIMPLE] Response text:', result.text);
    console.log('🔧 [SIMPLE] Tool calls:', result.toolCalls?.length || 0);

    // If tool calls were made, execute tool and call again with result
    if (result.toolCalls && result.toolCalls.length > 0) {
      let toolResultText = '';

      for (const toolCall of result.toolCalls as any[]) {
        const toolArgs = toolCall.args || toolCall.arguments || {};
        console.log('🔧 [SIMPLE] Executing tool:', toolCall.toolName, 'with args:', JSON.stringify(toolArgs));

        if (toolCall.toolName === 'createProduct') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolResult = await (createProductTool as any).execute(toolArgs);
          console.log('✅ [SIMPLE] Tool result:', toolResult);
          toolResultText += toolResult + '\n';
        }
      }

      // Append tool result to history and re-call LLM
      messages.push({ role: 'assistant', content: result.text + '\n\n[Resultado de herramienta]: ' + toolResultText });
      messageStore.set(chatId, messages);

      const finalResult = await generateText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        system: SYSTEM_PROMPT,
        messages: messages as any,
        tools: { createProduct: createProductTool },
        temperature: 0.7,
      });

      console.log('📝 [SIMPLE] Final response text:', finalResult.text);

      // Add assistant response to history
      messages.push({ role: 'assistant', content: finalResult.text });
      messageStore.set(chatId, messages);

      return new Response(JSON.stringify({ text: finalResult.text }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No tool calls, just add assistant response to history
    messages.push({ role: 'assistant', content: result.text });
    messageStore.set(chatId, messages);

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [SIMPLE] Bot chat error:', error);

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
