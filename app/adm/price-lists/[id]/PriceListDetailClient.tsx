"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Percent,
  DollarSign,
  Calculator,
  Search,
  Package,
  Pencil,
  GitBranch,
} from "lucide-react";
import { Header, StatItem, CrudStats } from "@/components/adm";
import { ModalBase, ModalBaseFooter } from "@/components/ui/ModalBase";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUI } from "@/components/ui/UIProvider";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PriceDisplay } from "@/components/ui/price-display";

interface PriceListItem {
  id: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  replacementCost?: number;
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
}

interface PriceListDetail {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  basePriceListId: string | null;
  itemCount: number;
  items: PriceListItem[];
}

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface PriceListDetailClientProps {
  initialPriceList: PriceListDetail;
}

export default function PriceListDetailClient({
  initialPriceList,
}: PriceListDetailClientProps) {
  const params = useParams();
  const priceListId = params.id as string;
  const { alert, confirm } = useUI();

  const [priceList, setPriceList] = useState<PriceListDetail>(initialPriceList);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [overrideMargin, setOverrideMargin] = useState<string>("");
  const [fixedPrice, setFixedPrice] = useState<string>("");

  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);
  const [editOverrideMargin, setEditOverrideMargin] = useState<string>("");
  const [editFixedPrice, setEditFixedPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPriceList = useCallback(async () => {
    try {
      const response = await fetch(`/api/price-lists/${priceListId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPriceList(data.priceList);
    } catch (error) {
      console.error("Error fetching price list:", error);
    } finally {
      setLoading(false);
    }
  }, [priceListId]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const handleAddException = async () => {
    if (!selectedProduct) {
      await alert({
        title: "Error",
        description: "Selecciona un producto",
        variant: "error",
      });
      return;
    }

    try {
      const response = await fetch(`/api/price-lists/${priceListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          overrideMarginPercentage: overrideMargin
            ? parseFloat(overrideMargin)
            : null,
          fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
        }),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setSelectedProduct("");
        setOverrideMargin("");
        setFixedPrice("");
        fetchPriceList();
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al agregar excepción",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error adding exception:", error);
    }
  };

  const handleDeleteException = async (item: PriceListItem) => {
    const confirmed = await confirm({
      title: "Eliminar excepción de precio",
      description: `¿Está seguro de eliminar la excepción para "${item.productName}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });

    if (!confirmed) return;

    // Capture previous data for undo
    const previousData = {
      productId: item.productId,
      overrideMarginPercentage: item.overrideMarginPercentage,
      fixedPrice: item.fixedPrice,
    };

    try {
      const response = await fetch(
        `/api/price-lists/${priceListId}/items/${item.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Optimistically remove from list
        setPriceList((prev) =>
          prev
            ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) }
            : prev,
        );
        toast.success("Excepción de precio eliminada", {
          action: {
            label: "Deshacer",
            onClick: async () => {
              try {
                const restoreRes = await fetch(
                  `/api/price-lists/${priceListId}/items`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(previousData),
                  },
                );
                if (restoreRes.ok) {
                  fetchPriceList();
                  toast.success("Excepción de precio restaurada");
                } else {
                  toast.error("Error al restaurar excepción");
                }
              } catch {
                toast.error("Error al restaurar excepción");
              }
            },
          },
          duration: 8000,
        });
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al eliminar excepción",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting exception:", error);
    }
  };

  const openAddModal = () => {
    fetchProducts();
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: PriceListItem) => {
    setEditingItem(item);
    setEditOverrideMargin(
      item.overrideMarginPercentage !== null ? String(item.overrideMarginPercentage) : ""
    );
    setEditFixedPrice(
      item.fixedPrice !== null ? String(item.fixedPrice) : ""
    );
    setIsEditModalOpen(true);
  };

  const handleEditException = async () => {
    if (!editingItem) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/price-lists/${priceListId}/items/${editingItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overrideMarginPercentage: editOverrideMargin
              ? parseFloat(editOverrideMargin)
              : null,
            fixedPrice: editFixedPrice ? parseFloat(editFixedPrice) : null,
          }),
        }
      );

      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditOverrideMargin("");
        setEditFixedPrice("");
        fetchPriceList();
        toast.success("Excepción de precio actualizada");
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al actualizar excepción",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error editing exception:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar excepción",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoundingRuleLabel = (rule: string) => {
    const labels: Record<string, string> = {
      EXACT: "Exacto",
      NEAREST_INTEGER: "Entero",
      PSYCHOLOGICAL: "Psicológico",
      SMART_HUNDREDS: "Inteligente",
    };
    return labels[rule] || rule;
  };

  const columns: ColumnDef<PriceListItem>[] = [
    {
      accessorKey: "productName",
      header: "Producto",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">
              {row.original.productName}
            </div>
            {row.original.productSku && (
              <div className="text-xs font-mono text-muted-foreground">
                {row.original.productSku}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "replacementCost",
      header: "Costo Repo.",
      cell: ({ row }) => (
        <div className="font-mono">
          <PriceDisplay value={row.original.replacementCost ?? 0} />
        </div>
      ),
    },
    {
      accessorKey: "overrideMarginPercentage",
      header: "Margen Override",
      cell: ({ row }) =>
        row.original.overrideMarginPercentage !== null ? (
          <Badge variant="secondary" className="font-mono">
            {row.original.overrideMarginPercentage}%
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "fixedPrice",
      header: "Precio Fijo",
      cell: ({ row }) =>
        row.original.fixedPrice !== null ? (
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary font-mono"
          >
            <PriceDisplay value={row.original.fixedPrice} />
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "finalPrice",
      header: "Precio Final",
      cell: ({ row }) => (
        <div className="font-bold font-mono">
          <PriceDisplay value={row.original.finalPrice} />
        </div>
      ),
    },
    {
      accessorKey: "actualMargin",
      header: "Margen Real",
      cell: ({ row }) => {
        const isLow = row.original.isBelowMinimum;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono ${
                isLow ? "text-amber-600 font-bold" : ""
              }`}
            >
              {row.original.actualMargin.toFixed(1)}%
            </span>
            {isLow && (
              <AlertTriangle
                className="h-4 w-4 text-amber-600 pointer-events-none"
                aria-hidden="true"
              />
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditModal(row.original)}
                aria-label="Editar excepción"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar excepción</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteException(row.original)}
                aria-label="Eliminar excepción"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar excepción</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!priceList) {
    return <div className="p-6">Lista de precios no encontrada</div>;
  }

  const stats: StatItem[] = [
    {
      label: "Margen Base",
      value: `${priceList.baseMarginPercentage}%`,
      icon: Percent,
    },
    {
      label: "Base",
      value: priceList.basePriceListId ? "Otra lista" : "Costo",
      icon: GitBranch,
    },
    {
      label: "Redondeo",
      value: getRoundingRuleLabel(priceList.roundingRule),
      icon: Calculator,
    },
    {
      label: "Excepciones",
      value: priceList.itemCount,
      icon: Search,
    },
    {
      label: "Estado",
      value: priceList.isActive ? "Activa" : "Inactiva",
      icon: DollarSign,
      iconColor: priceList.isActive ? "#10b981" : "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={priceList.name}
        description="Gestiona excepciones y precios específicos para esta lista"
        showBackButton
        primaryAction={{
          label: "Agregar Excepción",
          onClick: openAddModal,
          icon: Plus,
          ariaLabel: "Agregar nueva excepción de precio",
        }}
      />

      <CrudStats stats={stats} />

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Excepciones de Precio
            </CardTitle>
            <Badge variant="outline">{priceList.items.length} ítems</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {priceList.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calculator className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-muted-foreground mb-4">
                No hay excepciones configuradas para esta lista.
              </p>
              <Button onClick={openAddModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera excepción
              </Button>
            </div>
          ) : (
            <DataTable columns={columns} data={priceList.items} />
          )}
        </CardContent>
      </Card>

      {/* Add Exception Modal */}
      <ModalBase
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Excepción de Precio"
        description="Define un margen específico o un precio fijo para un producto en esta lista."
        footer={
          <ModalBaseFooter
            onCancel={() => setIsAddModalOpen(false)}
            onSave={handleAddException}
            saveText="Agregar Excepción"
          />
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="product" required>
              Producto
            </Label>
            <SearchableSelect
              apiUrl="/api/products"
              onSelect={(item) => setSelectedProduct(item.id)}
              placeholder="Buscar producto..."
              searchPlaceholder="Escribe el nombre o SKU..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overrideMargin">Margen Override (%)</Label>
              <div className="relative">
                <Percent
                  className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="overrideMargin"
                  type="number"
                  min={0}
                  step={0.1}
                  value={overrideMargin}
                  onChange={(e) => setOverrideMargin(e.target.value)}
                  placeholder="Ej: 35"
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixedPrice">Precio Fijo ($)</Label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="fixedPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder="Ej: 1500"
                  className="pl-9 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Si defines un <strong>precio fijo</strong>, este prevalecerá. De
              lo contrario, se usará el <strong>margen override</strong>. Si
              ambos están vacíos, se aplicará el margen base de la lista (
              {priceList.baseMarginPercentage}%).
            </p>
          </div>
        </div>
      </ModalBase>

      {/* Edit Exception Modal */}
      <ModalBase
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }
        }}
        title="Editar Excepción de Precio"
        description={
          editingItem?.productName
            ? `Modificar precio para ${editingItem.productName}`
            : "Modificar excepción de precio"
        }
        footer={
          <ModalBaseFooter
            onCancel={() => {
              if (!isSubmitting) {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }
            }}
            onSave={handleEditException}
            saveText="Guardar Cambios"
            isLoading={isSubmitting}
          />
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-overrideMargin">Margen Override (%)</Label>
              <div className="relative">
                <Percent
                  className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="edit-overrideMargin"
                  type="number"
                  min={0}
                  step={0.1}
                  value={editOverrideMargin}
                  onChange={(e) => setEditOverrideMargin(e.target.value)}
                  placeholder="Ej: 35"
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fixedPrice">Precio Fijo ($)</Label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="edit-fixedPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editFixedPrice}
                  onChange={(e) => setEditFixedPrice(e.target.value)}
                  placeholder="Ej: 1500"
                  className="pl-9 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Si defines un <strong>precio fijo</strong>, este prevalecerá. De
              lo contrario, se usará el <strong>margen override</strong>. Si
              ambos están vacíos, se aplicará el margen base de la lista (
              {priceList.baseMarginPercentage}%).
            </p>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
