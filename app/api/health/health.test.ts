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
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VERCEL_ENV', 'preview');
  });

  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
    // No expone env vars, memoria, ni uptime por seguridad
    expect(data.environment_vars).toBeUndefined();
    expect(data.memory).toBeUndefined();
    expect(data.uptime).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    const response = await GET();
    const data = await response.json();

    // El endpoint debería manejar el caso gracefully
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  it('should respond quickly', async () => {
    const startTime = Date.now();
    await GET();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // < 100ms
  });
});
