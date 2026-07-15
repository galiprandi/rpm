import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import type { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Generic document extraction agent using Groq Llama 4 Scout (vision).
 * Passes the image/PDF along with extraction instructions to the model.
 * Works with any document type: invoices, receipts, remits, cash exits, etc.
 *
 * @param fileUrl - URL of the image or PDF (data URL or public URL)
 * @param extractionPrompt - Instructions describing what to extract from the document
 * @param schema - Zod schema defining the structured output
 * @returns Extracted data matching the provided schema
 */
export async function extractDocumentData<T>(
  fileUrl: string,
  extractionPrompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const isPdf =
    fileUrl.startsWith("data:application/pdf") || fileUrl.endsWith(".pdf");

  const { object: extracted } = await generateObject({
    model: groq(VISION_MODEL),
    schema,
    messages: [
      {
        role: "user",
        content: isPdf
          ? [
              { type: "file", data: fileUrl, mediaType: "application/pdf" },
              { type: "text", text: extractionPrompt },
            ]
          : [
              { type: "image", image: fileUrl },
              { type: "text", text: extractionPrompt },
            ],
      },
    ],
  });

  return extracted;
}
