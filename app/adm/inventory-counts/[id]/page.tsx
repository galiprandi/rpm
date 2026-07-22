import { Header } from '@/components/adm/Header';
import { ApprovalView } from '@/components/inventory-count/ApprovalView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Smartphone, Info } from 'lucide-react';
import { headers } from 'next/headers';

import { db } from '@/lib/db';
import { inventoryCountOperative } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Package, ClipboardList, Calendar } from 'lucide-react';

export default async function InventoryCountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const operative = await db.query.inventoryCountOperative.findFirst({
    where: eq(inventoryCountOperative.id, id),
    with: {
      inventoryCountItems: true,
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="text-amber-700 border-amber-200 bg-amber-50"
          >
            Pendiente
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge
            variant="outline"
            className="text-blue-700 border-blue-200 bg-blue-50"
          >
            En Proceso
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge
            variant="outline"
            className="text-purple-700 border-purple-200 bg-purple-50"
          >
            Realizado
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge
            variant="outline"
            className="text-emerald-700 border-emerald-200 bg-emerald-50"
          >
            Aprobado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Construct QR URL (using current host)
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const mobileUrl = `${protocol}://${host}/inventory-counts/mobile/${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Detalle de Auditoría"
        description="Monitoreo y aprobación de conteo"
        showBackButton
      >
        {operative && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {getStatusBadge(operative.status)}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
              <Package
                className="h-3.5 w-3.5 text-primary pointer-events-none"
                aria-hidden="true"
              />
              <span className="font-mono">{(operative.inventoryCountItems || []).length}</span>{' '}
              Artículos
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
              <Calendar
                className="h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              {new Date(operative.createdAt).toLocaleDateString('es-AR')}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
              <ClipboardList
                className="h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <span className="font-mono uppercase">{operative.id.slice(0, 8)}</span>
            </div>
          </div>
        )}
      </Header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ApprovalView operativeId={id} />
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Acceso para Operario
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <div className="bg-white p-2 border rounded-xl shadow-inner">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Escanea este código</p>
                <p className="text-xs text-muted-foreground mt-1">
                  El operario debe escanear esto con su celular para iniciar la tarea de conteo ciego.
                </p>
              </div>
              <div className="w-full pt-2 border-t text-[10px] break-all text-muted-foreground font-mono">
                {mobileUrl}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Instrucciones Móviles
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>1. El operario debe estar autenticado en el taller.</p>
              <p>2. El conteo es <strong>ciego</strong> (no verá existencias del sistema).</p>
              <p>3. Puede actualizar la ubicación del estante sobre la marcha.</p>
              <p className="flex items-start gap-2 bg-blue-50 p-2 rounded text-blue-800">
                <Info className="h-4 w-4 shrink-0" />
                <span>Si el operario ya terminó, verás los datos reflejados en la tabla de la izquierda.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
