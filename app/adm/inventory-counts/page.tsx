import { Header } from '@/components/adm/Header';
import { CreateCountOperative } from '@/components/inventory-count/CreateCountOperative';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Clock, CheckCircle2, QrCode } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InventoryCountsPage() {
  const counts = await prisma.inventory_count_operative.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Conteo Cíclico Inteligente"
        description="Auditorías de stock basadas en riesgo y rotación"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operativos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Artículos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay operativos registrados. Crea uno nuevo para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    counts.map((count) => (
                      <TableRow key={count.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(count.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">{new Date(count.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{count.itemCount} productos</TableCell>
                        <TableCell>
                          <StatusBadge status={count.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/adm/inventory-counts/${count.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CreateCountOperative />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Proceso</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Realizado</Badge>;
    case 'APPROVED':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
