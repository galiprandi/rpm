import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import type { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const VISION_MODEL = "qwen/qwen3.6-27b";

/**
 * Supported media types for document extraction.
 * Non-image/non-PDF files are rejected early with a clear error.
 */
const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

/**
 * Generic document extraction agent using Groq Qwen 3.6 27B (vision).
 * Passes the image/PDF along with extraction instructions to the model.
 * Works with any document type: invoices, receipts, remits, cash exits, etc.
 *
 * @param fileUrl - URL of the image or PDF (data URL or public URL)
 * @param extractionPrompt - Instructions describing what to extract from the document
 * @param schema - Zod schema defining the structured output
 * @returns Extracted data matching the provided schema
 * @throws Error if the file type is not supported (non-image/non-PDF)
 */
export async function extractDocumentData<T>(
  fileUrl: string,
  extractionPrompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const isPdf =
    fileUrl.startsWith("data:application/pdf") || fileUrl.endsWith(".pdf");

  // Extract media type from data URL for validation
  const mediaTypeMatch = fileUrl.match(/^data:([^;]+);/);
  const mediaType = mediaTypeMatch?.[1] || "";

  const isImage = SUPPORTED_IMAGE_TYPES.includes(mediaType);

  if (!isPdf && !isImage) {
    throw new Error(
      `Tipo de archivo no soportado (${mediaType || "desconocido"}). Solo se aceptan imágenes (PNG, JPG, WebP) o PDF.`,
    );
  }

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
