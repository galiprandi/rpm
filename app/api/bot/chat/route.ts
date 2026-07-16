import {
  streamText,
  isStepCount,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { unifiedTools } from "@/lib/agents/unified-tools";
import {
  composeSystemPrompt,
  type BotContext,
} from "@/lib/agents/utils/promptComposer";
import { UserRole } from "@/lib/auth/roles";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, context } = (await req.json()) as {
      messages: UIMessage[];
      context?: {
        role?: string;
        userId?: string;
        userName?: string;
        pathname?: string;
        pageContent?: string;
        modalContent?: string;
      };
    };

    const chatId = `user-${context?.userId || "anon"}`;

    // Extract file attachments from messages before conversion.
    // Text-only models can't handle file/image content parts.
    const fileAttachments: { url: string; mediaType: string }[] = [];
    const cleanedMessages = messages.map((msg) => {
      const fileParts = msg.parts.filter((p) => p.type === "file");
      if (fileParts.length > 0) {
        for (const fp of fileParts) {
          if (fp.type === "file") {
            fileAttachments.push({ url: fp.url, mediaType: fp.mediaType });
          }
        }
        // Replace file parts with a text reference
        const textParts = msg.parts
          .filter((p) => p.type !== "file")
          .map((p) => (p.type === "text" ? p.text : ""))
          .join(" ");
        const fileNote =
          fileAttachments.length > 0
            ? `\n\n[Archivo adjunto: ${fileAttachments.length} archivo(s). Usá la tool processPurchaseInvoice con la URL del archivo para procesarlo.]`
            : "";
        return {
          ...msg,
          parts: [{ type: "text" as const, text: textParts + fileNote }],
        };
      }
      return msg;
    });

    // Compose system prompt using the unified prompt architecture
    const role = (context?.role as UserRole) || UserRole.USER;
    const botContext: BotContext = {
      role,
      pathname: context?.pathname,
      userId: context?.userId,
      userName: context?.userName,
      chatId,
      pageContent: context?.pageContent,
      modalContent: context?.modalContent,
      fileAttachments: fileAttachments.length > 0 ? fileAttachments : undefined,
    };
    const systemPrompt = composeSystemPrompt(botContext);

    const modelName = process.env.GROQ_MODEL;
    if (!modelName) throw new Error("GROQ_MODEL env var is required");

    const result = streamText({
      model: groq(modelName),
      system: systemPrompt,
      messages: await convertToModelMessages(cleanedMessages),
      tools: unifiedTools as any,
      temperature: 0,
      stopWhen: isStepCount(8),
      onStepFinish({ toolCalls, toolResults, usage }) {
        if (toolCalls && toolCalls.length > 0) {
          for (const tc of toolCalls) {
            console.log(
              `🔧 Tool call: ${tc.toolName}`,
              `\n   args: ${JSON.stringify(tc.input, null, 2)}`,
            );
          }
          if (toolResults) {
            for (const tr of toolResults) {
              const resultStr =
                typeof tr.output === "string"
                  ? tr.output.substring(0, 200)
                  : JSON.stringify(tr.output).substring(0, 200);
              console.log(
                `   ✅ Result: ${resultStr}${tr.output && JSON.stringify(tr.output).length > 200 ? "..." : ""}`,
              );
            }
          }
        }
        if (usage) {
          console.log(
            `📊 Tokens: ${usage.inputTokens} in / ${usage.outputTokens} out`,
          );
        }
      },
      onError({ error }) {
        console.error("❌ Stream error:", error);
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError(error) {
          const err = error as Record<string, unknown>;
          const statusCode = err?.statusCode;
          const errorMsg = (error as Error)?.message || "";
          const isRateLimit =
            statusCode === 429 ||
            statusCode === 413 ||
            errorMsg.includes("rate_limit_exceeded") ||
            errorMsg.includes("Request too large");

          if (isRateLimit) {
            const isTooLarge =
              statusCode === 413 || errorMsg.includes("Request too large");

            if (isTooLarge) {
              return "⚠️ El request es demasiado grande para el modelo. Intentá iniciar una conversación nueva.";
            }

            const retryMatch = errorMsg.match(/try again in ([\d.]+)/);
            const retryAfter = (
              err?.responseHeaders as Record<string, string>
            )?.["retry-after"];
            let waitTime = "";

            if (retryMatch) {
              const seconds = parseFloat(retryMatch[1]);
              const hours = Math.floor(seconds / 3600);
              const minutes = Math.floor((seconds % 3600) / 60);
              waitTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            } else if (retryAfter) {
              const seconds = parseInt(retryAfter);
              const hours = Math.floor(seconds / 3600);
              const minutes = Math.floor((seconds % 3600) / 60);
              waitTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            }

            return `⏳ Se alcanzó el límite de uso del modelo. El servicio se restablecerá en ${waitTime || "aproximadamente 2 horas"}. Por favor, intentá nuevamente más tarde.`;
          }

          return "❌ Ocurrió un error. Intentá nuevamente.";
        },
      }),
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
