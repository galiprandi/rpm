"use client";

import { useState, useEffect } from "react";
import { ProductServiceSelector, type SelectedItem } from "@/components/ui/ProductServiceSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUI } from "@/components/ui/UIProvider";

interface Category {
  id: string;
  name: string;
}

interface PriceList {
  id: string;
  name: string;
  baseMarginPercentage: number;
  order: number;
}

export default function TestProductServiceSelectorPage() {
  const { alert } = useUI();
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Fetch categories and price lists on mount
  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, priceListsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/price-lists"),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (priceListsRes.ok) {
        const data = await priceListsRes.json();
        setPriceLists(data.priceLists || []);
      }
    };

    fetchData();
  }, []);

  const handleSelectionChange = (newItems: SelectedItem[]) => {
    setItems(newItems);
    console.log("Selected items:", newItems);
  };

  const handleQuickCreate = () => {
    setShowQuickCreate(true);
  };

  const handleSubmit = async () => {
    await alert({
      title: "Items seleccionados",
      description: `${items.length} items en el carrito. Total: $${items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString("es-AR")}`,
      variant: "info",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test ProductServiceSelector</h1>

      <Card>
        <CardHeader>
          <CardTitle>Buscar y seleccionar productos y servicios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProductServiceSelector
            showPriceListSelector={true}
            showCategoryFilter={true}
            showQuickCreate={true}
            onSelectionChange={handleSelectionChange}
            onQuickCreate={handleQuickCreate}
            categories={categories}
            priceLists={priceLists}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setItems([])}>
              Limpiar
            </Button>
            <Button onClick={handleSubmit} disabled={items.length === 0}>
              Confirmar ({items.length} items)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(items, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Quick Create Dialog placeholder */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Crear servicio rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Aquí iría el formulario para crear un servicio rápido.
              </p>
              <Button onClick={() => setShowQuickCreate(false)}>Cerrar</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
