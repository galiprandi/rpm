'use client';

import { useState } from 'react';
import { Header } from '@/components/adm/Header';
import { CreateCountOperative } from '@/components/inventory-count/CreateCountOperative';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';

interface InventoryCountItem {
  id: string;
  createdAt: string;
  itemCount: number;
  status: string;
  items: Array<{ reportedAt: string | null }>;
}

interface InventoryCountsClientProps {
  counts: InventoryCountItem[];
}

export function InventoryCountsClient({ counts }: InventoryCountsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-6">
        <Header
          title="Conteo Cíclico Inteligente"
          description="Auditorías de stock basadas en riesgo y rotación"
          primaryAction={{
            label: 'Nuevo Conteo',
            onClick: () => setModalOpen(true),
            icon: Plus,
          }}
        />

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
                  <TableHead>Avance</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay operativos registrados. Crea uno nuevo para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  counts.map((count) => {
                    const reportedCount = count.items.filter(item => item.reportedAt !== null).length;
                    const totalCount = count.items.length;
                    const progressPercent = totalCount > 0 ? Math.round((reportedCount / totalCount) * 100) : 0;

                    return (
                      <TableRow key={count.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(count.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">{new Date(count.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{count.itemCount} productos</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{reportedCount}/{totalCount}</span>
                              <span className="text-xs text-muted-foreground">({progressPercent}%)</span>
                            </div>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CreateCountOperative open={modalOpen} onOpenChange={setModalOpen} />
    </>
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
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Aprobado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
