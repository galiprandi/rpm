"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/adm/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatARS } from "@/lib/utils/format";
import {
  FileText,
  Download,
  Printer,
  AlertCircle,
  User,
  ArrowLeft,
  Send,
  XCircle,
  CheckCircle2,
  Undo2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  type: string;
  referenceId: string;
  referenceType: string;
  customerId?: string;
  customerName: string;
  customerDoc?: string;
  customerDocType?: string;
  subtotal: number;
  tax: number;
  iva21: number;
  iva105: number;
  total: number;
  status: string;
  afipData?: any;
  createdAt: string;
  issuedAt?: string;
  createdBy: string;
  items: InvoiceItem[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerDocType: "SIN_DOC",
    customerDoc: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBillingData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // Critical form protection rule

    setIsSaving(true);
    const toastId = toast.loading("Guardando datos de facturación...");

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          customerDoc: editForm.customerDocType === "SIN_DOC" ? "" : editForm.customerDoc.trim(),
          customerDocType: editForm.customerDocType,
        }),
      });

      if (response.ok) {
        toast.success("Datos actualizados correctamente", { id: toastId });
        setIsEditDialogOpen(false);
        // Re-fetch to update UI state
        const updatedResponse = await fetch(`/api/invoices/${id}`);
        if (updatedResponse.ok) {
          setInvoice(await updatedResponse.json());
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar los datos", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating billing data:", error);
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);

          // Auto-print if search param is present
          if (searchParams.get("print") === "true") {
            setTimeout(() => window.print(), 1000);
          }
        } else {
          toast.error("No se pudo encontrar el comprobante");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id, searchParams]);

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

  const isPreInvoice =
    invoice.type.startsWith("X_") ||
    invoice.type.startsWith("NOTA_CREDITO_X_") ||
    invoice.type === "PRESUPUESTO" ||
    invoice.type === "REMITO";

  const isIssued = invoice.status === "ISSUED";
  const isTypeB = invoice.type.endsWith("_B") || invoice.type.endsWith("_X_B");

  const getDocLetter = (type: string) => {
    if (type.startsWith("X_") || type.startsWith("NOTA_CREDITO_X_")) return "X";
    if (type.endsWith("_A")) return "A";
    if (type.endsWith("_B")) return "B";
    if (type.endsWith("_C")) return "C";
    if (type === "REMITO") return "R";
    if (type === "PRESUPUESTO") return "P";
    return type.charAt(0);
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "¿Está seguro de que desea cancelar este comprobante? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        toast.success("Comprobante cancelado correctamente");
        router.refresh();
        // Re-fetch to update UI state
        const updatedResponse = await fetch(`/api/invoices/${id}`);
        if (updatedResponse.ok) {
          setInvoice(await updatedResponse.json());
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al cancelar el comprobante");
      }
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error("Error de conexión");
    }
  };

  const handleOfficialize = async () => {
    const toastId = toast.loading("Oficializando comprobante ante AFIP...");
    try {
      const response = await fetch(`/api/invoices/${id}/officialize`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Comprobante oficializado con éxito", { id: toastId });
        // Re-fetch to update UI state
        const updatedResponse = await fetch(`/api/invoices/${id}`);
        if (updatedResponse.ok) {
          setInvoice(await updatedResponse.json());
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al oficializar", { id: toastId });
      }
    } catch (error) {
      console.error("Error officializing invoice:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 print:py-0 print:space-y-0 max-w-5xl">
      <div className="print:hidden">
        <Header
          title={`${invoice.type.replace(/_/g, " ")} ${invoice.number}`}
          description="Detalle del comprobante emitido"
          showBackButton
          secondaryActions={[
            {
              label: "Imprimir",
              onClick: () => window.print(),
              icon: Printer,
              variant: "outline",
            },
            {
              label: "Descargar PDF",
              onClick: () => window.print(),
              icon: Download,
            },
            ...((invoice.status === "DRAFT" || invoice.status === "REJECTED") && (invoice.type.startsWith("X_") || invoice.type.startsWith("NOTA_CREDITO_X_"))
              ? [
                  {
                    label: "Enviar a AFIP",
                    onClick: handleOfficialize,
                    icon: Send,
                    variant: "default" as const,
                  },
                ]
              : []),
            ...(invoice.status === "DRAFT" || invoice.status === "REJECTED"
              ? [
                  {
                    label: "Cancelar",
                    onClick: handleCancel,
                    icon: XCircle,
                    variant: "destructive" as const,
                  },
                ]
              : []),
            ...(isIssued
              ? [
                  {
                    label: "Anular (NC)",
                    onClick: () => {
                      toast.info("Para anular un comprobante oficializado, genere una Nota de Crédito desde la venta u OT original.");
                    },
                    icon: Undo2,
                    variant: "outline" as const,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {isPreInvoice && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center gap-3 text-orange-800 print:bg-white print:border-2 print:border-black print:text-black print:my-4 print:justify-center">
          <AlertCircle className="h-5 w-5 print:hidden" />
          <span className="font-bold uppercase tracking-tight text-center">
            No válido como comprobante fiscal
          </span>
        </div>
      )}

      {invoice.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col gap-2 text-red-800 print:hidden">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            <span className="font-bold uppercase tracking-tight">
              Comprobante Rechazado por AFIP
            </span>
          </div>
          {invoice.afipData?.error && (
            <p className="text-sm font-medium ml-8">{invoice.afipData.error}</p>
          )}
          {invoice.afipData?.observaciones && invoice.afipData.observaciones.length > 0 && (
            <ul className="text-sm list-disc ml-12">
              {invoice.afipData.observaciones.map((obs: string, idx: number) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Professional Invoice Header (Print Only) */}
      <div className="hidden print:flex justify-between border-b-2 border-black pb-6 mb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">
            RPM ACCESORIOS
          </h1>
          <p className="text-sm">Ruta 22 y 15, Cipolletti, Río Negro</p>
          <p className="text-sm">Tel: +54 299 123-4567</p>
          <p className="text-sm">Email: info@rpmaccesorios.com.ar</p>
        </div>
        <div className="text-right space-y-1">
          <div className="inline-block border-2 border-black px-4 py-2 mb-2">
            <span className="text-4xl font-bold">
              {getDocLetter(invoice.type)}
            </span>
          </div>
          <h2 className="text-xl font-bold uppercase">
            {invoice.type.replace(/_/g, " ")}
          </h2>
          <p className="text-lg font-mono font-bold">{invoice.number}</p>
          <p className="text-sm">
            Fecha:{" "}
            {format(new Date(invoice.createdAt), "dd/MM/yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-2 print:gap-10">
        <div className="md:col-span-2 space-y-6 print:col-span-2">
          {/* Customer & Info Info for Print */}
          <div className="hidden print:grid grid-cols-2 gap-8 mb-8">
            <div className="border p-4 rounded-lg">
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                Cliente
              </h3>
              <p className="text-lg font-bold">{invoice.customerName}</p>
              {invoice.customerDoc && (
                <p className="text-sm font-mono uppercase">
                  {invoice.customerDocType}: {invoice.customerDoc}
                </p>
              )}
            </div>
            <div className="border p-4 rounded-lg">
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                Detalles
              </h3>
              <p className="text-sm">
                Condición: {isTypeB ? "Consumidor Final" : "Responsable Inscripto"}
              </p>
              <p className="text-sm">
                Referencia: {invoice.referenceType} #
                {invoice.referenceId.substring(0, 8)}
              </p>
            </div>
          </div>

          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="print:px-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider print:text-black print:font-bold">
                Detalle de Conceptos
              </CardTitle>
            </CardHeader>
            <CardContent className="print:px-0">
              <Table className="print:border">
                <TableHeader className="print:bg-gray-100">
                  <TableRow>
                    <TableHead className="print:text-black print:font-bold">
                      Descripción
                    </TableHead>
                    <TableHead className="text-right print:text-black print:font-bold">
                      Cant.
                    </TableHead>
                    <TableHead className="text-right print:text-black print:font-bold">
                      P. Unit
                    </TableHead>
                    <TableHead className="text-right print:text-black print:font-bold">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: InvoiceItem, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatARS(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatARS(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-muted-foreground italic"
                      >
                        Detalle no disponible - Ver totales abajo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-8 flex justify-end">
                <div className="w-full md:w-1/2 space-y-2 border-t pt-4">
                  {!isTypeB ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground print:text-black">
                          Subtotal Gravado
                        </span>
                        <span className="font-mono">
                          {formatARS(invoice.subtotal)}
                        </span>
                      </div>
                      {Number(invoice.iva21) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground print:text-black">
                            IVA (21%)
                          </span>
                          <span className="font-mono">
                            {formatARS(invoice.iva21)}
                          </span>
                        </div>
                      )}
                      {Number(invoice.iva105) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground print:text-black">
                            IVA (10.5%)
                          </span>
                          <span className="font-mono">
                            {formatARS(invoice.iva105)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground print:text-black">
                        Subtotal
                      </span>
                      <span className="font-mono">
                        {formatARS(invoice.total)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-black pt-2 text-xl font-black">
                    <span>TOTAL</span>
                    <span className="font-mono text-emerald-700">
                      {formatARS(invoice.total)}
                    </span>
                  </div>
                  {isTypeB && (
                    <p className="text-[10px] text-right text-muted-foreground uppercase tracking-widest mt-1">
                      IVA Incluido
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="print:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Información de Origen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Referencia</p>
                    <p className="font-medium uppercase tracking-tight">
                      {invoice.referenceType.replace(/_/g, " ")} #
                      {invoice.referenceId.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Emitido por</p>
                    <p className="font-medium">{invoice.createdBy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cliente
              </CardTitle>
              {(invoice.status === "DRAFT" || invoice.status === "REJECTED") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Editar datos de facturación"
                  onClick={() => {
                    setEditForm({
                      customerName: invoice.customerName || "",
                      customerDocType: invoice.customerDocType || "SIN_DOC",
                      customerDoc: invoice.customerDoc || "",
                    });
                    setIsEditDialogOpen(true);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
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
                Estado Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Estado actual:</span>
                  <Badge
                    variant={
                      invoice.status === "ISSUED" ? "default" : "outline"
                    }
                    className={
                      invoice.status === "ISSUED"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : ""
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fecha emisión:</span>
                  <span className="text-sm font-mono">
                    {format(new Date(invoice.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
                {invoice.issuedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fecha oficial:</span>
                    <span className="text-sm font-mono">
                      {format(new Date(invoice.issuedAt), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
                {invoice.afipData?.cae && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm">CAE:</span>
                    <span className="text-sm font-mono font-bold">
                      {invoice.afipData.cae}
                    </span>
                  </div>
                )}
                {invoice.afipData?.caeVencimiento && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vto. CAE:</span>
                    <span className="text-sm font-mono">
                      {format(new Date(invoice.afipData.caeVencimiento), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
                {invoice.afipData?.observaciones && invoice.afipData.observaciones.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      Observaciones AFIP:
                    </span>
                    <ul className="text-[10px] space-y-1 text-muted-foreground list-disc ml-4">
                      {invoice.afipData.observaciones.map((obs: string, idx: number) => (
                        <li key={idx}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature section for Remitos */}
      {invoice.type === "REMITO" && (
        <div className="hidden print:grid grid-cols-2 gap-20 mt-20">
          <div className="border-t border-black pt-2 text-center">
            <p className="text-xs font-bold uppercase">Entregado por</p>
          </div>
          <div className="border-t border-black pt-2 text-center">
            <p className="text-xs font-bold uppercase">Recibido conforme</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Nombre, DNI y Firma
            </p>
          </div>
        </div>
      )}

      {/* Footer for Print */}
      <div className="hidden print:block mt-20 text-center border-t pt-8">
        <p className="text-xs text-muted-foreground uppercase tracking-widest italic">
          Gracias por confiar en RPM Accesorios
        </p>
      </div>

      {/* Dialog para Editar Datos de Facturación */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Datos de Facturación
            </DialogTitle>
            <DialogDescription>
              Modifique los datos fiscales del cliente para este comprobante. El cambio de tipo de documento podría modificar el tipo de comprobante (A ↔ B) y su número.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBillingData} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" required>Nombre o Razón Social</Label>
              <Input
                id="customerName"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                required
                placeholder="Ej. Juan Pérez o RPM S.A."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerDocType">Tipo de Doc.</Label>
                <select
                  id="customerDocType"
                  value={editForm.customerDocType}
                  onChange={(e) => {
                    const docType = e.target.value;
                    setEditForm({
                      ...editForm,
                      customerDocType: docType,
                      customerDoc: docType === 'SIN_DOC' ? '' : editForm.customerDoc
                    });
                  }}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="SIN_DOC">Sin Documento</option>
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerDoc">Nro. de Documento</Label>
                <Input
                  id="customerDoc"
                  value={editForm.customerDoc}
                  onChange={(e) => setEditForm({ ...editForm, customerDoc: e.target.value })}
                  disabled={editForm.customerDocType === 'SIN_DOC'}
                  required={editForm.customerDocType !== 'SIN_DOC'}
                  placeholder={editForm.customerDocType === 'CUIT' ? "20-12345678-9" : "Nro. de documento"}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !editForm.customerName.trim()}
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
