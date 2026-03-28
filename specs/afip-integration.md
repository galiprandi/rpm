# 🧾 AFIP/Arca Facturación Electrónica

## Objetivo

Integración con AFIP (ahora ARCA) para emisión de comprobantes electrónicos con Código de Autorización Electrónica (CAE).

## Alcance por Fase

| Fase | Alcance | Esfuerzo Estimado |
|------|---------|-------------------|
| **Fase 1** | Factura B (Consumidor Final) + Sandbox | 16h (2 días) |
| **Fase 2** | Factura A (Responsables Inscriptos) + Notas de Crédito | 8h (1 día) |
| **Fase 3+** | Cierre Z automático, múltiples puntos de venta | 8h (1 día) |

## Stack Tecnológico

- **Librería**: `afip.js` (v2+) - Más madura y documentada en español
- **Ambiente**: Sandbox para testing, producción para go-live
- **Certificados**: CSR generado localmente, firmado por AFIP

## Librería Recomendada: afip.js

```bash
npm install afip.js
```

### Características
- ✅ Soporte Web Services Facturación Electrónica v1
- ✅ Manejo automático de TA (Ticket de Acceso)
- ✅ Sandbox y producción
- ✅ TypeScript definitions
- ✅ Documentación en español
- ✅ Comunidad activa Argentina

## Configuración

### 1. Setup Certificados (único)

```typescript
// scripts/generate-csr.ts
import { generateCSR } from 'afip.js';

// Generar clave privada y CSR
const { csr, privateKey } = generateCSR({
  commonName: 'RPM Accesorios',
  organization: 'RPM Accesorios y Equipamiento',
  cuit: 20409378472, // CUIT del negocio
});

// Guardar privateKey en archivo seguro
// Subir CSR a AFIP para obtener certificado
```

**Proceso manual en AFIP:**
1. Login en https://www.afip.gob.ar con clave fiscal
2. Menú: "Administrador de Certificados Digitales"
3. Nuevo certificado → Pegar CSR
4. Descargar certificado firmado
5. Guardar como `certificado.crt`

### 2. Variables de Entorno

```bash
# .env.local
AFIP_CUIT=20409378472
AFIP_CERT_PATH=./certs/certificado.crt
AFIP_PRIVATE_KEY_PATH=./certs/private.key
AFIP_PRODUCTION=false  # true para producción
```

### 3. Instancia de AFIP

```typescript
// lib/afip/client.ts
import Afip from 'afip.js';

export const afip = new Afip({
  CUIT: parseInt(process.env.AFIP_CUIT!),
  cert: process.env.AFIP_CERT_PATH!,
  privateKey: process.env.AFIP_PRIVATE_KEY_PATH!,
  production: process.env.AFIP_PRODUCTION === 'true',
});

// Verificar conexión
export async function verifyAfipConnection(): Promise<boolean> {
  try {
    const serverStatus = await afip.ElectronicBilling.getServerStatus();
    return serverStatus.AppServer === 'OK';
  } catch (error) {
    console.error('AFIP connection failed:', error);
    return false;
  }
}
```

## Modelo de Datos

### Entidad Invoice (Factura)

```typescript
// Prisma schema
model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique // 0001-00000001
  invoiceType     InvoiceType   // B, A, CREDIT, DEBIT
  
  // Datos AFIP
  caeCode         String        // Código Autorización Electrónica
  caeExpiryDate   DateTime      // Vencimiento CAE
  afipQrCode      String?       // QR para verificación
  
  // Datos receptor
  customerId      String?
  customer        Customer?     @relation(fields: [customerId], references: [id])
  customerName    String        // Denominación
  customerDocType DocType?      // DNI, CUIT, CUIL
  customerDocNumber String?
  
  // Totales
  subtotal        Decimal       @db.Decimal(10, 2)
  taxRate         Decimal       @default(21.00) @db.Decimal(5, 2)
  taxAmount       Decimal       @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  
  // Pago
  paymentMethod   PaymentMethod // CASH, TRANSFER, DEBIT, CREDIT
  
  // Relaciones
  workOrderId     String?
  workOrder       WorkOrder?    @relation(fields: [workOrderId], references: [id])
  items           InvoiceItem[]
  
  // Metadata
  status          InvoiceStatus @default(AUTHORIZED)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([customerId])
  @@index([workOrderId])
  @@index([createdAt])
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  type        ItemType // PRODUCT, SERVICE
  productId   String?
  serviceId   String?
  
  // Snapshot (precios no cambian)
  code        String  // SKU o código servicio
  description String
  quantity    Int
  unitPrice   Decimal @db.Decimal(10, 2)
  subtotal    Decimal @db.Decimal(10, 2)
  
  taxRate     Decimal @default(21.00) @db.Decimal(5, 2)
  taxAmount   Decimal @db.Decimal(10, 2)
  total       Decimal @db.Decimal(10, 2)
}

enum InvoiceType {
  A
  B
  M
  CREDIT
  DEBIT
}

enum InvoiceStatus {
  PENDING     // Antes de enviar a AFIP
  AUTHORIZED  // Con CAE
  CANCELLED   // Anulada
}

enum DocType {
  DNI
  CUIT
  CUIL
  PASSPORT
}

enum PaymentMethod {
  CASH
  TRANSFER
  DEBIT
  CREDIT
  MIXED
}

enum ItemType {
  PRODUCT
  SERVICE
}
```

## Servicio de Facturación

```typescript
// lib/afip/invoicing.ts
import { afip } from './client';
import { Prisma } from '@prisma/client';

interface CreateInvoiceInput {
  invoiceType: 'A' | 'B' | 'M';
  customerName: string;
  customerDocType?: 'DNI' | 'CUIT' | 'CUIL';
  customerDocNumber?: string;
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: 'CASH' | 'TRANSFER' | 'DEBIT' | 'CREDIT';
}

export async function createElectronicInvoice(input: CreateInvoiceInput) {
  // 1. Calcular totales
  const subtotal = input.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  const taxRate = 0.21; // 21% IVA
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  // 2. Obtener último número de comprobante
  const lastVoucher = await afip.ElectronicBilling.getLastVoucher({
    CbteTipo: input.invoiceType === 'B' ? 6 : 1, // 6 = Factura B, 1 = Factura A
    PtoVta: 1, // Punto de venta 1
  });
  
  const nextNumber = lastVoucher + 1;
  
  // 3. Construir data para AFIP
  const voucherData = {
    CantReg: 1,
    PtoVta: 1,
    CbteTipo: input.invoiceType === 'B' ? 6 : 1,
    Concepto: 1, // Productos
    DocTipo: input.customerDocNumber 
      ? (input.customerDocType === 'CUIT' ? 80 : 96) // 80 = CUIT, 96 = DNI
      : 99, // 99 = Consumidor Final
    DocNro: input.customerDocNumber ? parseInt(input.customerDocNumber.replace(/-/g, '')) : 0,
    CbteDesde: nextNumber,
    CbteHasta: nextNumber,
    CbteFch: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: subtotal,
    ImpOpEx: 0,
    ImpIVA: taxAmount,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1,
    Iva: [{
      Id: 5, // 21%
      BaseImp: subtotal,
      Importe: taxAmount,
    }],
    // Items detallados (opcional según versión WS)
    CbtesAsoc: [],
    Tributos: [],
    Opcionales: [],
  };
  
  // 4. Enviar a AFIP
  const response = await afip.ElectronicBilling.createVoucher(voucherData);
  
  // 5. Guardar en BD
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `0001-${String(nextNumber).padStart(8, '0')}`,
      invoiceType: input.invoiceType === 'B' ? 'B' : 'A',
      caeCode: response.CAE,
      caeExpiryDate: new Date(response.CAEFchVto.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
      customerName: input.customerName,
      customerDocType: input.customerDocType || null,
      customerDocNumber: input.customerDocNumber || null,
      subtotal: new Prisma.Decimal(subtotal),
      taxRate: new Prisma.Decimal(21),
      taxAmount: new Prisma.Decimal(taxAmount),
      total: new Prisma.Decimal(total),
      paymentMethod: input.paymentMethod,
      status: 'AUTHORIZED',
      items: {
        create: input.items.map(item => ({
          type: 'PRODUCT', // o SERVICE según corresponda
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          subtotal: new Prisma.Decimal(item.quantity * item.unitPrice),
          taxRate: new Prisma.Decimal(21),
          taxAmount: new Prisma.Decimal(item.quantity * item.unitPrice * 0.21),
          total: new Prisma.Decimal(item.quantity * item.unitPrice * 1.21),
        })),
      },
    },
    include: {
      items: true,
    },
  });
  
  return {
    invoice,
    afipResponse: response,
  };
}
```

## API Endpoints

### POST /api/invoices

Crear nueva factura electrónica.

```typescript
// app/api/invoices/route.ts
import { createElectronicInvoice } from '@/lib/afip/invoicing';
import { requireRole } from '@/lib/auth/rbac';

export async function POST(request: Request) {
  // Solo SELLER y ADMIN pueden facturar
  const session = await requireRole(['SELLER', 'ADMIN']);
  
  const body = await request.json();
  
  try {
    const result = await createElectronicInvoice(body);
    return Response.json({
      success: true,
      data: result.invoice,
      cae: result.afipResponse.CAE,
    });
  } catch (error) {
    console.error('Invoice creation failed:', error);
    return Response.json({
      success: false,
      error: 'Facturación fallida',
      details: error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}
```

### GET /api/invoices/:id/pdf

Generar PDF de factura con código de barras AFIP.

```typescript
// app/api/invoices/[id]/pdf/route.ts
import { generateInvoicePDF } from '@/lib/afip/pdf';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  
  if (!invoice) {
    return Response.json({ error: 'Factura no encontrada' }, { status: 404 });
  }
  
  const pdf = await generateInvoicePDF(invoice);
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
```

## Manejo de Errores

```typescript
// lib/afip/errors.ts
export enum AfipErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export class AfipError extends Error {
  constructor(
    public code: AfipErrorCode,
    message: string,
    public afipCode?: string
  ) {
    super(message);
  }
}

// Mapeo de errores comunes
const AFIP_ERROR_MESSAGES: Record<string, string> = {
  '600': 'Validación de token: Token inválido',
  '601': 'Validación de token: Token vencido',
  '602': 'Validación de token: CUIT no autorizado',
  '1000': 'Error general',
  // ... más códigos
};

export function parseAfipError(error: any): AfipError {
  const code = error.code || '1000';
  return new AfipError(
    AfipErrorCode.SERVER_ERROR,
    AFIP_ERROR_MESSAGES[code] || error.message || 'Error desconocido de AFIP',
    code
  );
}
```

## Testing

### Tests Unitarios

```typescript
// tests/afip.test.ts
describe('AFIP Integration', () => {
  test('should calculate invoice totals correctly', () => {
    const items = [
      { quantity: 2, unitPrice: 100 },
      { quantity: 1, unitPrice: 50 },
    ];
    
    const subtotal = items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    
    expect(subtotal).toBe(250);
    expect(subtotal * 0.21).toBe(52.5); // IVA
    expect(subtotal * 1.21).toBe(302.5); // Total
  });
  
  test('should format invoice number correctly', () => {
    const number = 42;
    const formatted = `0001-${String(number).padStart(8, '0')}`;
    expect(formatted).toBe('0001-00000042');
  });
});
```

### Tests de Integración (Sandbox)

```typescript
// tests/afip.integration.test.ts
import { afip } from '@/lib/afip/client';

describe('AFIP Sandbox Integration', () => {
  test('should connect to AFIP sandbox', async () => {
    const status = await afip.ElectronicBilling.getServerStatus();
    expect(status.AppServer).toBe('OK');
  });
  
  test('should get last voucher number', async () => {
    const last = await afip.ElectronicBilling.getLastVoucher({
      CbteTipo: 6, // Factura B
      PtoVta: 1,
    });
    expect(typeof last).toBe('number');
  });
  
  test('should create voucher in sandbox', async () => {
    // Solo en sandbox, no en producción
    if (process.env.AFIP_PRODUCTION === 'true') {
      return;
    }
    
    const response = await afip.ElectronicBilling.createVoucher({
      CantReg: 1,
      PtoVta: 1,
      CbteTipo: 6,
      // ... datos de prueba
    });
    
    expect(response.CAE).toBeDefined();
    expect(response.CAE.length).toBeGreaterThan(0);
  });
});
```

## Flujo de Implementación

### Fase 1: MVP Facturación (16 horas)

**Semana 1:**
- [ ] Setup certificados en AFIP Sandbox (2h)
- [ ] Instalar y configurar afip.js (2h)
- [ ] Modelo de datos Invoice + migración (3h)
- [ ] Servicio createElectronicInvoice (4h)

**Semana 2:**
- [ ] Endpoint POST /api/invoices (2h)
- [ ] UI pantalla de facturación (4h)
- [ ] Generación PDF simple (3h)
- [ ] Testing con Sandbox (2h)

### Fase 2: Completa (8 horas adicionales)

- [ ] Factura A (Responsables Inscriptos)
- [ ] Notas de Crédito
- [ ] Múltiples puntos de venta
- [ ] Consulta de comprobantes emitidos

## Consideraciones de Seguridad

1. **Certificados**: Nunca subir a git, usar variables de entorno
2. **CUIT**: Validar que el CUIT en el certificado coincida con el de la empresa
3. **Backup**: Guardar copia de seguridad de certificados y claves privadas
4. **Monitoreo**: Loggear errores de AFIP para detección temprana de problemas

## Vinculación con Otras Especificaciones

- `/specs/inventory-sales.md` - Flujo de venta y facturación
- `/specs/workshop.md` - Facturación desde OTs
- `/specs/auth.md` - Permisos para facturar
- `/specs/data-architecture.md` - Modelo de datos Invoice

---

**Estado**: Draft - Fase 1 lista para implementación
**Última actualización**: 2026-03-28
