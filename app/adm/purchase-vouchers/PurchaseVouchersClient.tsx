"use client";

import React, { useState, useMemo } from "react";
import { CreateDraftVoucherDialog } from "@/components/purchaseVoucher/CreateDraftVoucherDialog";
import { AddVoucherItemDialog } from "@/components/purchaseVoucher/AddVoucherItemDialog";
import { VoucherPreviewDialog } from "@/components/purchaseVoucher/VoucherPreviewDialog";
import { type PurchaseVoucher } from "@/types/purchaseVoucher";
import { Header, CrudStats, CrudAdmin } from "@/components/adm";
import { formatARS } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Plus,
  History,
  FileText,
  Trash2,
  Eye,
  Play,
  Truck,
  Pencil,
} from "lucide-react";
import { useUI } from "@/components/ui/UIProvider";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoucherWithPaymentMethod extends PurchaseVoucher {
  paymentMethodId: string | null;
  paymentMethod: { name: string } | null;
  itemsCount?: number;
  itemsSubtotal?: number;
}

interface PurchaseVouchersClientProps {
  initialVouchers: VoucherWithPaymentMethod[];
}

export default function PurchaseVouchersClient({
  initialVouchers,
}: PurchaseVouchersClientProps) {
  const { alert, confirm } = useUI();
  const [vouchers, setVouchers] =
    useState<VoucherWithPaymentMethod[]>(initialVouchers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState<string>("");
  const [currentVoucherTotal, setCurrentVoucherTotal] = useState<number>(0);
  const [currentVoucherPaymentMethodId, setCurrentVoucherPaymentMethodId] =
    useState<string | null>(null);
  const [currentVoucherLetter, setCurrentVoucherLetter] = useState<string>("");
  const [currentVoucherNumber, setCurrentVoucherNumber] = useState<string>("");
  const [currentVoucherSupplierName, setCurrentVoucherSupplierName] =
    useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingVoucherData, setEditingVoucherData] = useState<{
    supplierId: string;
    letter: string;
    number: string;
    date: string;
    totalAmount: string;
    paymentMethodId: string;
    notes: string;
  } | null>(null);

  const draftsCount = vouchers.filter((v) => v.status === "DRAFT").length;
  const finalizedCount = vouchers.filter(
    (v) => v.status === "FINALIZED",
  ).length;
  const totalAmountSum = formatARS(
    vouchers.reduce((acc, v) => acc + parseFloat(v.totalAmount || "0"), 0),
    0,
  );

  const handleVoucherCreated = async () => {
    try {
      const response = await fetch("/api/purchase-vouchers");
      if (response.ok) {
        const data = await response.json();
        const vouchersFormatted = data.map((v: any) => {
          const itemsCount = v.items?.length ?? 0;
          const itemsSubtotal =
            v.items?.reduce(
              (sum: number, it: any) => sum + parseFloat(it.subtotal),
              0,
            ) ?? 0;
          return {
            ...v,
            supplier: v.supplier
              ? { name: v.supplier.name }
              : { name: "Desconocido" },
            itemsCount,
            itemsSubtotal,
          };
        });
        setVouchers(vouchersFormatted);
      }
    } catch (error) {
      console.error("Error reloading vouchers:", error);
    }
  };

  const handleBackToHeader = async () => {
    try {
      const response = await fetch(
        `/api/purchase-vouchers/${currentVoucherId}`,
      );
      if (response.ok) {
        const voucher = await response.json();
        setEditingVoucherData({
          supplierId: voucher.supplierId,
          letter: voucher.letter,
          number: voucher.number,
          date: new Date(voucher.date).toISOString().split("T")[0],
          totalAmount: voucher.totalAmount.toString(),
          paymentMethodId: voucher.paymentMethodId || "",
          notes: voucher.notes || "",
        });
        setIsAddItemDialogOpen(false);
        setIsCreateDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading voucher data:", error);
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    const confirmed = await confirm({
      title: "Eliminar borrador",
      description:
        "¿Estás seguro de eliminar este borrador? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/purchase-vouchers/${voucherId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al eliminar el comprobante",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      await alert({
        title: "Error",
        description: "Error al eliminar el comprobante",
        variant: "error",
      });
    }
  };

  const columns = useMemo<ColumnDef<VoucherWithPaymentMethod>[]>(
    () => [
      {
        accessorKey: "supplierName",
        header: "Proveedor",
        cell: ({ row }) => {
          const name =
            row.original.supplier?.name ||
            row.original.supplierName ||
            "Desconocido";
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span className="font-semibold tracking-tight">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "number",
        header: "Comprobante",
        cell: ({ row }) => (
          <span className="font-semibold tracking-tight font-mono">
            {row.original.letter} - {row.original.number}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.date).toLocaleDateString("es-AR")}
          </span>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Forma de Pago",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.paymentMethod?.name || "Cuenta Corriente"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === "DRAFT" ? "secondary" : "outline"}
              className={
                status === "FINALIZED"
                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                  : ""
              }
            >
              {status === "DRAFT" ? "Borrador" : "Finalizado"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Monto Total</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.original.totalAmount);
          return (
            <div className="text-right font-semibold tracking-tight font-mono">
              {formatARS(amount, 2)}
            </div>
          );
        },
      },
      {
        id: "progress",
        header: "Completado",
        cell: ({ row }) => {
          if (row.original.status === "FINALIZED")
            return <span className="text-muted-foreground text-xs">—</span>;

          const itemsCount = row.original.itemsCount ?? 0;
          const itemsSubtotal = row.original.itemsSubtotal ?? 0;
          const totalAmount = parseFloat(row.original.totalAmount);
          const progressPct =
            totalAmount > 0
              ? Math.min(100, (itemsSubtotal / totalAmount) * 100)
              : 0;
          const isComplete = progressPct >= 95;

          return (
            <div className="space-y-1 w-32">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {itemsCount} {itemsCount === 1 ? "ítem" : "ítems"}
                </span>
                <span
                  className={`font-medium font-mono ${isComplete ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {progressPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          );
        },
      },
    ],
    [],
  );

  const stats = [
    {
      label: "Borradores",
      value: draftsCount,
      icon: FileText,
      iconColor: "#f97316", // orange-500
    },
    {
      label: "Finalizados",
      value: finalizedCount,
      icon: History,
      iconColor: "#10b981", // emerald-500
    },
    {
      label: "Total Acumulado",
      value: totalAmountSum,
      icon: Receipt,
      iconColor: "#3b82f6", // blue-500
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Comprobantes de Compra"
        description="Gestión y registro de facturas de proveedores y comprobantes"
        primaryAction={{
          label: "Nuevo Comprobante",
          onClick: () => setIsCreateDialogOpen(true),
          icon: Plus,
          ariaLabel: "Crear nuevo comprobante de compra",
        }}
      />

      <CrudStats stats={stats} />

      <CrudAdmin
        items={vouchers}
        columns={columns}
        loading={false}
        hideCreateAction
        createButtonText="Nuevo Comprobante"
        emptyMessage="No hay comprobantes cargados"
        tableTitle="Listado de Comprobantes"
        searchPlaceholder="Buscar por proveedor o número..."
        rowActions={(v) => (
          <div className="flex items-center justify-end gap-2">
            {v.status === "DRAFT" ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-emerald-700 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        setCurrentVoucherId(v.id);
                        setCurrentVoucherTotal(parseFloat(v.totalAmount));
                        setCurrentVoucherPaymentMethodId(
                          v.paymentMethodId ?? null,
                        );
                        setCurrentVoucherLetter(v.letter);
                        setCurrentVoucherNumber(v.number);
                        setCurrentVoucherSupplierName(
                          v.supplier?.name || v.supplierName || "",
                        );
                        setIsAddItemDialogOpen(true);
                      }}
                      aria-label="Continuar carga de comprobante"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Continuar carga</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-700 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setCurrentVoucherId(v.id);
                        setCurrentVoucherTotal(parseFloat(v.totalAmount));
                        setCurrentVoucherPaymentMethodId(
                          v.paymentMethodId ?? null,
                        );
                        setCurrentVoucherLetter(v.letter);
                        setCurrentVoucherNumber(v.number);
                        setCurrentVoucherSupplierName(
                          v.supplier?.name || v.supplierName || "",
                        );
                        setIsPreviewOpen(true);
                      }}
                      aria-label="Ver vista previa de comprobante"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Vista previa</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `/api/purchase-vouchers/${v.id}`,
                          );
                          if (response.ok) {
                            const voucher = await response.json();
                            setCurrentVoucherId(v.id);
                            setEditingVoucherData({
                              supplierId: voucher.supplierId,
                              letter: voucher.letter,
                              number: voucher.number,
                              date: new Date(voucher.date)
                                .toISOString()
                                .split("T")[0],
                              totalAmount: voucher.totalAmount.toString(),
                              paymentMethodId: voucher.paymentMethodId || "",
                              notes: voucher.notes || "",
                            });
                            setIsCreateDialogOpen(true);
                          }
                        } catch (error) {
                          console.error("Error loading voucher data:", error);
                        }
                      }}
                      aria-label="Editar datos de cabecera"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar cabecera</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteVoucher(v.id)}
                      aria-label="Eliminar borrador de comprobante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    asChild
                  >
                    <a
                      href={`/adm/purchase-vouchers/${v.id}`}
                      aria-label="Ver detalle de comprobante"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver detalle</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      />

      <CreateDraftVoucherDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingVoucherData(null);
        }}
        onDraftCreated={(voucher) => {
          setIsCreateDialogOpen(false);
          setEditingVoucherData(null);
          setCurrentVoucherId(voucher.id);
          setCurrentVoucherTotal(
            parseFloat(voucher.totalAmount?.toString() || "0"),
          );
          setCurrentVoucherPaymentMethodId(
            (voucher as any).paymentMethodId ?? null,
          );
          setCurrentVoucherLetter(voucher.letter);
          setCurrentVoucherNumber(voucher.number);
          setCurrentVoucherSupplierName(voucher.supplier?.name || "");
          setIsAddItemDialogOpen(true);
        }}
        editingVoucherId={editingVoucherData ? currentVoucherId : undefined}
        initialData={editingVoucherData}
      />

      <VoucherPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        voucherId={currentVoucherId}
        onContinue={() => {
          setIsPreviewOpen(false);
          setIsAddItemDialogOpen(true);
        }}
      />

      <AddVoucherItemDialog
        isOpen={isAddItemDialogOpen}
        onClose={() => {
          setIsAddItemDialogOpen(false);
          handleVoucherCreated();
        }}
        voucherId={currentVoucherId}
        voucherTotal={currentVoucherTotal}
        paymentMethodId={currentVoucherPaymentMethodId}
        letter={currentVoucherLetter}
        number={currentVoucherNumber}
        supplierName={currentVoucherSupplierName}
        onItemAdded={() => {
          handleVoucherCreated();
        }}
        onFinish={() => {
          setIsAddItemDialogOpen(false);
          handleVoucherCreated();
        }}
        onBackToHeader={handleBackToHeader}
      />
    </div>
  );
}
