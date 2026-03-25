# API & Validation

## Overview

Arquitectura de API REST con Next.js App Router, validaciones exhaustivas con Zod, manejo estandarizado de errores y protección de rutas basada en autenticación.

## Stack Tecnológico

### API Core
- **Framework**: Next.js 13+ App Router API Routes
- **Validation**: Zod v3 schemas
- **Error Handling**: Centralizado con custom errors
- **Security**: Authentication-based access control
- **Documentation**: OpenAPI/Swagger (opcional)

### Development Tools
- **Testing**: Vitest + Supertest
- **Type Safety**: TypeScript strict mode
- **HTTP Client**: Fetch API (built-in)
- **Rate Limiting**: Custom middleware

## API Architecture

### Route Structure
```
app/api/
├── auth/
│   ├── [...all]/               # Better Auth routes
│   ├── session/               # Session management
│   └── callback/              # OAuth callbacks
├── admin/
│   └── dashboard/             # Dashboard data
├── public/
│   └── health/                # Health check
└── socket/
    └── io/                    # Socket.io endpoint
```

### API Response Standards
```typescript
// lib/api/types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

## Zod Validation Schemas

### Base Schemas
```typescript
// schemas/base.ts
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const IdSchema = z.string().cuid('Invalid ID format');

export const SearchSchema = z.object({
  q: z.string().min(1, 'Search query required').max(100),
  ...PaginationSchema.shape,
});
```

### Auth Schemas
```typescript
// schemas/auth.ts
import { z } from 'zod';

export const SessionSchema = z.object({
  user: z.object({
    id: z.string().cuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    image: z.string().url().optional(),
  }),
  expiresAt: z.date(),
});
```

### Dashboard Schemas
```typescript
// schemas/dashboard.ts
import { z } from 'zod';

export const DashboardStatsSchema = z.object({
  totalSessions: z.number().min(0),
  systemHealth: z.enum(['healthy', 'degraded', 'down']),
  lastUpdated: z.date(),
});
```

## API Route Implementation

### Base API Handler
```typescript
// lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { ApiResponse } from './types';
import { ApiError } from './errors';

export interface ApiHandlerOptions<T = any> {
  schema?: ZodSchema;
  auth?: {
    required: boolean;
    roles?: string[];
  };
  handler: (data: T, context: { user?: any; session?: any }) => Promise<ApiResponse>;
}

export class ApiHandler {
  static async handle<T = any>(
    request: NextRequest,
    options: ApiHandlerOptions<T>
  ): Promise<NextResponse<ApiResponse>> {
    try {
      // Parse request body/query
      let data: T = {} as T;
      
      if (request.method !== 'GET') {
        const body = await request.json();
        data = options.schema ? options.schema.parse(body) : body;
      } else {
        const { searchParams } = new URL(request.url);
        const query = Object.fromEntries(searchParams);
        data = options.schema ? options.schema.parse(query) : query;
      }

      // Authentication check
      const context = await this.authenticate(options.auth);

      // Execute handler
      const result = await options.handler(data, context);

      return NextResponse.json(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private static async authenticate(authOptions?: ApiHandlerOptions['auth']) {
    if (!authOptions?.required) {
      return {};
    }

    // Implement authentication logic here
    // This would integrate with Better Auth
    const session = await this.getSession();
    
    if (!session) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    return {
      user: session.user,
      session,
    };
  }

  private static async getSession() {
    // Implement Better Auth session retrieval
    return null;
  }

  private static handleError(error: unknown): NextResponse<ApiResponse> {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
```

### Custom Error Classes
```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}
```

### Dashboard API Example
```typescript
// app/api/admin/dashboard/route.ts
import { NextRequest } from 'next/server';
import { ApiHandler } from '@/lib/api/handler';
import { DashboardStatsSchema } from '@/schemas/dashboard';

export async function GET(request: NextRequest) {
  return ApiHandler.handle(request, {
    auth: { required: true },
    handler: async () => {
      // Get dashboard statistics
      const stats = {
        totalSessions: 42,
        systemHealth: 'healthy',
        lastUpdated: new Date(),
      };

      return {
        success: true,
        data: DashboardStatsSchema.parse(stats),
      };
    },
  });
}
```

### Health Check API
```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbStatus = await checkDatabase();
    
    // Check system health
    const systemStatus = {
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json({
      success: true,
      data: systemStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
        },
      },
      { status: 500 }
    );
  }
}

async function checkDatabase(): boolean {
  // Implement database health check
  return true;
}
```

## Client-Side API Integration

### API Client
```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const search = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${search}`);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || '/api'
);
```

### React Hooks
```typescript
// hooks/use-api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/admin/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // 30 seconds
  });
}
```

## Testing

### Unit Tests
```typescript
// __tests__/api/dashboard.test.ts
import { GET } from '@/app/api/admin/dashboard/route';
import { NextRequest } from 'next/server';

describe('/api/admin/dashboard', () => {
  it('should return dashboard stats', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalSessions');
    expect(data.data).toHaveProperty('systemHealth');
  });

  it('should require authentication', async () => {
    // Test authentication requirement
    // This would need to be implemented with proper auth mocking
  });
});
```

### Integration Tests
```typescript
// __tests__/api/health.test.ts
import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('status');
    expect(data.data).toHaveProperty('timestamp');
  });
});
```

## Security Considerations

### Rate Limiting
```typescript
// middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map();

export function rateLimit(request: NextRequest, limit: number = 100, window: number = 60000) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowStart = now - window;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip);
  const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);

  if (validRequests.length >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);

  return null;
}
```

### CORS Configuration
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './middleware/rate-limit';

export function middleware(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // CORS headers
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Documentation

### OpenAPI Specification
```typescript
// Generate OpenAPI spec from Zod schemas
import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'RPM API',
    version: '1.0.0',
    description: 'API for RPM Accesorios administration',
  },
  paths: {
    '/api/admin/dashboard': {
      get: {
        summary: 'Get dashboard statistics',
        responses: {
          200: {
            description: 'Dashboard stats',
            schema: DashboardStatsSchema,
          },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'Health status',
          },
        },
      },
    },
  },
};
```

---

**Last Updated:** 2026-03-25  
**Status:** ✅ Core API architecture defined
