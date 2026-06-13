import { describe, it, expect } from 'vitest';
import { consultarStockTool } from './stock/consultarStock';
import { getToolsForRole } from './utils/toolsByRole';

describe('Subagent Delegation E2E', () => {
  it('should have consultarStock in role tools', () => {
    const adminTools = getToolsForRole('ADMIN');
    expect(adminTools).toHaveProperty('consultarStock');
    expect(adminTools.consultarStock).toBe(consultarStockTool);
  });

  it('should have consultarStock for all relevant roles', () => {
    const sellerTools = getToolsForRole('SELLER');
    expect(sellerTools).toHaveProperty('consultarStock');

    const staffTools = getToolsForRole('STAFF');
    expect(staffTools).toHaveProperty('consultarStock');

    const technicianTools = getToolsForRole('TECHNICIAN');
    // Technicians might not have stock access
    expect(technicianTools).toBeDefined();
  });

  it('should not have get_product in role tools (replaced by consultarStock)', () => {
    const adminTools = getToolsForRole('ADMIN');
    expect(adminTools).not.toHaveProperty('get_product');
  });

  it('should have proper tool structure for delegation', () => {
    const adminTools = getToolsForRole('ADMIN');
    const stockTool = adminTools.consultarStock;

    expect(stockTool).toBeDefined();
    expect(stockTool.description).toContain('consultar disponibilidad');
    expect(stockTool.execute).toBeDefined();
  });
});
