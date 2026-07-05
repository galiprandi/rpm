'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatARS } from '@/lib/utils/format';
import { FileText, Download, Printer, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        } else {
          toast.error('No se pudo encontrar el comprobante');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold">Comprobante no encontrado</h2>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const isPreInvoice = invoice.type.startsWith('X_') || invoice.type.startsWith('NOTA_CREDITO_X_');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header
        title={`${invoice.type.replace('_', ' ')} ${invoice.number}`}
        description="Detalle del comprobante emitido"
        showBackButton
        secondaryActions={[
          {
            label: 'Imprimir',
            onClick: () => window.print(),
            icon: Printer,
            variant: 'outline',
          },
          {
            label: 'Descargar PDF',
            onClick: () => toast.info('Generación de PDF en desarrollo'),
            icon: Download,
          },
        ]}
      />

      {isPreInvoice && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center gap-3 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-bold uppercase tracking-tight">No válido como comprobante fiscal</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Resumen de Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Subtotal</TableCell>
                    <TableCell className="text-right font-mono">{formatARS(invoice.subtotal)}</TableCell>
                  </TableRow>
                  {invoice.iva21 > 0 && (
                    <TableRow>
                      <TableCell>IVA (21%)</TableCell>
                      <TableCell className="text-right font-mono">{formatARS(invoice.iva21)}</TableCell>
                    </TableRow>
                  )}
                  {invoice.iva105 > 0 && (
                    <TableRow>
                      <TableCell>IVA (10.5%)</TableCell>
                      <TableCell className="text-right font-mono">{formatARS(invoice.iva105)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold font-mono text-lg">
                      {formatARS(invoice.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Referencia</p>
                  <p className="font-medium">{invoice.referenceType} #{invoice.referenceId.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Emitido por</p>
                  <p className="font-medium">{invoice.createdBy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{invoice.customerName}</p>
                  {invoice.customerDoc && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {invoice.customerDocType}: {invoice.customerDoc}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Estado actual:</span>
                  <Badge variant="outline">{invoice.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fecha:</span>
                  <span className="text-sm font-mono">
                    {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
