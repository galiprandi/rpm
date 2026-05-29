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
import { Plus, CheckCircle, Package, AlertTriangle, TrendingDown } from "lucide-react";
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
}: AddVoucherItemDialogProps) {
  const { alert, confirm } = useUI();
  const [loading, setLoading] = useState(false);
  const [selectorKey, setSelectorKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    sku?: string;
    allPrices?: Record<string, { finalPrice: number; isBelowMinimum: boolean; isFixed: boolean; overrideMargin: number | null; roundingRule: string }>;
  } | null>(null);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [items, setItems] = useState<VoucherItem[]>([]);

  // New item form
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [priceListPrices, setPriceListPrices] = useState<PriceListPrice[]>([]);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductKey, setQuickProductKey] = useState(0);

  const loadExistingItems = async () => {
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucherId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.voucher?.items) {
          const loaded = data.voucher.items.map((it: Record<string, unknown>) => ({
            id: it.id as string,
            productId: it.productId as string,
            productName: it.productName as string,
            quantity: it.quantity as number,
            unitCost: Number(it.unitCost),
            subtotal: Number(it.subtotal),
            priceListPrices: it.priceListData ? Object.entries(it.priceListData as Record<string, unknown>).map(([k, v]: [string, unknown]) => ({
              priceListId: k,
              priceListName: priceLists.find(p => p.id === k)?.name || k,
              baseMargin: priceLists.find(p => p.id === k)?.baseMarginPercentage || 0,
              calculatedPrice: (v as { price?: number }).price || 0,
              fixedPrice: (v as { isFixed?: boolean; price?: number }).isFixed ? (v as { price?: number }).price : null,
              isFixed: (v as { isFixed?: boolean }).isFixed || false,
              isBelowMinimum: false,
            })) : [],
          }));
          setItems(loaded);
        }
      }
    } catch (err) {
      console.error("Error loading existing items:", err);
    }
  };

  // Load price lists and existing items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadAll = async () => {
      try {
        const [plRes] = await Promise.allSettled([
          fetch("/api/price-lists"),
        ]);
        if (plRes.status === "fulfilled" && plRes.value.ok) {
          const plData = await plRes.value.json();
          setPriceLists(plData.priceLists || []);
        }
      } catch (err) {
        console.error("Error fetching price lists:", err);
      }

      // Load existing items after price lists so mapping works
      await loadExistingItems();
    };

    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

    // Check for duplicate product
    const existingItem = items.find((it) => it.productId === selectedProduct.id);
    if (existingItem) {
      const choice = await confirm({
        title: "Producto duplicado",
        description: `${selectedProduct.name} ya fue cargado con cantidad ${existingItem.quantity}. ¿Desea sumar la nueva cantidad (${quantity}) o cancelar?`,
        confirmText: "Sumar Cantidad",
        cancelText: "Cancelar",
      });
      if (!choice) return;

      // Update existing item quantity via API
      setLoading(true);
      try {
        const res = await fetch(`/api/purchase-vouchers/${voucherId}/items/${existingItem.productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: existingItem.quantity + quantity,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "No se pudo actualizar la cantidad");
        }

        // Update local items list
        setItems((prev) =>
          prev.map((it) =>
            it.productId === selectedProduct.id
              ? {
                  ...it,
                  quantity: it.quantity + quantity,
                  subtotal: (it.quantity + quantity) * it.unitCost,
                }
              : it
          )
        );

        // Reset form for next item
        setSelectedProduct(null);
        setQuantity(1);
        setUnitCost(0);
        setPriceListPrices([]);
        onItemAdded?.();
        setLoading(false);
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al actualizar cantidad.";
        await alert({
          title: "Error",
          description: message,
          variant: "error",
        });
        setLoading(false);
        return;
      }
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

      const res = await fetch(`/api/purchase-vouchers/${voucherId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          unitCost,
          priceListData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "No se pudo agregar el ítem");
      }

      // Add to local items list
      const subtotal = quantity * unitCost;
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

      // Reset form for next item
      setSelectedProduct(null);
      setQuantity(1);
      setUnitCost(0);
      setPriceListPrices([]);

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

      await alert({
        title: "Comprobante Finalizado",
        description: "El comprobante se ha finalizado correctamente.",
        variant: "success",
      });

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

  const totalItems = items.reduce((acc, item) => acc + item.subtotal, 0);
  const variance = voucherTotal - totalItems;
  const hasLowMargin = priceListPrices.some((p) => p.isBelowMinimum);

  const modalSubtitle = supplierName && letter && number ? `${supplierName} | ${letter}-${number}` : undefined;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Cargar Productos"
      description={modalSubtitle}
      maxWidth="5xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-muted-foreground">
            Items: <span className="font-semibold">{items.length}</span> | Total: {" "}
            <span className="font-semibold">${totalItems.toFixed(2)}</span>
            {voucherTotal > 0 && (
              <span className={`ml-2 ${Math.abs(variance) > 0.01 ? "text-orange-500 font-medium" : "text-green-600"}`}>
                {Math.abs(variance) > 0.01
                  ? `(Dif: $${variance.toFixed(2)})`
                  : "(Cuadrado)"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleFinish}
              disabled={loading || items.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
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
                    });
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
                    {priceListPrices.map((pl) => (
                      <tr
                        key={pl.priceListId}
                        className={`${pl.isBelowMinimum ? "bg-red-50/50" : ""}`}
                      >
                        <td className="p-2">{pl.priceListName}</td>
                        <td className={`p-2 ${pl.isBelowMinimum ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {pl.isBelowMinimum ? "Bajo mínimo" : `${pl.baseMargin}%`}
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
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              step="0.01"
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
          {selectedProduct && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleAddItem}
                disabled={loading || quantity <= 0 || unitCost <= 0}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar producto
              </Button>
            </div>
          )}
        </div>

        {/* Right panel — Loaded items sidebar */}
        <div className="border rounded-md bg-muted/20 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/50 flex-shrink-0">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Ítems cargados ({items.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{supplierName ? `Agregue productos al comprobante de ${supplierName}` : "Agregue productos al comprobante"}</p>
              </div>
            ) : (
              <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between gap-2 p-3 hover:bg-muted/40 transition-colors ${
                    selectedProduct?.id === item.productId ? "bg-primary/5" : ""
                  }`}
                >
                  <button
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
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
                    }}
                  >
                    <span
                      className="text-sm truncate"
                      title={item.productName}
                      style={{ maxWidth: "35ch" }}
                    >
                      {item.productName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      x{item.quantity}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loading}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 px-1"
                    title="Eliminar ítem"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground text-right">
              Total: ${totalItems.toFixed(2)}
            </div>
          )}
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
