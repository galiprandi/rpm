/**
 * Customer Domain - Colocated services, schemas, and tools
 *
 * This index file exports all customer-related functionality:
 * - Services: Pure functions for business logic
 * - Schemas: Zod validation schemas (shared with API routes)
 * - Tools: AI SDK tools (using createTool factory)
 */

// Tools
export { draftCustomerTool, createCustomerTool } from './createCustomer/tool';
export { searchCustomersTool } from './searchCustomers/tool';

// Services
export { createCustomerService } from './createCustomer/service';
export { searchCustomersService } from './searchCustomers/service';

// Schemas
export { createCustomerSchema, type CreateCustomerInput } from './createCustomer/schema';
export { searchCustomersSchema, type SearchCustomersInput } from './searchCustomers/schema';

// Tool collection for registry
import { draftCustomerTool, createCustomerTool } from './createCustomer/tool';
import { searchCustomersTool } from './searchCustomers/tool';

export const customerTools = {
  draftCustomer: draftCustomerTool,
  createCustomer: createCustomerTool,
  searchCustomers: searchCustomersTool,
};
