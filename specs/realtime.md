# Real-time Architecture

## Overview

Sistema de actualizaciones en tiempo real basado en Socket.io para mantener sincronizadas todas las interfaces de usuario cuando ocurren cambios en el backend, permitiendo colaboración en tiempo real entre staff y actualizaciones automáticas.

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
  return io;
};
```

### Socket Events
```typescript
// lib/socket/events.ts
export enum SocketEvents {
  // System Events
  SYSTEM_NOTIFICATION = 'system:notification',
  SESSION_CONNECTED = 'session:connected',
  SESSION_DISCONNECTED = 'session:disconnected',
  
  // Cache Events
  CACHE_INVALIDATE = 'cache:invalidate',
  
  // Health Events
  HEALTH_STATUS_CHANGED = 'health:status-changed',
}

export interface SocketEventData {
  [SocketEvents.SYSTEM_NOTIFICATION]: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  
  [SocketEvents.CACHE_INVALIDATE]: {
    keys: string[];
    scope: 'global' | 'session';
  };
  
  [SocketEvents.HEALTH_STATUS_CHANGED]: {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: number;
  };
}
```

### Client Connection Handler
```typescript
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      path: '/api/socket/io',
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('session:connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Cache events
    socket.on('cache:invalidate', (data) => {
      data.keys.forEach(key => {
        queryClient.invalidateQueries([key]);
      });
    });

    // System notifications
    socket.on('system:notification', (data) => {
      showToast(data.message, data.type, data.duration);
    });

    // Health status changes
    socket.on('health:status-changed', (data) => {
      queryClient.invalidateQueries(['health']);
      if (data.status !== 'healthy') {
        showToast(`System status: ${data.status}`, 'warning');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef.current;
}

function showToast(message: string, type: string, duration?: number) {
  // Implement toast notification
  console.log(`[${type.toUpperCase()}] ${message}`);
}
```

### Service Integration
```typescript
// services/healthService.ts
import { socketIO } from '@/lib/socket';
import { SocketEvents } from '@/lib/socket/events';

export async function updateHealthStatus(status: 'healthy' | 'degraded' | 'down') {
  // Update health status in database
  await prisma.systemHealth.update({
    where: { id: 'system' },
    data: { 
      status,
      updatedAt: new Date(),
    },
  });

  // Emit real-time event
  socketIO?.emit(SocketEvents.HEALTH_STATUS_CHANGED, {
    status,
    timestamp: Date.now(),
  });
}

export async function invalidateCache(keys: string[], scope: 'global' | 'session' = 'global') {
  // Emit cache invalidation event
  socketIO?.emit(SocketEvents.CACHE_INVALIDATE, {
    keys,
    scope,
    timestamp: Date.now(),
  });
}
```

## Cache Management

### React Query Integration
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Cache invalidation utilities
export class CacheManager {
  static invalidate(keys: string[]) {
    keys.forEach(key => {
      queryClient.invalidateQueries([key]);
    });
  }

  static invalidatePattern(pattern: string) {
    const cache = queryClient.getQueryCache();
    cache.getAll().forEach(query => {
      if (query.queryKey[0]?.toString().includes(pattern)) {
        queryClient.invalidateQueries(query.queryKey);
      }
    });
  }

  static clear() {
    queryClient.clear();
  }
}
```

## Performance Optimization

### Event Throttling
```typescript
// lib/socket/throttler.ts
export class EventThrottler {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static throttle(event: string, callback: () => void, delay: number = 1000) {
    const existingTimer = this.timers.get(event);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      this.timers.delete(event);
    }, delay);

    this.timers.set(event, timer);
  }

  static cancel(event: string) {
    const timer = this.timers.get(event);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(event);
    }
  }
}
```

### Event Batching
```typescript
// lib/socket/batcher.ts
export class EventBatcher {
  private static batches: Map<string, any[]> = new Map();
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static batch<T>(event: string, data: T, delay: number = 100) {
    if (!this.batches.has(event)) {
      this.batches.set(event, []);
    }

    this.batches.get(event)!.push(data);

    if (!this.timers.has(event)) {
      const timer = setTimeout(() => {
        const batch = this.batches.get(event) || [];
        this.emitBatch(event, batch);
        this.batches.delete(event);
        this.timers.delete(event);
      }, delay);

      this.timers.set(event, timer);
    }
  }

  private static emitBatch(event: string, batch: any[]) {
    // Emit batched event
    console.log(`Batching ${batch.length} events for ${event}`);
  }
}
```

## Error Handling

### Reconnection Strategy
```typescript
// hooks/useSocket.ts (enhanced)
export function useSocket() {
  // ... existing code ...

  useEffect(() => {
    const socket = io({
      path: '/api/socket/io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      // Refresh data on reconnect
      queryClient.invalidateQueries();
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to socket');
      showToast('Connection lost. Please refresh the page.', 'error');
    });

    // ... rest of the code ...
  }, [queryClient]);
}
```

### Error Boundary
```typescript
// components/SocketErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Socket error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">Connection Error</h3>
          <p className="text-red-600">
            Real-time features are temporarily unavailable.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing

### Socket Events Testing
```typescript
// __tests__/socket/events.test.ts
import { SocketEvents } from '@/lib/socket/events';

describe('Socket Events', () => {
  test('Emits health status change event', async () => {
    const mockSocket = { emit: jest.fn() };
    
    await updateHealthStatus('degraded');
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvents.HEALTH_STATUS_CHANGED,
      expect.objectContaining({
        status: 'degraded',
        timestamp: expect.any(Number),
      })
    );
  });

  test('Invalidates cache correctly', async () => {
    const mockSocket = { emit: jest.fn() };
    
    await invalidateCache(['dashboard', 'health']);
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvents.CACHE_INVALIDATE,
      expect.objectContaining({
        keys: ['dashboard', 'health'],
        scope: 'global',
      })
    );
  });
});
```

### Integration Testing
```typescript
// __tests__/socket/integration.test.ts
import { io as ClientIO } from 'socket.io-client';
import { setupServer } from 'socket.io-testing';

describe('Socket Integration', () => {
  let server: any;
  let client: any;

  beforeAll(async () => {
    server = setupServer();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    client = ClientIO(server.url);
  });

  afterEach(() => {
    client.close();
  });

  test('Client connects and receives events', async () => {
    const promise = new Promise((resolve) => {
      client.on('health:status-changed', resolve);
    });
    
    // Trigger server event
    await updateHealthStatus('healthy');
    
    const result = await promise;
    expect(result).toHaveProperty('status', 'healthy');
  });
});
```

## Monitoring

### Connection Metrics
```typescript
// lib/socket/metrics.ts
export class SocketMetrics {
  private static connections: number = 0;
  private static disconnections: number = 0;
  private static errors: number = 0;

  static incrementConnections() {
    this.connections++;
    this.reportMetric('connections', this.connections);
  }

  static incrementDisconnections() {
    this.disconnections++;
    this.reportMetric('disconnections', this.disconnections);
  }

  static incrementErrors() {
    this.errors++;
    this.reportMetric('errors', this.errors);
  }

  private static reportMetric(name: string, value: number) {
    console.log(`Socket Metric: ${name} = ${value}`);
    // Send to monitoring service
  }

  static getMetrics() {
    return {
      connections: this.connections,
      disconnections: this.disconnections,
      errors: this.errors,
      activeConnections: this.connections - this.disconnections,
    };
  }
}
```

## Security

### Authentication
```typescript
// lib/socket/auth.ts
export function authenticateSocket(socket: any, next: any) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  // Validate token with Better Auth
  validateToken(token)
    .then(session => {
      socket.session = session;
      next();
    })
    .catch(error => {
      next(new Error('Invalid authentication token'));
    });
}

async function validateToken(token: string) {
  // Implement token validation
  return { user: { id: '123', email: 'test@example.com' } };
}
```

### Rate Limiting
```typescript
// lib/socket/rateLimit.ts
export class SocketRateLimit {
  private static requests: Map<string, number[]> = new Map();

  static check(socketId: string, limit: number = 100, window: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - window;

    if (!this.requests.has(socketId)) {
      this.requests.set(socketId, []);
    }

    const requests = this.requests.get(socketId)!;
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(socketId, validRequests);
    return true;
  }
}
```

## Configuration

### Environment Variables
```bash
# .env.local
SOCKET_ENABLED=true
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_RECONNECTION_ATTEMPTS=5
SOCKET_RECONNECTION_DELAY=1000
```

### Socket Options
```typescript
// lib/socket/config.ts
export const socketConfig = {
  enabled: process.env.SOCKET_ENABLED === 'true',
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
  reconnection: {
    attempts: parseInt(process.env.SOCKET_RECONNECTION_ATTEMPTS || '5'),
    delay: parseInt(process.env.SOCKET_RECONNECTION_DELAY || '1000'),
  },
};
```

---

**Last Updated:** 2026-03-25  
**Status:** ✅ Real-time architecture defined
