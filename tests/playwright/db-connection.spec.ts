/**
 * Test suite E2E para Database Connection
 * 
 * Especificaciones relacionadas:
 * - /specs/database.md - Database configuration and health checks
 * 
 * Alcance del test:
 * - Validación de health check endpoint en producción
 * - Test de conexión a base de datos real
 * - Validación de variables de entorno
 * - Test de respuesta del API
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <2s de respuesta
 */

import { test, expect } from '@playwright/test';

test.describe('Database Connection E2E Tests', () => {
  test.beforeEach(async () => {
    test.setTimeout(10000);
  });

  test.describe('Health Check Endpoint', () => {
    test('should respond to health check endpoint', async ({ request }) => {
      const response = await request.get('/api/health/db');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy']).toContain(data.status);
    });

    test('should have database field set to postgresql', async ({ request }) => {
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      expect(data.database).toBe('postgresql');
    });

    test('should have valid timestamp format', async ({ request }) => {
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');
      
      // Should be a valid ISO timestamp
      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    test('should respond quickly', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get('/api/health/db');
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should include connections count when healthy', async ({ request }) => {
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      if (data.status === 'healthy') {
        expect(data).toHaveProperty('connections');
        expect(typeof data.connections).toBe('number');
        expect(data.connections).toBeGreaterThan(0);
      }
    });

    test('should include error message when unhealthy', async ({ request }) => {
      // This test assumes database might be unavailable in some scenarios
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      if (data.status === 'unhealthy') {
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Debug Environment Endpoint', () => {
    test('should respond to debug environment endpoint', async ({ request }) => {
      const response = await request.get('/api/debug/env');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('variables');
      expect(data).toHaveProperty('timestamp');
    });

    test('should show production environment', async ({ request }) => {
      const response = await request.get('/api/debug/env');
      const data = await response.json();
      
      expect(data.environment).toBe('production');
    });

    test('should show database variables as SET', async ({ request }) => {
      const response = await request.get('/api/debug/env');
      const data = await response.json();
      
      expect(data.variables.DATABASE_URL).toBe('SET');
      expect(data.variables.POSTGRES_URL).toBe('SET');
      expect(data.variables.POSTGRES_PRISMA_URL).toBe('SET');
      expect(data.variables.POSTGRES_URL_NON_POOLING).toBe('SET');
    });

    test('should have NODE_ENV set to production', async ({ request }) => {
      const response = await request.get('/api/debug/env');
      const data = await response.json();
      
      expect(data.variables.NODE_ENV).toBe('SET');
    });
  });

  test.describe('Database Integration', () => {
    test('should handle concurrent health check requests', async ({ request }) => {
      // Test multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        request.get('/api/health/db')
      );
      
      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // All should have consistent data
      const dataPromises = responses.map(response => response.json());
      const dataResults = await Promise.all(dataPromises);
      
      const firstStatus = dataResults[0].status;
      dataResults.forEach(data => {
        expect(data.status).toBe(firstStatus);
        expect(data.database).toBe('postgresql');
      });
    });

    test('should maintain consistent response format', async ({ request }) => {
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      // Verify required fields exist
      const requiredFields = ['status', 'database', 'timestamp'];
      requiredFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });
      
      // Verify data types
      expect(typeof data.status).toBe('string');
      expect(typeof data.database).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      
      // Verify valid values
      expect(['healthy', 'unhealthy']).toContain(data.status);
      expect(data.database).toBe('postgresql');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid endpoint gracefully', async ({ request }) => {
      const response = await request.get('/api/health/db/invalid');
      
      expect(response.status()).toBe(404);
    });

    test('should handle POST request to GET endpoint', async ({ request }) => {
      const response = await request.post('/api/health/db', {});
      
      // Should either work or return method not allowed
      expect([200, 405]).toContain(response.status());
    });
  });

  test.describe('Performance', () => {
    test('should maintain performance under load', async ({ request }) => {
      const startTime = Date.now();
      
      // Make 10 consecutive requests
      const promises = Array.from({ length: 10 }, () => 
        request.get('/api/health/db')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 10 requests in <5 seconds
    });

    test('should have consistent response times', async ({ request }) => {
      const times: number[] = [];
      
      // Make 5 requests and measure each
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await request.get('/api/health/db');
        const endTime = Date.now();
        
        expect(response.status()).toBe(200);
        times.push(endTime - startTime);
      }
      
      // Response times should be reasonable and consistent
      times.forEach(time => {
        expect(time).toBeLessThan(2000); // Each request <2s
      });
      
      // Calculate average
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      expect(avgTime).toBeLessThan(1000); // Average <1s
    });
  });

  test.describe('Security', () => {
    test('should not expose sensitive information', async ({ request }) => {
      const response = await request.get('/api/health/db');
      const data = await response.json();
      
      // Should not contain database URLs or passwords
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('postgres://');
      expect(responseText).not.toContain('sk_');
    });

    test('should not expose sensitive info in debug endpoint', async ({ request }) => {
      const response = await request.get('/api/debug/env');
      const data = await response.json();
      
      // Should only show 'SET' or 'NOT_SET', not actual values
      Object.values(data.variables).forEach(value => {
        expect(['SET', 'NOT_SET']).toContain(value);
      });
    });
  });
});
