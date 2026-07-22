import { db, type Transaction } from "@/lib/db";

/**
 * Execute a function within a database transaction.
 * Wraps db.transaction(async (tx) => { ... })
 */
export async function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}

export type { Database, Transaction } from "@/lib/db";
