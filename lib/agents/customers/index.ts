/**
 * Customers Agent - Subagent specialized in customer management
 *
 * Especificaciones relacionadas:
 * - /specs/features/ai-bot-ger.md (Arquitectura Multi-Agente)
 * - /specs/features/customers.md
 */

import { createAgent } from '../utils/createAgent';
import { draftCustomerTool } from './tools/draftCustomer';
import { searchCustomersTool } from './tools/searchCustomers';
import { createCustomerTool } from './tools/createCustomer';

export const customersAgent = createAgent({
  instructions: './instructions.md',
  tools: {
    draftCustomer: draftCustomerTool,
    searchCustomers: searchCustomersTool,
    createCustomer: createCustomerTool,
  },
});
