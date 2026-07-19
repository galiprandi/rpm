import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { unifiedTools } from './unified-tools';

/**
 * Validates that unifiedTools exposes exactly the expected set of tools,
 * that every tool is documented in unified-instructions.md, and that every
 * tool has visual labels in ChatFloating.tsx.
 *
 * This test prevents silent regressions where a tool is added/removed
 * but documentation or UI labels are not updated.
 */

const EXPECTED_TOOLS = [
  // Search
  'searchProducts',
  'searchCustomers',
  'searchVehicles',
  'searchWorkOrders',
  // Create
  'createCustomer',
  'createProduct',
  'registerVehicle',
  'registerCustomerWithVehicle',
  'createWorkOrder',
  'createDirectSale',
  // Update
  'updateWorkOrderStatus',
  // Query
  'getWorkOrderDetail',
  'getCashStatus',
  'getTodaySummary',
  // Communication
  'composeWhatsAppMessage',
  // Purchases
  'processPurchaseInvoice',
] as const;

describe('unified-tools integrity', () => {
  it('exposes exactly the expected tools', () => {
    const exposed = Object.keys(unifiedTools).sort();
    const expected = [...EXPECTED_TOOLS].sort();
    expect(exposed).toEqual(expected);
  });

  it('every tool has a description', () => {
    for (const name of EXPECTED_TOOLS) {
      const t = (unifiedTools as Record<string, { description?: string }>)[name];
      expect(t?.description, `Tool ${name} missing description`).toBeTruthy();
      expect(t.description!.length, `Tool ${name} description too short`).toBeGreaterThan(20);
    }
  });

  it('every tool is documented in unified-instructions.md', () => {
    const instructions = readFileSync(
      join(process.cwd(), 'lib/agents/unified-instructions.md'),
      'utf-8',
    );

    for (const name of EXPECTED_TOOLS) {
      const mentioned = instructions.includes(`\`${name}\``);
      expect(mentioned, `Tool ${name} not documented in unified-instructions.md`).toBe(true);
    }
  });

  it('every tool has visual labels in ChatFloating.tsx', () => {
    const chatFloating = readFileSync(
      join(process.cwd(), 'components/bot/ChatFloating.tsx'),
      'utf-8',
    );

    for (const name of EXPECTED_TOOLS) {
      const hasLabel = chatFloating.includes(`${name}:`);
      expect(hasLabel, `Tool ${name} missing label in ChatFloating.tsx`).toBe(true);
    }
  });
});
