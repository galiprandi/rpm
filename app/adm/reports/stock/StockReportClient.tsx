"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  TrendingUp,
  ExternalLink,
  Clock,
  RefreshCw,
  Download,
  Printer,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import { StockReportData } from "@/lib/services/stockReportService";
import Link from "next/link";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StockReportClient() {
  const [data, setData] = useState<StockReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const response = await fetch("/api/reports/stock");
        if (!response.ok) throw new Error("Failed to fetch stock report");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching stock report:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  const exportToCSV = () => {
    if (!data) return;

    const sections: string[] = [];

    // 1. Resumen de Inventario
    sections.push("Resumen de Inventario");
    sections.push("Métrica,Valor,Detalle");
    sections.push(`Valor Total Stock,${data.totalValue.toFixed(2)},A costo de reposición`);
    sections.push(`Rotación de Stock,${data.inventoryTurnover.toFixed(2)}x,Anualizado (base 30 días)`);
    sections.push(`Stock Inmovilizado,${data.deadStockValue.toFixed(2)},"${data.deadStockCount} productos sin movimiento (90d)"`);
    sections.push(`Unidades en Stock,${data.totalProducts},"${data.activeProducts} productos activos"`);
    sections.push(`Alertas de Stock,${data.lowStockCount},Productos bajo stock mínimo`);
    sections.push("");

    // 2. Distribución por Categoría
    sections.push("Distribución por Categoría");
    sections.push("Categoría,Cantidad de Productos,Valorización");
    data.categoryDistribution.forEach((cat) => {
      sections.push(`"${cat.name.replace(/"/g, '""')}",${cat.count},${cat.value.toFixed(2)}`);
    });
    sections.push("");

    // 3. Productos con Mayor Capital Inmovilizado
    sections.push("Productos con Mayor Capital Inmovilizado");
    sections.push("ID,Producto,Stock,Valorización");
    data.topValuedProducts.forEach((prod) => {
      sections.push(`"${prod.id}","${prod.name.replace(/"/g, '""')}",${prod.stock},${prod.value.toFixed(2)}`);
    });
    sections.push("");

    // 4. Alertas de Reposición
    sections.push("Alertas de Reposición");
    sections.push("ID,Producto,Stock Actual,Stock Mínimo,Categoría");
    data.lowStockProducts.forEach((prod) => {
      sections.push(`"${prod.id}","${prod.name.replace(/"/g, '""')}",${prod.stock},${prod.minStock},"${prod.category.replace(/"/g, '""')}"`);
    });
    sections.push("");

    // 5. Productos Inmovilizados (Sin Movimiento 90 días)
    sections.push("Productos Inmovilizados (Sin Movimiento 90 días)");
    sections.push("ID,Producto,Stock,Valor,Último Movimiento");
    data.deadStockProducts.forEach((prod) => {
      const lastMov = prod.lastMovement ? new Date(prod.lastMovement).toLocaleDateString("es-AR") : "Sin movimientos";
      sections.push(`"${prod.id}","${prod.name.replace(/"/g, '""')}",${prod.stock},${prod.value.toFixed(2)},"${lastMov}"`);
    });

    const csvContent = "\ufeff" + sections.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_stock_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          title="Stock & Inventario"
          description="Valorización de stock, rotación y alertas de reposición."
        />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-[400px] animate-pulse" />
          <Card className="h-[400px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Header
        title="Stock & Inventario"
        description="Valorización de stock, rotación y alertas de reposición."
        secondaryActions={[
          {
            label: "Imprimir",
            onClick: () => window.print(),
            disabled: loading || !data,
            icon: Printer,
            variant: "outline",
          },
          {
            label: "Exportar CSV",
            onClick: exportToCSV,
            disabled: loading || !data,
            icon: Download,
            variant: "outline",
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Valor Total Stock"
          value={formatARS(data.totalValue)}
          icon={DollarSign}
          subtitle="A costo de reposición"
        />
        <MetricCard
          title="Rotación de Stock"
          value={`${data.inventoryTurnover.toFixed(2)}x`}
          icon={RefreshCw}
          subtitle="Anualizado (base 30 días)"
        />
        <MetricCard
          title="Stock Inmovilizado"
          value={formatARS(data.deadStockValue)}
          icon={Clock}
          subtitle={`${data.deadStockCount} productos sin movimiento (90d)`}
          className={data.deadStockCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}
        />
        <MetricCard
          title="Unidades en Stock"
          value={data.totalProducts.toLocaleString()}
          icon={Package}
          subtitle={`${data.activeProducts} productos activos`}
        />
        <MetricCard
          title="Alertas de Stock"
          value={data.lowStockCount.toString()}
          icon={AlertTriangle}
          subtitle="Productos bajo stock mínimo"
          className={data.lowStockCount > 0 ? "border-red-200 bg-red-50/30" : ""}
        />
        <MetricCard
          title="Categorías"
          value={data.categoryDistribution.length.toString()}
          icon={Layers}
          subtitle="Con productos activos"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
              Top 5 Inversión por Producto
            </CardTitle>
            <CardDescription>Productos con mayor capital inmovilizado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topValuedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.stock} unidades en stock
                    </p>
                  </div>
                  <div className="text-sm font-mono font-bold">
                    {formatARS(product.value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
              Distribución por Categoría
            </CardTitle>
            <CardDescription>Valorización agrupada por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryDistribution.slice(0, 5).map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-mono font-semibold">
                      {formatARS(cat.value)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(cat.value / data.totalValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                Alertas de Reposición
              </CardTitle>
              <CardDescription>
                Productos con stock igual o inferior al mínimo
              </CardDescription>
            </div>
            <Badge variant={data.lowStockCount > 0 ? "destructive" : "outline"}>
              {data.lowStockCount} alertas
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground italic"
                      >
                        Sin alertas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.lowStockProducts.slice(0, 5).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium truncate max-w-[150px]">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-bold text-red-700">
                            {product.stock}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1">
                            / {product.minStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Ver producto ${product.name}`}
                              >
                                <Link
                                  href={`/adm/products?search=${product.name}`}
                                >
                                  <ExternalLink className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver producto</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">
                Productos Inmovilizados
              </CardTitle>
              <CardDescription>
                Sin movimientos en los últimos 90 días
              </CardDescription>
            </div>
            <Badge
              variant={data.deadStockCount > 0 ? "secondary" : "outline"}
              className={
                data.deadStockCount > 0
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : ""
              }
            >
              {data.deadStockCount} inactivos
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.deadStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="p-8 text-center text-muted-foreground italic"
                      >
                        Sin productos inmovilizados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.deadStockProducts.slice(0, 5).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium truncate max-w-[150px]">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatARS(product.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Ver producto ${product.name}`}
                              >
                                <Link
                                  href={`/adm/products?search=${product.name}`}
                                >
                                  <ExternalLink className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver producto</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Impresión (Solo visible al imprimir) */}
      {data && (
        <div className="hidden print:block font-sans p-6 text-black bg-white" id="print-section">
          {/* Header de la Empresa */}
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">RPM ACCESORIOS</h1>
              <p className="text-xs text-zinc-500 uppercase font-medium mt-0.5">Taller de Equipamiento y Estética Vehicular</p>
              <p className="text-[11px] text-zinc-400 font-mono mt-1">Sarmiento 1234, Rosario, Santa Fe | Tel: 341-5556789</p>
            </div>
            <div className="text-right">
              <div className="border border-zinc-900 text-zinc-900 font-bold text-xs py-1 px-3 uppercase tracking-wider inline-block rounded">
                Reporte de Stock y Valorización
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-2">
                Fecha de Emisión: {new Date().toLocaleDateString("es-AR")}
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">
                Auditoría de Inventarios y Alertas
              </p>
            </div>
          </div>

          {/* Resumen de KPIs */}
          <div className="grid grid-cols-3 gap-4 border border-zinc-300 rounded-lg p-4 mb-6 bg-zinc-50/50">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Valor Total Stock</span>
              <p className="text-sm font-bold font-mono text-emerald-700">{formatARS(data.totalValue)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rotación de Stock</span>
              <p className="text-sm font-bold font-mono text-zinc-900">{data.inventoryTurnover.toFixed(2)}x</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Stock Inmovilizado</span>
              <p className="text-sm font-bold font-mono text-amber-700">{formatARS(data.deadStockValue)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Unidades en Stock</span>
              <p className="text-sm font-bold font-mono text-zinc-900">{data.totalProducts}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Alertas de Reposición</span>
              <p className="text-sm font-bold font-mono text-red-700">{data.lowStockCount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Categorías Activas</span>
              <p className="text-sm font-bold font-mono text-zinc-900">{data.categoryDistribution.length}</p>
            </div>
          </div>

          {/* Dos columnas de Distribución y Top Capital */}
          <div className="grid grid-cols-2 gap-6 mb-6 print:break-inside-avoid">
            {/* Distribución por Categoría */}
            <div>
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Distribución por Categoría</h2>
              <div className="border border-zinc-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-[11px] font-bold text-zinc-700 uppercase">
                      <th className="p-2">Categoría</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Valorización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryDistribution.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-xs text-zinc-500 italic">Sin categorías</td>
                      </tr>
                    ) : (
                      data.categoryDistribution.map((cat) => (
                        <tr key={cat.id} className="border-b border-zinc-200 text-[11px]">
                          <td className="p-2 font-medium">{cat.name}</td>
                          <td className="p-2 text-right font-mono">{cat.count}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatARS(cat.value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Inversión por Producto */}
            <div>
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Top 5 Mayor Inversión</h2>
              <div className="border border-zinc-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300 text-[11px] font-bold text-zinc-700 uppercase">
                      <th className="p-2">Producto</th>
                      <th className="p-2 text-right">Stock</th>
                      <th className="p-2 text-right">Valorización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topValuedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-xs text-zinc-500 italic">Sin productos</td>
                      </tr>
                    ) : (
                      data.topValuedProducts.slice(0, 5).map((prod) => (
                        <tr key={prod.id} className="border-b border-zinc-200 text-[11px]">
                          <td className="p-2 font-medium truncate max-w-[150px]">{prod.name}</td>
                          <td className="p-2 text-right font-mono">{prod.stock}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatARS(prod.value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alertas de Reposición */}
          <div className="mb-6 print:break-inside-avoid">
            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Alertas de Reposición (Stock Mínimo)</h2>
            <div className="border border-zinc-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 text-[11px] font-bold text-zinc-700 uppercase">
                    <th className="p-2">ID</th>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Stock Actual</th>
                    <th className="p-2 text-right">Stock Mínimo</th>
                    <th className="p-2">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-zinc-500 italic">
                        Sin alertas. Todos los productos tienen stock suficiente.
                      </td>
                    </tr>
                  ) : (
                    data.lowStockProducts.map((prod) => (
                      <tr key={prod.id} className="border-b border-zinc-200 text-[11px]">
                        <td className="p-2 font-mono text-zinc-500">{prod.id}</td>
                        <td className="p-2 font-medium">{prod.name}</td>
                        <td className="p-2 text-right font-mono font-bold text-red-700">{prod.stock}</td>
                        <td className="p-2 text-right font-mono">{prod.minStock}</td>
                        <td className="p-2 text-zinc-600">{prod.category}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Productos Inmovilizados */}
          <div className="mb-6 print:break-inside-avoid">
            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">Productos Inmovilizados (Sin Movimientos 90 Días)</h2>
            <div className="border border-zinc-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 text-[11px] font-bold text-zinc-700 uppercase">
                    <th className="p-2">ID</th>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Stock</th>
                    <th className="p-2 text-right">Valorización</th>
                    <th className="p-2">Último Movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deadStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-zinc-500 italic">
                        Sin productos inmovilizados. Excelente rotación.
                      </td>
                    </tr>
                  ) : (
                    data.deadStockProducts.map((prod) => (
                      <tr key={prod.id} className="border-b border-zinc-200 text-[11px]">
                        <td className="p-2 font-mono text-zinc-500">{prod.id}</td>
                        <td className="p-2 font-medium">{prod.name}</td>
                        <td className="p-2 text-right font-mono">{prod.stock}</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-700">{formatARS(prod.value)}</td>
                        <td className="p-2 text-zinc-500">
                          {prod.lastMovement ? new Date(prod.lastMovement).toLocaleDateString("es-AR") : "Sin movimientos registrados"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firmas de Control */}
          <div className="grid grid-cols-2 gap-12 mt-12 mb-8 print:break-inside-avoid">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-zinc-400 h-10" />
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mt-2">
                Responsable de Depósito
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-zinc-400 h-10" />
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mt-2">
                Firma Autorizada Gerencia
              </span>
            </div>
          </div>

          {/* Pie de Página */}
          <div className="text-center border-t border-zinc-200 pt-4 text-[11px] text-zinc-400 font-mono">
            RPM Accesorios © {new Date().getFullYear()} - Reporte de Auditoría de Inventarios, Reposición y Rotación de Stock.
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style media="print">
        {`
          @media print {
            aside,
            [data-sidebar="sidebar"],
            .print\\:hidden,
            button,
            header,
            footer,
            nav,
            .web-mcp-tools,
            #chat-floating-button,
            [role="dialog"],
            .DialogOverlay,
            .TooltipContent {
              display: none !important;
            }

            main, .container, body {
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
              background: white !important;
              color: black !important;
            }

            .container {
              width: 100% !important;
            }
          }
        `}
      </style>
    </div>
  );
}
