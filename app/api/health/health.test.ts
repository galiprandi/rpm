/**
 * Test suite para Health Check API
 * 
 * Especificaciones relacionadas:
 * - /docs/monitoring.md#health-checks
 * - /specs/vercel-deployment.md#monitorización-y-salud
 * 
 * Alcance del test:
 * - Validación de endpoint /api/health
 * - Verificación de respuesta en diferentes entornos
 * - Integración con variables de entorno
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <100ms de respuesta
 * - Confiabilidad: 99.9% uptime
 */

import { GET } from './route';

describe('Health Check API', () => {
  beforeEach(() => {
    // Mockear variables de entorno
    process.env.NODE_ENV = 'test';
    process.env.VERCEL_ENV = 'preview';
  });

  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.environment).toBe('test');
  });

  it('should include memory information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.memory).toBeDefined();
    expect(data.memory.used).toBeGreaterThan(0);
    expect(data.memory.total).toBeGreaterThan(0);
  });

  it('should include environment variables check', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.environment_vars).toBeDefined();
    expect(data.environment_vars.NODE_ENV).toBe('test');
    expect(data.environment_vars.VERCEL_ENV).toBe('preview');
  });

  it('should handle errors gracefully', async () => {
    // Mock para simular un error
    const originalProcess = global.process;
    
    // Simular un escenario de error
    global.process = {
      ...originalProcess,
      env: {},
    } as any;

    const response = await GET();
    const data = await response.json();

    // El endpoint debería manejar el caso gracefully
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.environment_vars.NODE_ENV).toBeUndefined();

    // Restaurar proceso original
    global.process = originalProcess;
  });

  it('should respond quickly', async () => {
    const startTime = Date.now();
    await GET();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // < 100ms
  });
});
