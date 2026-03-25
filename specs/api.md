# API & Validation

## Overview

Arquitectura de API REST con Next.js App Router, validaciones exhaustivas con Zod, manejo estandarizado de errores y protección de rutas basada en roles.

## Stack Tecnológico

### API Core
- **Framework**: Next.js 13+ App Router API Routes
- **Validation**: Zod v3 schemas
- **Error Handling**: Centralizado con custom errors
- **Security**: Role-based access control
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
│   ├── [...nextauth]/          # NextAuth.js routes
│   ├── session/               # Session management
│   └── callback/              # OAuth callbacks
├── admin/
│   ├── users/                 # User management (admin only)
│   ├── products/              # Product management
│   ├── orders/                # Order management
│   └── dashboard/             # Dashboard data
├── public/
│   ├── products/              # Public product catalog
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
import { UserRole } from '@/lib/auth/roles';

export const UserRoleSchema = z.enum(['USER', 'STAFF', 'ADMIN']);

export const UserProfileSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  image: z.string().url().optional(),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: UserRoleSchema.optional(),
});

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100),
  role: UserRoleSchema.default('USER'),
});
```

### Product Schemas
```typescript
// schemas/product.ts
import { z } from 'zod';

export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, 'Price must be positive').max(999999.99),
  category: z.string().max(50).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  stock: z.number().min(0, 'Stock must be non-negative').default(0),
  isActive: z.boolean().default(true),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  active: z.coerce.boolean().default(true),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  ...PaginationSchema.shape,
});

export const ProductResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  category: z.string().nullable(),
  imageUrl: z.string().nullable(),
  stock: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().cuid(),
  updatedBy: z.string().cuid().nullable(),
  creator: UserProfileSchema.optional(),
  updater: UserProfileSchema.nullable().optional(),
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

export class ApiHandler {
  static async handle<T>(
    request: NextRequest,
    options: {
      schema?: ZodSchema;
      handler: (data: T, context: RequestContext) => Promise<ApiResponse<T>>;
      auth?: {
        required?: boolean;
        roles?: string[];
      };
    }
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      // Parse and validate request body
      let data: T = {} as T;
      if (options.schema && request.method !== 'GET') {
        const body = await request.json();
        data = options.schema.parse(body);
      }

      // Handle authentication
      const context = await this.buildContext(request, options.auth);

      // Execute handler
      const result = await options.handler(data, context);

      return NextResponse.json(result, { status: 200 });

    } catch (error) {
      return this.handleError(error);
    }
  }

  private static async buildContext(
    request: NextRequest,
    authOptions?: { required?: boolean; roles?: string[] }
  ): Promise<RequestContext> {
    const session = await getServerSession(authOptions);
    
    if (authOptions?.required && !session) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (authOptions?.roles && session) {
      const hasRole = authOptions.roles.includes(session.user.role);
      if (!hasRole) {
        throw new ApiError('FORBIDDEN', 'Insufficient permissions', 403);
      }
    }

    return {
      user: session?.user || null,
      session: session || null,
    };
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

    // Unknown error
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

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
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

### Product API Example
```typescript
// app/api/admin/products/route.ts
import { NextRequest } from 'next/server';
import { PrismaService } from '@/lib/prisma-with-error';
import { ApiHandler } from '@/lib/api/handler';
import { ProductCreateSchema, ProductQuerySchema } from '@/schemas/product';
import { UserRole } from '@/lib/auth/roles';

// GET /api/admin/products - List products
export async function GET(request: NextRequest) {
  return ApiHandler.handle(request, {
    schema: ProductQuerySchema,
    auth: { required: true, roles: [UserRole.STAFF, UserRole.ADMIN] },
    handler: async (query, context) => {
      const { page, limit, category, active, minPrice, maxPrice, sortBy, sortOrder } = query;
      
      const skip = (page - 1) * limit;
      
          const where = {
        isActive: active,
        ...(category && { category }),
        ...(minPrice && maxPrice && {
          price: { gte: minPrice, lte: maxPrice }
        }),
      };

      const [products, total] = await Promise.all([
        PrismaService.getProducts({
          skip,
          take: limit,
          category,
          active,
        }),
        PrismaService.getProductsCount(category),
      ]);

      return {
        success: true,
        data: products,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          timestamp: Date.now(),
        },
      };
    },
  });
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
  return ApiHandler.handle(request, {
    schema: ProductCreateSchema,
    auth: { required: true, roles: [UserRole.STAFF, UserRole.ADMIN] },
    handler: async (data, context) => {
      const product = await PrismaService.createProduct({
        ...data,
        createdBy: context.user!.id,
      });

      return {
        success: true,
        data: product,
      };
    },
  });
}
```

### Single Product API
```typescript
// app/api/admin/products/[id]/route.ts
import { NextRequest } from 'next/server';
import { PrismaService } from '@/lib/prisma-with-error';
import { ApiHandler } from '@/lib/api/handler';
import { ProductUpdateSchema, IdSchema } from '@/schemas/product';
import { UserRole } from '@/lib/auth/roles';

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiHandler.handle(request, {
    schema: IdSchema,
    auth: { required: true, roles: [UserRole.STAFF, UserRole.ADMIN] },
    handler: async ({ id }) => {
      const product = await PrismaService.getProductWithDetails(id);
      
      if (!product) {
        throw new NotFoundError('Product');
      }

      return {
        success: true,
        data: product,
      };
    },
  });
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiHandler.handle(request, {
    schema: ProductUpdateSchema,
    auth: { required: true, roles: [UserRole.STAFF, UserRole.ADMIN] },
    handler: async (data, context) => {
      const product = await PrismaService.updateProduct(params.id, {
        ...data,
        updatedBy: context.user!.id,
      });

      return {
        success: true,
        data: product,
      };
    },
  });
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiHandler.handle(request, {
    auth: { required: true, roles: [UserRole.ADMIN] },
    handler: async () => {
      await PrismaService.deleteProduct(params.id);

      return {
        success: true,
        data: { id: params.id },
      };
    },
  });
}
```

## Middleware Implementation

### Rate Limiting
```typescript
// middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit({
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 100,
}: {
  windowMs?: number;
  maxRequests?: number;
} = {}) {
  return function (request: NextRequest, response: NextResponse) {
    const clientId = request.ip || 'anonymous';
    const now = Date.now();
    
    // Clean up expired entries
    if (store[clientId] && store[clientId].resetTime < now) {
      delete store[clientId];
    }
    
    // Initialize or update counter
    if (!store[clientId]) {
      store[clientId] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[clientId].count++;
    }
    
    // Check if limit exceeded
    if (store[clientId].count > maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', 
      Math.max(0, maxRequests - store[clientId].count).toString()
    );
    response.headers.set('X-RateLimit-Reset', 
      store[clientId].resetTime.toString()
    );
    
    return response;
  };
}
```

### CORS Middleware
```typescript
// middleware/cors.ts
import { NextRequest, NextResponse } from 'next/server';

export function cors(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://rpm-wheat.vercel.app',
    'http://localhost:3000',
  ];

  if (allowedOrigins.includes(origin || '')) {
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', origin || '');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }

  return NextResponse.next();
}
```

## Client API Integration

### API Client
```typescript
// lib/api/client.ts
import { ApiResponse } from './types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
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
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

### React Query Integration
```typescript
// hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Products hooks
export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.get('/admin/products', params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCreate) => apiClient.post('/admin/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      apiClient.put(`/admin/products/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/api.test.ts
import { GET, POST } from '@/app/api/admin/products/route';
import { createMockRequest } from '@/lib/test-utils';

describe('Products API', () => {
  test('GET returns products list', async () => {
    const request = createMockRequest('GET', '/api/admin/products');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST creates new product', async () => {
    const productData = {
      name: 'Test Product',
      price: 99.99,
      category: 'Test',
    };

    const request = createMockRequest('POST', '/api/admin/products', productData);
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(productData.name);
  });

  test('POST validates required fields', async () => {
    const invalidData = { price: -10 }; // Missing name and invalid price

    const request = createMockRequest('POST', '/api/admin/products', invalidData);
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Integration Tests
```typescript
// tests/api.integration.test.ts
describe('API Integration', () => {
  test('Full product CRUD workflow', async () => {
    // Create
    const createResponse = await apiClient.post('/admin/products', {
      name: 'Integration Test Product',
      price: 199.99,
    });
    expect(createResponse.success).toBe(true);

    const productId = createResponse.data.id;

    // Read
    const getResponse = await apiClient.get(`/admin/products/${productId}`);
    expect(getResponse.success).toBe(true);
    expect(getResponse.data.name).toBe('Integration Test Product');

    // Update
    const updateResponse = await apiClient.put(`/admin/products/${productId}`, {
      price: 299.99,
    });
    expect(updateResponse.success).toBe(true);
    expect(updateResponse.data.price).toBe(299.99);

    // Delete
    const deleteResponse = await apiClient.delete(`/admin/products/${productId}`);
    expect(deleteResponse.success).toBe(true);
  });
});
```

## Documentation

### OpenAPI Specification
```typescript
// lib/api/openapi.ts
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'RPM Accesorios API',
    version: '1.0.0',
    description: 'API for RPM Accesorios management system',
  },
  paths: {
    '/api/admin/products': {
      get: {
        summary: 'List products',
        tags: ['Products'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Products list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductsResponse' },
              },
            },
          },
        },
      },
      // ... other endpoints
    },
  },
  components: {
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          // ... other properties
        },
      },
      // ... other schemas
    },
  },
};
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de Next.js API routes
- **auth.md**: Utiliza middleware de autenticación
- **database.md**: Integra con PrismaService
- **realtime.md**: Emite eventos desde API handlers

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de Vercel
- `/specs/vercel-deployment.md` - Environment variables

## Tests y Documentación Relacionados

### Tests Unitarios
- `api.test.ts` - Tests de endpoints básicos
- `validation.test.ts` - Tests de schemas Zod
- `middleware.test.ts` - Tests de middleware

### Documentación Técnica
- `docs/api-reference.md` - Referencia completa de API
- `docs/validation-guide.md` - Guía de validaciones
- `docs/error-handling.md` - Manejo de errores

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Todos pasando
- **Cobertura**: 90% (objetivo >95%)

## Maintenance

### Regular Tasks
- **Schema Updates**: Mantener schemas Zod sincronizados
- **API Versioning**: Estrategia para cambios breaking
- **Documentation**: Actualizar OpenAPI specs
- **Security**: Revisión de permisos y validaciones

### Monitoring
- **Request Logs**: Tracking de errores y performance
- **Rate Limits**: Monitoreo de límites de uso
- **Security Events**: Intentos de acceso no autorizado
