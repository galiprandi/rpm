/**
 * AFIP Log Service - Persists all interactions with AFIP Web Services
 * for auditing and debugging purposes.
 */

import { db } from "@/lib/db";
import { afipLog } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface AfipLogEntry {
  id: string;
  invoiceId: string;
  attempt: number;
  direction: "request" | "response";
  method: string;
  payload: unknown;
  response: unknown;
  resultCode: "A" | "R" | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

/**
 * Logs an AFIP interaction (request or response) to the afip_log table.
 */
export async function logAfipInteraction(data: {
  invoiceId: string;
  attempt: number;
  direction: "request" | "response";
  method: string;
  payload?: unknown;
  response?: unknown;
  resultCode?: "A" | "R";
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  await db
    .insert(afipLog)
    .values({
      id: crypto.randomUUID(),
      invoiceId: data.invoiceId,
      attempt: data.attempt,
      direction: data.direction,
      method: data.method,
      payload: data.payload as any,
      response: data.response as any,
      resultCode: data.resultCode ?? null,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
    });
}

/**
 * Returns all AFIP log entries for a given invoice, ordered newest first.
 */
export async function getAfipLogsByInvoice(
  invoiceId: string,
): Promise<AfipLogEntry[]> {
  const logs = await db.query.afipLog.findMany({
    where: eq(afipLog.invoiceId, invoiceId),
    orderBy: desc(afipLog.createdAt),
  });

  return logs.map((log) => ({
    id: log.id,
    invoiceId: log.invoiceId,
    attempt: log.attempt,
    direction: log.direction as "request" | "response",
    method: log.method,
    payload: log.payload,
    response: log.response,
    resultCode: log.resultCode as "A" | "R" | null,
    errorCode: log.errorCode,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt,
  }));
}

/**
 * Returns the next attempt number for a given invoice (1-based).
 */
export async function getNextAttemptNumber(invoiceId: string): Promise<number> {
  const result = await db
    .select({ maxAttempt: sql<number>`coalesce(max(${afipLog.attempt}), 0)` })
    .from(afipLog)
    .where(eq(afipLog.invoiceId, invoiceId));

  return (result[0]?.maxAttempt ?? 0) + 1;
}
