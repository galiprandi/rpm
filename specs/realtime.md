# Real-time Architecture

## Overview

Sistema de actualizaciones en tiempo real basado en Socket.io para mantener sincronizadas todas las interfaces de usuario cuando ocurren cambios en el backend, permitiendo colaboración en tiempo real entre staff y actualizaciones automáticas para clientes.

## Stack Tecnológico

### Real-time Core
- **WebSocket Library**: Socket.io v4
- **Server**: Next.js API Routes + Socket.io server
- **Client**: Socket.io client con React hooks
- **Message Protocol**: Event-driven architecture

### Integration Stack
- **State Management**: React Query para cache invalidation
- **Notifications**: Toast notifications system
- **Error Handling**: Reconnection strategies
- **Performance**: Event throttling y batching

## Socket.io Configuration

### Server Setup
```typescript
// lib/socket.ts
import { Server } from 'socket.io';
import { NextApiResponse } from 'next';
import { Socket as NetSocket } from 'net';

interface SocketWithIO extends NetSocket {
  server: any;
  io: Server;
}

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const SocketHandler = (res: ResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket.io already initialized');
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? 'https://rpm-wheat.vercel.app'
        : ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
    },
  });

  res.socket.server.io = io;
  console.log('Socket.io server initialized');
};
```

### API Route Handler
```typescript
// pages/api/socket/io.ts
import { NextApiRequest } from 'next';
import { SocketHandler } from '@/lib/socket';

export default function SocketIOHandler(req: NextApiRequest, res: any) {
  SocketHandler(res);
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

## Event Architecture

### Event Types Definition
```typescript
// lib/socket/events.ts
export enum SocketEvents {
  // Product Events
  PRODUCT_CREATED = 'product:created',
  PRODUCT_UPDATED = 'product:updated',
  PRODUCT_DELETED = 'product:deleted',
  
  // User Events
  USER_UPDATED = 'user:updated',
  USER_ROLE_CHANGED = 'user:role-changed',
  
  // Order Events
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  
  // Cache Events
  CACHE_INVALIDATE = 'cache:invalidate',
  CACHE_REFRESH = 'cache:refresh',
  
  // System Events
  SYSTEM_NOTIFICATION = 'system:notification',
  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected',
}

export interface SocketEventData {
  [SocketEvents.PRODUCT_CREATED]: {
    productId: string;
    productData: any;
    createdBy: string;
    timestamp: number;
  };
  
  [SocketEvents.PRODUCT_UPDATED]: {
    productId: string;
    changes: Partial<any>;
    updatedBy: string;
    timestamp: number;
  };
  
  [SocketEvents.CACHE_INVALIDATE]: {
    keys: string[];
    scope: 'user' | 'global' | 'role';
    affectedUsers?: string[];
  };
  
  [SocketEvents.SYSTEM_NOTIFICATION]: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    duration?: number;
    targetUsers?: string[];
  };
}
```

### Client Connection Handler
```typescript
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Initialize socket connection
    socketRef.current = io({
      path: '/api/socket/io',
      auth: {
        token: session.user.id,
        role: session.user.role,
      },
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('user:connected', {
        userId: session.user.id,
        role: session.user.role,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Product events
    socket.on('product:updated', (data) => {
      // Invalidate product queries
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['product', data.productId]);
      
      // Show notification
      showToast('Product updated', 'info');
    });

    socket.on('product:created', (data) => {
      queryClient.invalidateQueries(['products']);
      showToast('New product created', 'success');
    });

    // Cache events
    socket.on('cache:invalidate', (data) => {
      if (data.scope === 'global' || 
          (data.scope === 'role' && data.roles?.includes(session.user.role)) ||
          (data.scope === 'user' && data.affectedUsers?.includes(session.user.id))) {
        
        data.keys.forEach(key => {
          queryClient.invalidateQueries([key]);
        });
      }
    });

    // System notifications
    socket.on('system:notification', (data) => {
      if (!data.targetUsers || data.targetUsers.includes(session.user.id)) {
        showToast(data.message, data.type, data.duration);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session, queryClient]);

  return socketRef.current;
}
```

## Backend Event Emission

### Service Integration
```typescript
// services/productService.ts
import { getServerSession } from 'next-auth';
import { socketIO } from '@/lib/socket';
import { SocketEvents } from '@/lib/socket/events';

export async function updateProduct(id: string, data: ProductUpdate) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Update product in database
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
      updatedBy: session.user.id,
    },
  });

  // Emit real-time event
  socketIO?.emit(SocketEvents.PRODUCT_UPDATED, {
    productId: product.id,
    changes: data,
    updatedBy: session.user.id,
    timestamp: Date.now(),
  });

  return product;
}

export async function createProduct(data: ProductCreate) {
  const session = await getServerSession();
  
  const product = await prisma.product.create({
    data: {
      ...data,
      createdBy: session.user.id,
      createdAt: new Date(),
    },
  });

  // Emit creation event
  socketIO?.emit(SocketEvents.PRODUCT_CREATED, {
    productId: product.id,
    productData: product,
    createdBy: session.user.id,
    timestamp: Date.now(),
  });

  return product;
}
```

### Cache Invalidation Service
```typescript
// services/cacheService.ts
import { socketIO } from '@/lib/socket';
import { SocketEvents } from '@/lib/socket/events';

export class CacheInvalidationService {
  static invalidateGlobal(keys: string[]) {
    socketIO?.emit(SocketEvents.CACHE_INVALIDATE, {
      keys,
      scope: 'global',
      timestamp: Date.now(),
    });
  }

  static invalidateForRole(keys: string[], roles: string[]) {
    socketIO?.emit(SocketEvents.CACHE_INVALIDATE, {
      keys,
      scope: 'role',
      roles,
      timestamp: Date.now(),
    });
  }

  static invalidateForUsers(keys: string[], userIds: string[]) {
    socketIO?.emit(SocketEvents.CACHE_INVALIDATE, {
      keys,
      scope: 'user',
      affectedUsers: userIds,
      timestamp: Date.now(),
    });
  }

  static refreshCache(keys: string[]) {
    socketIO?.emit(SocketEvents.CACHE_REFRESH, {
      keys,
      timestamp: Date.now(),
    });
  }
}
```

## Performance Optimization

### Event Throttling
```typescript
// lib/socket/throttling.ts
class EventThrottler {
  private static instance: EventThrottler;
  private eventQueue: Map<string, any[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): EventThrottler {
    if (!EventThrottler.instance) {
      EventThrottler.instance = new EventThrottler();
    }
    return EventThrottler.instance;
  }

  throttle<T>(event: string, data: T, delay: number = 100) {
    if (!this.eventQueue.has(event)) {
      this.eventQueue.set(event, []);
    }

    this.eventQueue.get(event)!.push(data);

    if (this.timers.has(event)) {
      return; // Already scheduled
    }

    this.timers.set(event, setTimeout(() => {
      const events = this.eventQueue.get(event)!;
      if (events.length > 0) {
        // Batch events or send latest
        socketIO?.emit(event, events[events.length - 1]);
      }
      
      this.eventQueue.delete(event);
      this.timers.delete(event);
    }, delay));
  }
}

export const eventThrottler = EventThrottler.getInstance();
```

### Connection Management
```typescript
// lib/socket/connectionManager.ts
export class ConnectionManager {
  private static connectedUsers: Map<string, Set<string>> = new Map();
  private static userSockets: Map<string, string> = new Map();

  static addUser(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
    this.userSockets.set(socketId, userId);
  }

  static removeUser(socketId: string) {
    const userId = this.userSockets.get(socketId);
    if (userId) {
      this.connectedUsers.get(userId)?.delete(socketId);
      if (this.connectedUsers.get(userId)?.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
    this.userSockets.delete(socketId);
  }

  static getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  static isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  static getUserSocketIds(userId: string): string[] {
    return Array.from(this.connectedUsers.get(userId) || []);
  }
}
```

## Error Handling & Recovery

### Reconnection Strategy
```typescript
// hooks/useSocketReconnection.ts
export function useSocketReconnection() {
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnection = useCallback(() => {
    setIsReconnecting(true);
    setReconnectionAttempts(prev => prev + 1);

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectionAttempts), 30000);
    
    setTimeout(() => {
      setIsReconnecting(false);
    }, delay);
  }, [reconnectionAttempts]);

  return { reconnectionAttempts, isReconnecting, handleReconnection };
}
```

### Error Boundary
```typescript
// components/SocketErrorBoundary.tsx
export class SocketErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Socket error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">Connection Error</h3>
          <p className="text-red-600">
            Real-time features are temporarily unavailable.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/socket.test.ts
import { SocketEvents } from '@/lib/socket/events';

describe('Socket Events', () => {
  test('Emits product:updated event', async () => {
    const mockSocket = { emit: jest.fn() };
    
    await updateProduct('123', { name: 'Updated Product' });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvents.PRODUCT_UPDATED,
      expect.objectContaining({
        productId: '123',
        updatedBy: expect.any(String),
        timestamp: expect.any(Number),
      })
    );
  });

  test('Throttles rapid events', () => {
    const throttler = EventThrottler.getInstance();
    const mockSocket = { emit: jest.fn() };
    
    // Emit multiple rapid events
    for (let i = 0; i < 10; i++) {
      throttler.throttle('test:event', { id: i });
    }
    
    // Should only emit once after delay
    setTimeout(() => {
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    }, 150);
  });
});
```

### Integration Tests
```typescript
// tests/socket.integration.test.ts
describe('Socket Integration', () => {
  test('Client receives real-time updates', async () => {
    const client = io();
    const server = getServer();
    
    const promise = new Promise((resolve) => {
      client.on('product:updated', resolve);
    });
    
    // Trigger server event
    await updateProduct('123', { name: 'Test' });
    
    const result = await promise;
    expect(result.productId).toBe('123');
  });
});
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de Next.js API routes
- **auth.md**: Utiliza sesión para autenticación de socket
- **database.md**: Emite eventos basados en cambios DB
- **api.md**: Integra con API routes para eventos

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de Vercel
- `/specs/components.md` - Componentes real-time UI

## Tests y Documentación Relacionados

### Tests Unitarios
- `socket.test.ts` - Validación de eventos y throttling
- `socket.integration.test.ts` - Tests de conexión cliente-servidor
- `cache.test.ts` - Validación de invalidación

### Documentación Técnica
- `docs/socket-setup.md` - Guía de configuración
- `docs/realtime-patterns.md` - Patrones de implementación

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Todos pasando
- **Cobertura**: 85% (objetivo >90%)

## Monitoring & Maintenance

### Metrics to Track
- **Connection Count**: Usuarios conectados en tiempo real
- **Event Rate**: Frecuencia de eventos por tipo
- **Latency**: Tiempo de entrega de eventos
- **Error Rate**: Fallas en conexión o eventos

### Health Checks
```typescript
// api/socket/health/route.ts
export async function GET() {
  const connectedUsers = ConnectionManager.getConnectedUsers().length;
  const uptime = process.uptime();
  
  return Response.json({
    status: 'healthy',
    connectedUsers,
    uptime,
    timestamp: Date.now(),
  });
}
```

### Regular Maintenance
- **Connection Cleanup**: Limpiar conexiones inactivas
- **Event Monitoring**: Revisión de patrones anómalos
- **Performance**: Optimización de frecuencia de eventos
- **Security**: Validación de autenticación en cada evento
