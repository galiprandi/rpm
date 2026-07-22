"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { type Product } from "@/components/products/types";

interface ExportColumn {
  id: string;
  label: string;
  getValue: (product: Product) => string;
}

const AVAILABLE_COLUMNS: ExportColumn[] = [
  { id: "sku", label: "SKU (Código)", getValue: (p) => p.sku || "" },
  { id: "name", label: "Nombre", getValue: (p) => p.name || "" },
  { id: "description", label: "Descripción", getValue: (p) => p.description || "" },
  { id: "barcode", label: "Código de barras (EAN)", getValue: (p) => p.barcode || "" },
  { id: "stock", label: "Stock", getValue: (p) => String(p.stock ?? 0) },
  { id: "minStock", label: "Stock Mínimo", getValue: (p) => String(p.minStock ?? 0) },
  { id: "location", label: "Ubicación", getValue: (p) => p.location || "" },
  { id: "costPrice", label: "Costo ($)", getValue: (p) => String(p.costPrice ?? 0) },
  { id: "replacementCost", label: "Costo de Reposición ($)", getValue: (p) => String(p.replacementCost ?? 0) },
  { id: "categoryName", label: "Categoría (Nombre)", getValue: (p) => p.category?.name || "" },
  { id: "categoryId", label: "Categoría (ID)", getValue: (p) => p.categoryId || "" },
  { id: "supplierName", label: "Proveedor (Nombre)", getValue: (p) => p.supplier?.name || "" },
  { id: "supplierId", label: "Proveedor (ID)", getValue: (p) => p.supplierId || "" },
  { id: "isActive", label: "Activo", getValue: (p) => (p.isActive ? "Sí" : "No") },
];

const DEFAULT_COLUMNS = ["sku", "name", "categoryName", "supplierName", "stock", "costPrice", "location"];

interface ProductExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredProducts: Product[];
  filename?: string;
}

export function ProductExportModal({
  isOpen,
  onClose,
  filteredProducts,
  filename = "productos_filtrados.csv",
}: ProductExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map((col) => col.id));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = () => {
    if (selectedColumns.length === 0) {
      return;
    }

    const columnsToExport = AVAILABLE_COLUMNS.filter((col) =>
      selectedColumns.includes(col.id)
    );

    const headers = columnsToExport.map((col) => col.label);

    const csvRows = [
      headers.join(","),
      ...filteredProducts.map((product) =>
        columnsToExport
          .map((col) => `"${String(col.getValue(product)).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    // Prepend UTF-8 BOM to fix Excel encoding (Spanish accents, ñ, etc.)
    const csvContent = "\ufeff" + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Productos a CSV</DialogTitle>
          <DialogDescription>
            Selecciona las columnas que deseas incluir en el archivo CSV de exportación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto a exportar" : "productos a exportar"}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Seleccionar todos
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                Deseleccionar todos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {AVAILABLE_COLUMNS.map((col) => {
              const isChecked = selectedColumns.includes(col.id);
              return (
                <div
                  key={col.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleColumn(col.id)}
                >
                  <Checkbox
                    id={`col-${col.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleColumn(col.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`col-${col.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {col.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
