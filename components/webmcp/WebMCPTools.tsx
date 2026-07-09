'use client';

import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const vehicleCategories = [
  'CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE',
  'TRAILER', 'AUDIO_EQUIPMENT', 'ELECTRIC_SCOOTER', 'OTHER',
] as const;

const inputSchema = {
  type: 'object' as const,
  properties: {
    customerName: { type: 'string', description: 'Nombre completo del cliente' },
    customerPhone: { type: 'string', description: 'Teléfono del cliente' },
    customerEmail: { type: 'string', description: 'Email del cliente' },
    customerAddress: { type: 'string', description: 'Dirección del cliente' },
    customerCuit: { type: 'string', description: 'CUIT/CUIL del cliente (opcional)' },
    identifier: { type: 'string', description: 'Patente / Identificador del vehículo' },
    category: {
      type: 'string' as const,
      enum: vehicleCategories,
      description: 'Categoría del vehículo',
    },
    make: { type: 'string', description: 'Marca del vehículo (ej: Toyota, Ford)' },
    model: { type: 'string', description: 'Modelo del vehículo (ej: Corolla, Ranger)' },
    year: { type: 'number', description: 'Año del vehículo' },
    color: { type: 'string', description: 'Color del vehículo' },
    notes: { type: 'string', description: 'Notas adicionales' },
  },
  required: ['customerName', 'identifier', 'category'],
};

interface WebMCPTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

const tool: Omit<WebMCPTool, 'name'> = {
  title: 'Registrar Cliente y Vehículo',
  description: 'Crea un nuevo cliente y su vehículo en una sola operación. Usar cuando llega un cliente nuevo con un vehículo.',
  inputSchema,
  execute: async (args) => {
    const customer = await apiPost('/api/customers', {
      name: args.customerName,
      phone: args.customerPhone || undefined,
      email: args.customerEmail || undefined,
      address: args.customerAddress || undefined,
      billingData: args.customerCuit
        ? { cuit: args.customerCuit, invoiceType: 'B' }
        : undefined,
    });

    const vehicle = await apiPost('/api/vehicles', {
      identifier: args.identifier,
      category: args.category,
      customerId: customer.id,
      year: args.year ? Number(args.year) : undefined,
      color: args.color || undefined,
      make: args.make || undefined,
      model: args.model || undefined,
      notes: args.notes || undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ customer, vehicle }, null, 2),
        },
      ],
    };
  },
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: WebMCPTool) => Promise<void>;
      unregisterTool: (name: string) => void;
    };
  }
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMCPTool) => Promise<void>;
      unregisterTool: (name: string) => void;
    };
  }
}

function getModelContext() {
  if (typeof document !== 'undefined' && document.modelContext) {
    return document.modelContext;
  }
  if (typeof navigator !== 'undefined' && navigator.modelContext) {
    return navigator.modelContext;
  }
  return null;
}

export function WebMCPTools() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const ctx = getModelContext();

    if (!ctx) {
      console.log('[WebMCP] not available in this browser');
      return;
    }

    setSupported(true);

    try {
      ctx.registerTool({ name: 'registerCustomerWithVehicle', ...tool });
      console.log('[WebMCP] registered tool: registerCustomerWithVehicle');
    } catch (e) {
      console.error('[WebMCP] failed to register tool:', e);
    }

    return () => {
      try {
        ctx.unregisterTool('registerCustomerWithVehicle');
      } catch {
        /* ignore on cleanup */
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white shadow-lg">
            <Terminal className="h-3.5 w-3.5" />
            WebMCP
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>WebMCP activo — 1 tool disponible</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
