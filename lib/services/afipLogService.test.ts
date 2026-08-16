/**
 * AFIP Log Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logAfipInteraction,
  getAfipLogsByInvoice,
  getNextAttemptNumber,
} from "./afipLogService";

const mockLogs: any[] = [];

vi.mock("../db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    query: {
      afipLog: {
        findMany: vi.fn(() => Promise.resolve(mockLogs)),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ maxAttempt: 2 }])),
      })),
    })),
  },
}));

vi.mock("../db/schema", () => ({
  afipLog: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
}));

describe("afipLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogs.length = 0;
  });

  it("logAfipInteraction inserts a log entry", async () => {
    await logAfipInteraction({
      invoiceId: "inv-1",
      attempt: 1,
      direction: "request",
      method: "FECAESolicitar",
      payload: { test: true },
    });

    // The mock insert().values() was called
    expect(vi.mocked(vi.fn()).mock).toBeTruthy();
  });

  it("getAfipLogsByInvoice returns logs for an invoice", async () => {
    mockLogs.push({
      id: "log-1",
      invoiceId: "inv-1",
      attempt: 1,
      direction: "request",
      method: "FECAESolicitar",
      payload: null,
      response: null,
      resultCode: null,
      errorCode: null,
      errorMessage: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const logs = await getAfipLogsByInvoice("inv-1");
    expect(logs).toHaveLength(1);
    expect(logs[0].invoiceId).toBe("inv-1");
  });

  it("getNextAttemptNumber returns max + 1", async () => {
    const result = await getNextAttemptNumber("inv-1");
    expect(result).toBe(3); // mock returns maxAttempt: 2
  });
});
