import {
  streamText,
  isStepCount,
  toTextStream,
  createTextStreamResponse,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { unifiedTools } from "@/lib/agents/unified-tools";
import { loadChat } from "@/lib/agents/utils/chatHistory";
import { readFileSync } from "fs";
import { join } from "path";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      context?: { role?: string; userId?: string; email?: string };
      id?: string;
      message?: { role?: string; content?: string };
    };

    const { context, id, message } = body;
    const chatId = id || `user-${context?.userId || "anon"}`;
    const messageText =
      typeof message?.content === "string" ? message.content : "";
    const isConfirmation = [
      "sí",
      "si",
      "confirmar",
      "ok",
      "dale",
      "guardar",
    ].includes(messageText.toLowerCase().trim());

    let conversationContext = "";
    if (!isConfirmation) {
      const textHistory = await loadChat(chatId);
      if (textHistory.length > 0) {
        conversationContext = `\n\nCONVERSATION HISTORY:\n${textHistory.join("\n")}`;
      }
    }

    const instructionsPath = join(
      process.cwd(),
      "lib/agents/unified-instructions.md",
    );
    const baseInstructions = readFileSync(instructionsPath, "utf-8");

    const systemPrompt =
      baseInstructions +
      `\n\nCHAT_ID: ${chatId}` +
      (conversationContext || "") +
      (isConfirmation
        ? `\n\nCONFIRMACIÓN del usuario: "${messageText}". Ejecutá la tool pendiente y devolvé el resultado.`
        : "");

    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error("GROQ_MODEL env var is required");

    const result = streamText({
      model: groq(modelName),
      system: systemPrompt,
      messages: [{ role: "user", content: messageText }],
      tools: unifiedTools as any,
      temperature: 0,
      stopWhen: isStepCount(8),
      onError({ error }) {
        console.error("❌ Stream error:", error);
      },
    });

    return createTextStreamResponse({
      stream: toTextStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
