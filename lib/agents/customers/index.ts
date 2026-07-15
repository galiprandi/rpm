import { createAgent } from '../utils/createAgent';
import { customerTools } from '@/lib/services/customer';

/**
 * Customer Agent - Specialized agent for customer management
 *
 * This agent handles all customer-related operations including:
 * - Creating customers (draft + confirm)
 * - Searching customers
 * - Managing customer data
 */
export const customerAgent = createAgent({
  instructions: './instructions.md',
  tools: customerTools,
});
