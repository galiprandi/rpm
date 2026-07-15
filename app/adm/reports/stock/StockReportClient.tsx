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
  TooltipProvider,
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
    <TooltipProvider>
      <div className="space-y-6">
        <Header
          title="Stock & Inventario"
          description="Valorización de stock, rotación y alertas de reposición."
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
              <TrendingUp className="h-5 w-5 text-primary" />
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
              <Layers className="h-5 w-5 text-primary" />
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
                          <span className="text-[10px] text-muted-foreground ml-1">
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
                                  <ExternalLink className="h-4 w-4" />
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
                                  <ExternalLink className="h-4 w-4" />
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
    </div>
    </TooltipProvider>
  );
}
