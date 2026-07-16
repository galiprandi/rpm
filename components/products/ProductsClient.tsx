"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductDialog } from "@/components/products/ProductDialog";
import { ProductMovementsModal } from "@/components/products/ProductMovementsModal";
import { ProductPricesModal } from "@/components/products/ProductPricesModal";
import { QuickSaleModal } from "@/components/dashboard/QuickSaleModal";
import { useUI } from "@/components/ui/UIProvider";
import { toast } from "sonner";
import { Header, CrudAdmin, StatItem, CrudStats } from "@/components/adm";
import {
  Pencil,
  Trash2,
  AlertTriangle,
  DollarSign,
  Boxes,
  Clock,
  ShoppingCart,
  FileUp,
  Plus,
  RefreshCcw,
  Package,
  Tags,
  Power,
  ArrowLeft,
  EyeOff,
} from "lucide-react";
import { PriceDisplay } from "@/components/ui/price-display";
import { StockDisplay } from "@/components/ui/stock-display";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ColumnDef, type FilterFn } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import {
  type Product,
  type Category,
  type Supplier,
  type ProductFormData,
} from "@/components/products/types";

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  inactiveMode?: boolean;
}

const productSearchFilter: FilterFn<Product> = (
  row,
  _columnId,
  filterValue,
) => {
  if (!filterValue) return true;
  const terms = String(filterValue).toLowerCase().split(/\s+/).filter(Boolean);
  const p = row.original;
  return terms.every((term) => {
    if (p.name?.toLowerCase().includes(term)) return true;
    if (p.sku?.toLowerCase().includes(term)) return true;
    if (p.barcode?.toLowerCase().includes(term)) return true;
    if (p.category?.name?.toLowerCase().includes(term)) return true;
    return false;
  });
};

export function ProductsClient({
  products: initialProducts,
  categories,
  suppliers,
  inactiveMode = false,
}: ProductsClientProps) {
  const { alert } = useUI();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.categoryId === selectedCategory);
  const lowStockCount = filteredProducts.filter((p) => p.isLowStock).length;
  const totalInventoryValue = filteredProducts.reduce(
    (acc, p) => acc + p.costPrice * (p.stock || 0),
    0,
  );

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    costPrice: "",
    replacementCost: "",
    stock: "",
    minStock: "",
    categoryId: "",
    supplierId: "",
    barcode: "",
    location: "",
  });

  // Movements modal state
  const [movementsModalOpen, setMovementsModalOpen] = useState(false);
  const [selectedProductForMovements, setSelectedProductForMovements] =
    useState<Product | null>(null);
  const [movements, setMovements] = useState<
    Array<{
      id: string;
      type: string;
      quantity: number;
      previousStock: number;
      newStock: number;
      reason: string;
      reasonDetails: string | null;
      userName: string | null;
      createdAt: string;
    }>
  >([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Prices modal state
  const [pricesModalOpen, setPricesModalOpen] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] =
    useState<Product | null>(null);

  // Quick sale modal state
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);

  // Check cash status on mount
  useEffect(() => {
    const checkCashStatus = async () => {
      try {
        const res = await fetch("/api/cash/status");
        if (res.ok) {
          const data = await res.json();
          setIsCashOpen(data.status === "OPEN");
        }
      } catch (error) {
        console.error("Error checking cash status:", error);
      }
    };
    checkCashStatus();
  }, []);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteImage = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/image`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar imagen");
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, imageUrl: null, imageCommit: null, imageBranch: null }
            : p,
        ),
      );
    } catch (error) {
      console.error("Error deleting image:", error);
      await alert({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar imagen",
        variant: "error",
      });
    }
  };

  const handleQuickSaleSuccess = () => {
    router.refresh();
  };

  const openMovementsModal = async (product: Product) => {
    setSelectedProductForMovements(product);
    setMovementsModalOpen(true);
    setMovementsLoading(true);
    setMovements([]);
    try {
      const response = await fetch(`/api/products/${product.id}/movements`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMovements(data.movements || []);
    } catch (error) {
      console.error("Error fetching movements:", error);
      setMovements([]);
      await alert({
        title: "Error",
        description: "No se pudieron cargar los movimientos del producto",
        variant: "error",
      });
    } finally {
      setMovementsLoading(false);
    }
  };

  const openPricesModal = (product: Product) => {
    setSelectedProductForPrices(product);
    setPricesModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      costPrice: "",
      replacementCost: "",
      stock: "",
      minStock: "",
      categoryId: "",
      supplierId: "",
      barcode: "",
      location: "",
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const goToImporter = () => {
    router.push("/adm/products/import");
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      costPrice: product.costPrice.toString(),
      replacementCost: product.replacementCost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      categoryId: product.categoryId,
      supplierId: product.supplierId || "",
      barcode: product.barcode || "",
      location: product.location || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Prevent double-click
    if (isSubmitting) return;
    setIsSubmitting(true);

    const missingFields: string[] = [];
    if (!formData.name.trim()) missingFields.push("Nombre");
    if (!formData.categoryId) missingFields.push("Categoría");
    if (!formData.supplierId) missingFields.push("Proveedor");
    if (!formData.costPrice.trim()) missingFields.push("Costo");
    if (!formData.replacementCost.trim())
      missingFields.push("Costo de Reposición");
    if (!formData.stock.trim()) missingFields.push("Stock");
    if (!formData.minStock.trim()) missingFields.push("Mínimo");

    if (missingFields.length > 0) {
      await alert({
        title: "Error",
        description: `Campos obligatorios faltantes: ${missingFields.join(", ")}`,
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      replacementCost: parseFloat(formData.replacementCost) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al guardar producto",
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      const productId = result.product?.id || editingProduct?.id;

      // Upload image if provided
      if (formData.imageFile && productId) {
        setIsUploadingImage(true);
        const formDataImage = new FormData();
        formDataImage.append("file", formData.imageFile);

        const imageResponse = await fetch(`/api/products/${productId}/image`, {
          method: "POST",
          body: formDataImage,
        });

        setIsUploadingImage(false);

        if (!imageResponse.ok) {
          const imageError = await imageResponse.json();
          console.error("Error uploading image:", imageError);
          await alert({
            title: "Advertencia",
            description: `Producto guardado pero la imagen no se pudo subir: ${imageError.error || "Error desconocido"}`,
            variant: "warning",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();

      const updatedProduct = result.product as Product;
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...p, ...updatedProduct } : p,
          ),
        );
      } else if (updatedProduct) {
        setProducts((prev) => [updatedProduct, ...prev]);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      await alert({
        title: "Error",
        description: "Error al guardar producto",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.categoryId !== "" &&
      formData.supplierId !== "" &&
      formData.costPrice.trim() !== "" &&
      formData.replacementCost.trim() !== "" &&
      formData.stock.trim() !== "" &&
      formData.minStock.trim() !== ""
    );
  };

  const formValid = isFormValid();

  const handleDelete = useCallback(
    async (product: Product) => {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === product.id ? { ...p, isActive: false } : p,
            ),
          );
          toast.success(`Producto "${product.name}" desactivado`, {
            action: {
              label: "Deshacer",
              onClick: async () => {
                try {
                  await fetch(`/api/products/${product.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: true }),
                  });
                  setProducts((prev) =>
                    prev.map((p) =>
                      p.id === product.id ? { ...p, isActive: true } : p,
                    ),
                  );
                  toast.success("Producto reactivado");
                } catch {
                  toast.error("Error al reactivar producto");
                }
              },
            },
          });
        } else {
          const error = await response.json();
          await alert({
            title: "Error",
            description: error.error || "Error al desactivar producto",
            variant: "error",
          });
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        await alert({
          title: "Error",
          description: "Error al desactivar producto",
          variant: "error",
        });
      }
    },
    [alert],
  );

  const handleReactivate = useCallback(
    async (product: Product) => {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });

        if (response.ok) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === product.id ? { ...p, isActive: true } : p,
            ),
          );
          toast.success(`Producto "${product.name}" reactivado`);
        } else {
          const error = await response.json();
          await alert({
            title: "Error",
            description: error.error || "Error al reactivar producto",
            variant: "error",
          });
        }
      } catch (error) {
        console.error("Error reactivating product:", error);
        await alert({
          title: "Error",
          description: "Error al reactivar producto",
          variant: "error",
        });
      }
    },
    [alert],
  );

  const stats: StatItem[] = inactiveMode
    ? [
        {
          label: "Inactivos",
          value: filteredProducts.length,
          icon: EyeOff,
        },
        {
          label: "Valor inventario",
          value: <PriceDisplay value={totalInventoryValue} />,
          icon: DollarSign,
        },
      ]
    : [
        {
          label: "Total",
          value: filteredProducts.length,
          icon: Boxes,
        },
        {
          label: "Stock bajo",
          value: lowStockCount,
          icon: AlertTriangle,
          iconColor: lowStockCount > 0 ? "#c2410c" : undefined, // orange-700
        },
        {
          label: "Valor inventario",
          value: <PriceDisplay value={totalInventoryValue} />,
          icon: DollarSign,
        },
      ];

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Producto",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {row.original.imageUrl ? (
              <Image
                src={`/api/products/${row.original.id}/image`}
                alt={row.original.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex flex-col min-w-0 max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[500px]">
            <span className="font-semibold tracking-tight truncate">
              {row.original.name}
            </span>
            {row.original.sku && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {row.original.sku}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Categoría",
      size: 120,
      cell: ({ row }) =>
        row.original.category ? (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: row.original.category.color || undefined,
            }}
          >
            {row.original.category.name}
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      size: 30,
      cell: ({ row }) => (
        <div className="text-center">
          <StockDisplay
            stock={row.original.stock}
            minStock={row.original.minStock}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <Header
          title={inactiveMode ? "Productos Inactivos" : "Productos"}
          shortTitle={inactiveMode ? "Inactivos" : "Prod"}
          iconOnlyOnMobile
          description={
            inactiveMode
              ? "Productos desactivados del catálogo"
              : "Gestiona el inventario de productos y servicios"
          }
          primaryAction={
            inactiveMode
              ? undefined
              : {
                  label: "Nuevo Producto",
                  onClick: openCreateDialog,
                  icon: Plus,
                  ariaLabel: "Crear nuevo producto",
                }
          }
          secondaryActions={
            inactiveMode
              ? [
                  {
                    label: "Volver a productos",
                    href: "/adm/products",
                    variant: "outline" as const,
                    icon: ArrowLeft,
                    ariaLabel: "Volver al listado de productos",
                  },
                ]
              : [
                  {
                    label: "Inventario",
                    href: "/adm/inventory-counts",
                    variant: "outline" as const,
                    icon: RefreshCcw,
                    ariaLabel: "Ir a operativos de conteo de inventario",
                  },
                  {
                    label: "Importar",
                    onClick: goToImporter,
                    variant: "outline" as const,
                    icon: FileUp,
                    ariaLabel: "Importar productos desde archivo Excel o CSV",
                  },
                  {
                    label: "Ver inactivos",
                    href: "/adm/products/inactive",
                    variant: "ghost" as const,
                    icon: EyeOff,
                    iconOnly: true,
                    title: "Ver productos inactivos",
                    ariaLabel: "Ver productos inactivos",
                  },
                  {
                    label: "Venta Rápida",
                    onClick: () => setQuickSaleModalOpen(true),
                    variant: "default" as const,
                    icon: ShoppingCart,
                    disabled: isCashOpen === false,
                    title:
                      isCashOpen === false
                        ? "Debe abrir la caja para realizar ventas"
                        : undefined,
                    ariaLabel: "Realizar una venta rápida por mostrador",
                  },
                ]
          }
        />

        <div className="mt-4">
          <CrudStats stats={stats} />
        </div>

        <CrudAdmin
          items={filteredProducts}
          loading={false}
          onCreate={openCreateDialog}
          hideCreateAction
          columns={columns}
          filterFn={productSearchFilter}
          headerFilter={
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px] h-9">
                <Tags className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyIcon={
            <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          }
          emptyMessage={
            inactiveMode
              ? "No hay productos inactivos."
              : "No hay productos creados. Haz clic en 'Nuevo Producto' para crear el primero."
          }
          createButtonText="Producto"
          tableTitle={
            inactiveMode ? "Productos Inactivos" : "Listado de Productos"
          }
          searchPlaceholder="Buscar por SKU, nombre, EAN..."
          rowActions={(product: Product) => (
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPricesModal(product)}
                    aria-label="Ver precios"
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver precios</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMovementsModal(product)}
                    aria-label="Ver historial"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver historial</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                    aria-label="Editar producto"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar producto</TooltipContent>
              </Tooltip>

              {product.isActive ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-700 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDelete(product)}
                      aria-label={`Desactivar producto ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desactivar producto</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                      onClick={() => handleReactivate(product)}
                      aria-label={`Reactivar producto ${product.name}`}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reactivar producto</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        />
      </div>

      {!inactiveMode && (
        <ProductDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          editingProduct={editingProduct}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          categories={categories}
          suppliers={suppliers}
          isValid={formValid}
          isUploadingImage={isUploadingImage}
          isSubmitting={isSubmitting}
          onDeleteImage={handleDeleteImage}
        />
      )}

      <ProductPricesModal
        isOpen={pricesModalOpen}
        onClose={() => setPricesModalOpen(false)}
        product={selectedProductForPrices}
      />

      <ProductMovementsModal
        isOpen={movementsModalOpen}
        onClose={() => setMovementsModalOpen(false)}
        product={selectedProductForMovements}
        movements={movements}
        loading={movementsLoading}
      />

      {!inactiveMode && (
        <QuickSaleModal
          open={quickSaleModalOpen}
          onOpenChange={setQuickSaleModalOpen}
          onSuccess={handleQuickSaleSuccess}
        />
      )}
    </>
  );
}
