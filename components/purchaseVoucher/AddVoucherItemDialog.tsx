"use client";

import { useState, useEffect } from "react";
import { ModalBase } from "@/components/ui/ModalBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/components/ui/UIProvider";
import { ProductServiceSelector, type SelectedItem } from "@/components/ui/ProductServiceSelector";
import { calculateFinalPrice, type RoundingRule } from "@/lib/utils/rounding";
import { Plus, CheckCircle, Package, AlertTriangle, TrendingDown, Trash2 } from "lucide-react";
import { QuickProductDialog } from "./QuickProductDialog";

interface PriceList {
  id: string;
  name: string;
  baseMarginPercentage: number;
  roundingRule: RoundingRule;
}

interface PriceListPrice {
  priceListId: string;
  priceListName: string;
  baseMargin: number;
  calculatedPrice: number;
  fixedPrice: number | null;
  isFixed: boolean;
  isBelowMinimum: boolean;
}

interface VoucherItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  priceListPrices: PriceListPrice[];
  currentStock?: number;
}

interface AddVoucherItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucherId: string;
  voucherTotal: number;
  paymentMethodId?: string | null;
  letter?: string;
  number?: string;
  supplierName?: string;
  onItemAdded?: () => void;
  onFinish?: () => void;
  onBackToHeader?: () => void;
}

export function AddVoucherItemDialog({
  isOpen,
  onClose,
  voucherId,
  voucherTotal,
  paymentMethodId,
  letter,
  number,
  supplierName,
  onItemAdded,
  onFinish,
  onBackToHeader,
}: AddVoucherItemDialogProps) {
  const { alert, confirm } = useUI();
  const [loading, setLoading] = useState(false);
  const [selectorKey, setSelectorKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    sku?: string;
    allPrices?: Record<string, { finalPrice: number; isBelowMinimum: boolean; isFixed: boolean; overrideMargin: number | null; roundingRule: string }>;
    replacementCost?: number;
    costPrice?: number;
  } | null>(null);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [minimumMargin, setMinimumMargin] = useState<number>(15); // Default 15%

  // New item form
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [priceListPrices, setPriceListPrices] = useState<PriceListPrice[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductKey, setQuickProductKey] = useState(0);

  const loadExistingItems = async (plOverride?: PriceList[]) => {
    const plToUse = plOverride || priceLists;
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucherId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          const loaded = data.items.map((it: Record<string, unknown>) => ({
            id: it.id as string,
            productId: it.productId as string,
            productName: it.productName as string,
            quantity: it.quantity as number,
            unitCost: Number(it.unitCost),
            subtotal: Number(it.subtotal),
            priceListPrices: it.priceListData ? Object.entries(it.priceListData as Record<string, unknown>).map(([k, v]: [string, unknown]) => ({
              priceListId: k,
              priceListName: plToUse.find(p => p.id === k)?.name || k,
              baseMargin: plToUse.find(p => p.id === k)?.baseMarginPercentage || 0,
              calculatedPrice: (v as { price?: number }).price || 0,
              fixedPrice: (v as { isFixed?: boolean; price?: number }).isFixed ? (v as { price?: number }).price : null,
              isFixed: (v as { isFixed?: boolean }).isFixed || false,
              isBelowMinimum: false,
            })) : [],
            currentStock: (it.product as { stock?: number })?.stock,
          }));
          setItems(loaded);
        }
      }
    } catch (err) {
      console.error("Error loading existing items:", err);
    }
  };

  // Calculate projected stock for a product (current stock + quantities from all items in this voucher)
  const getProjectedStock = (productId: string, currentStock?: number): number => {
    const totalQuantityInVoucher = items
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return (currentStock || 0) + totalQuantityInVoucher;
  };

  // Load price lists, settings, and existing items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadAll = async () => {
      try {
        const [plRes] = await Promise.allSettled([
          fetch("/api/price-lists"),
        ]);
        let fetchedPriceLists: PriceList[] = [];
        if (plRes.status === "fulfilled" && plRes.value.ok) {
          const plData = await plRes.value.json();
          fetchedPriceLists = plData.priceLists || [];
          setPriceLists(fetchedPriceLists);
        }

        // Fetch minimum margin from settings
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setMinimumMargin(settingsData.minimumMarginPercentage || 15);
        }

        // Load existing items after price lists are set (pass the fetched price lists directly)
        await loadExistingItems(fetchedPriceLists);
      } catch (err) {
        console.error("Error fetching price lists:", err);
      }
    };

    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, voucherId]);

  const recalculatePrices = (cost: number, productAllPrices?: Record<string, { finalPrice: number; isBelowMinimum: boolean; isFixed: boolean; overrideMargin: number | null; roundingRule: string }> | undefined) => {
    if (cost <= 0 || priceLists.length === 0) return;

    // Preserve user's manual isFixed state from current priceListPrices
    const currentFixedStates = new Map(priceListPrices.map(p => [p.priceListId, p.isFixed]));
    const currentFixedPrices = new Map(priceListPrices.filter(p => p.isFixed).map(p => [p.priceListId, p.fixedPrice]));

    const prices: PriceListPrice[] = priceLists.map((pl) => {
      const productPriceInfo = productAllPrices?.[pl.id];
      const userManuallyFixed = currentFixedStates.get(pl.id);

      if (userManuallyFixed) {
        // User manually set this to fixed - preserve it with recalculated value
        const margin = productPriceInfo?.overrideMargin ?? pl.baseMarginPercentage;
        const calculated = calculateFinalPrice(cost, margin, pl.roundingRule);
        const isBelowMinimum = productPriceInfo?.isBelowMinimum ?? false;
        return {
          priceListId: pl.id,
          priceListName: pl.name,
          baseMargin: pl.baseMarginPercentage,
          calculatedPrice: calculated,
          fixedPrice: currentFixedPrices.get(pl.id) ?? calculated,
          isFixed: true,
          isBelowMinimum,
        };
      }

      // Calculate with real hierarchy: override margin > base margin
      const margin = productPriceInfo?.overrideMargin ?? pl.baseMarginPercentage;
      const calculated = calculateFinalPrice(cost, margin, pl.roundingRule);
      const isBelowMinimum = productPriceInfo?.isBelowMinimum ?? false;

      return {
        priceListId: pl.id,
        priceListName: pl.name,
        baseMargin: pl.baseMarginPercentage,
        calculatedPrice: calculated,
        fixedPrice: null,
        isFixed: false,
        isBelowMinimum,
      };
    });

    setPriceListPrices(prices);
  };

  const handleFixPrice = (priceListId: string, fixedPrice: number) => {
    setPriceListPrices((prev) =>
      prev.map((p) =>
        p.priceListId === priceListId
          ? { ...p, fixedPrice, isFixed: true }
          : p
      )
    );
  };

  const handleUnfixPrice = (priceListId: string) => {
    setPriceListPrices((prev) =>
      prev.map((p) => {
        if (p.priceListId !== priceListId) return p;
        const productPriceInfo = selectedProduct?.allPrices?.[priceListId];
        const pl = priceLists.find((l) => l.id === priceListId);
        const margin = productPriceInfo?.overrideMargin ?? p.baseMargin;
        const calculated = pl ? calculateFinalPrice(unitCost, margin, pl.roundingRule) : p.calculatedPrice;
        return {
          ...p,
          calculatedPrice: calculated,
          fixedPrice: null,
          isFixed: false,
        };
      })
    );
  };

  const handleAddItem = async () => {
    if (!selectedProduct || quantity <= 0 || unitCost <= 0) {
      await alert({
        title: "Datos incompletos",
        description: "Seleccione un producto y complete cantidad y costo unitario.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Build priceListData payload
      const priceListData: Record<string, { price: number; isFixed: boolean }> = {};
      priceListPrices.forEach((pl) => {
        priceListData[pl.priceListId] = {
          price: pl.isFixed ? (pl.fixedPrice ?? pl.calculatedPrice) : pl.calculatedPrice,
          isFixed: pl.isFixed,
        };
      });

      const isUpdate = !!editingItemId;

      const res = await fetch(
        isUpdate ? `/api/purchase-vouchers/${voucherId}/items/${editingItemId}` : `/api/purchase-vouchers/${voucherId}/items`,
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: selectedProduct.id,
            quantity,
            unitCost,
            priceListData,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (isUpdate ? "No se pudo actualizar el ítem" : "No se pudo agregar el ítem"));
      }

      const subtotal = quantity * unitCost;

      if (isUpdate) {
        // Update existing item in local list
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItemId
              ? {
                  ...it,
                  quantity,
                  unitCost,
                  subtotal,
                  priceListPrices: [...priceListPrices],
                }
              : it
          )
        );
      } else {
        // Add new item to local list
        const newItem = await res.json();
        setItems([
          ...items,
          {
            id: newItem.id,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity,
            unitCost,
            subtotal,
            priceListPrices: [...priceListPrices],
          },
        ]);
      }

      // Reset form for next item
      setSelectedProduct(null);
      setQuantity(1);
      setUnitCost(0);
      setPriceListPrices([]);
      setEditingItemId(null);

      onItemAdded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al agregar ítem.";
      await alert({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (items.length === 0) {
      await alert({
        title: "Sin items",
        description: "Debe agregar al menos un ítem antes de finalizar.",
        variant: "error",
      });
      return;
    }

    // Variance check (+/- 5% tolerance)
    const totalItemsValue = items.reduce((acc, item) => acc + item.subtotal, 0);
    const variance = Math.abs(totalItemsValue - voucherTotal);
    const tolerance = voucherTotal > 0 ? voucherTotal * 0.05 : 0.01;
    if (variance > tolerance) {
      const proceed = await confirm({
        title: "Diferencia en totales",
        description: `El total de ítems cargados ($${totalItemsValue.toFixed(2)}) difiere del monto declarado ($${voucherTotal.toFixed(2)}). ¿Desea finalizar de todos modos?`,
        confirmText: "Finalizar igual",
        cancelText: "Revisar",
        variant: "warning",
      });
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucherId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: paymentMethodId || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al finalizar");
      }

      onFinish?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al finalizar.";
      await alert({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: "Eliminar ítem",
      description: "¿Está seguro de eliminar este ítem del comprobante?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucherId}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "No se pudo eliminar el ítem");
      }

      setItems((prev) => prev.filter((it) => it.id !== itemId));

      // Clear form if the removed item was selected
      if (selectedProduct && items.find((it) => it.id === itemId)?.productId === selectedProduct.id) {
        setSelectedProduct(null);
        setQuantity(1);
        setUnitCost(0);
        setPriceListPrices([]);
      }
      
      // Always clear editingItemId if the removed item was being edited
      if (editingItemId === itemId) {
        setEditingItemId(null);
      }

      onItemAdded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar ítem.";
      await alert({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este comprobante? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucherId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onClose();
        if (onItemAdded) onItemAdded();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al eliminar el comprobante',
          variant: 'error',
        });
      }
    } catch {
      await alert({
        title: 'Error',
        description: 'Error al eliminar el comprobante',
        variant: 'error',
      });
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.subtotal, 0);
  const variance = voucherTotal - totalItems;
  const hasLowMargin = priceListPrices.some((p) => p.isBelowMinimum);

  const modalSubtitle = supplierName && letter && number 
    ? `${supplierName} | ${letter}-${number} | Productos: ${items.length} | Total: $${totalItems.toFixed(2)}${voucherTotal > 0 ? (Math.abs(variance) > 0.01 ? ` (Dif: $${variance.toFixed(2)})` : ' (Cuadrado)') : ''}`
    : undefined;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Cargar Productos"
      description={modalSubtitle}
      maxWidth="5xl"
      footer={
        <div className="flex justify-between gap-2 w-full">
          <Button
            variant="outline"
            onClick={onBackToHeader}
            disabled={loading}
          >
            Volver a datos
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDeleteVoucher} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar comprobante
            </Button>
            <Button
              onClick={handleFinish}
              disabled={loading || items.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      }
    >
      <div className="h-[500px] grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel — Form */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6">
          {/* Product Search via ProductServiceSelector */}
          {!selectedProduct ? (
            <div className="space-y-2">
              <Label>Buscar Producto</Label>
              <ProductServiceSelector
                key={selectorKey}
                showPriceListSelector={false}
                showCategoryFilter={false}
                showSelectedTable={false}
                showPrice={false}
                showQuickCreate
                onQuickCreate={() => setIsQuickProductOpen(true)}
                onSelectionChange={(selItems: SelectedItem[]) => {
                  if (selItems.length > 0) {
                    const lastItem = selItems[selItems.length - 1];
                    setSelectedProduct({
                      id: lastItem.id,
                      name: lastItem.name,
                      sku: lastItem.sku,
                      allPrices: lastItem.allPrices,
                      replacementCost: lastItem.replacementCost,
                      costPrice: lastItem.costPrice,
                    });
                    // Set default quantity to 1 and unitCost to replacementCost (or costPrice)
                    setQuantity(1);
                    const baseCost = lastItem.replacementCost && lastItem.replacementCost > 0
                      ? lastItem.replacementCost
                      : (lastItem.costPrice || 0);
                    setUnitCost(baseCost);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{selectedProduct.name}</div>
                {selectedProduct.sku && (
                  <div className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProduct(null);
                  setPriceListPrices([]);
                  setSelectorKey((k) => k + 1);
                  setEditingItemId(null);
                }}
              >
                Cambiar
              </Button>
            </div>
          )}

          {selectedProduct && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className={quantity <= 0 ? "border-red-300 focus-visible:ring-red-200" : ""}
                />
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="unitCost">Precio ($) *</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="1"
                  min={0}
                  required
                  value={unitCost || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setUnitCost(value);
                    recalculatePrices(value, selectedProduct.allPrices);
                  }}
                  className={unitCost <= 0 ? "border-red-300 focus-visible:ring-red-200" : ""}
                />
              </div>
            </div>
          )}

          {/* Low Margin Alert */}
          {hasLowMargin && (
            <div className="flex items-center gap-2 p-3 border border-red-300 bg-red-50 rounded-md text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Algunas listas quedan por debajo del margen mínimo con este costo.</span>
            </div>
          )}

          {/* Price Lists */}
          {unitCost > 0 && priceListPrices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Precios de venta
                </h4>
                {hasLowMargin && <TrendingDown className="h-4 w-4 text-red-500" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Puede definir los precios de venta en este paso o luego desde la sección productos
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Lista</th>
                      <th className="text-left p-2 font-medium">Margen</th>
                      <th className="text-left p-2 font-medium">Tipo</th>
                      <th className="text-right p-2 font-medium w-32">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {priceListPrices.map((pl) => {
                      const isFixedBelowMinimum = pl.isFixed && pl.fixedPrice && unitCost > 0 && ((pl.fixedPrice - unitCost) / unitCost) * 100 < minimumMargin;
                      return (
                      <tr
                        key={pl.priceListId}
                        className={`${pl.isBelowMinimum || isFixedBelowMinimum ? "bg-red-50/50" : ""}`}
                      >
                        <td className="p-2">{pl.priceListName}</td>
                        <td className={`p-2 ${
                          pl.isFixed 
                            ? ((pl.fixedPrice && unitCost > 0 ? ((pl.fixedPrice - unitCost) / unitCost) * 100 : 0) < minimumMargin ? "text-red-600 font-medium" : "text-muted-foreground")
                            : (pl.isBelowMinimum ? "text-red-600 font-medium" : "text-muted-foreground")
                        }`}>
                          {pl.isFixed 
                            ? (pl.fixedPrice && unitCost > 0 
                                ? `${(((pl.fixedPrice - unitCost) / unitCost) * 100).toFixed(1)}%` 
                                : "-")
                            : (pl.isBelowMinimum ? "Bajo mínimo" : `${pl.baseMargin}%`)}
                        </td>
                        <td className="p-2">
                          <Badge 
                            variant={pl.isFixed ? "default" : "secondary"} 
                            className="text-xs cursor-pointer hover:opacity-80"
                            onClick={() => pl.isFixed && handleUnfixPrice(pl.priceListId)}
                          >
                            {pl.isFixed ? "fijo" : "auto"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2 justify-end">$ 
                            <Input
                              type="number"
                              step="1000"
                              value={pl.isFixed ? pl.fixedPrice ?? "" : pl.calculatedPrice}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  handleFixPrice(pl.priceListId, value);
                                }
                              }}
                              className={`h-7 w-24 text-xs text-right ${pl.isBelowMinimum && !pl.isFixed ? "border-red-300" : ""}`}
                            />
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
          {selectedProduct && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              {editingItemId && (
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveItem(editingItemId)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
              <Button
                onClick={handleAddItem}
                disabled={loading || quantity <= 0 || unitCost <= 0}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingItemId ? "Actualizar" : "Agregar"}
              </Button>
            </div>
          )}
        </div>

        {/* Right panel — Loaded items sidebar */}
        <div className="border rounded-md bg-muted/20 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/50 flex-shrink-0">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Productos cargados
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{supplierName ? `Agregue productos al comprobante de ${supplierName}` : "Agregue productos al comprobante"}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Producto</th>
                    <th className="text-right p-2 font-medium w-20">Cantidad</th>
                    <th className="text-right p-2 font-medium w-20 text-muted-foreground">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                        selectedProduct?.id === item.productId ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        setSelectedProduct({
                          id: item.productId,
                          name: item.productName,
                          sku: undefined,
                          allPrices: undefined,
                        });
                        setQuantity(item.quantity);
                        setUnitCost(item.unitCost);
                        setPriceListPrices(item.priceListPrices.map((p) => ({ ...p })));
                        setEditingItemId(item.id);
                      }}
                    >
                      <td className="p-2">
                        <span
                          className="truncate block"
                          title={item.productName}
                          style={{ maxWidth: "35ch" }}
                        >
                          {item.productName}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {item.quantity}
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {getProjectedStock(item.productId, item.currentStock)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <QuickProductDialog
        key={quickProductKey}
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        onProductCreated={(product) => {
          setIsQuickProductOpen(false);
          setQuickProductKey((k) => k + 1);
          // Pre-select the newly created product
          setSelectedProduct({
            id: product.id,
            name: product.name,
            sku: product.sku,
            allPrices: undefined,
          });
        }}
      />
    </ModalBase>
  );
}
