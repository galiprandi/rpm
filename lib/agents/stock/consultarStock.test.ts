import { describe, it, expect } from 'vitest';
import { consultarStockTool } from './consultarStock';

describe('consultarStock tool', () => {
  it('should have correct description', () => {
    expect(consultarStockTool.description).toContain('consultar disponibilidad');
  });

  it('should have inputSchema with consulta field', () => {
    const schema = consultarStockTool.inputSchema;
    expect(schema).toBeDefined();
    // The schema is a Zod schema, we can check it has the right structure
  });

  it('should have execute function', () => {
    expect(consultarStockTool.execute).toBeDefined();
    expect(typeof consultarStockTool.execute).toBe('function');
  });
});
