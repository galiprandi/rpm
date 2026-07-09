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
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import { StockReportData } from "@/lib/services/stockReportService";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          {[1, 2, 3, 4].map((i) => (
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
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Valor Total Stock"
          value={formatARS(data.totalValue)}
          icon={DollarSign}
          subtitle="A costo de reposición"
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
          className={data.lowStockCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}
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
                <div key={product.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
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
                    <span className="font-mono">{formatARS(cat.value)}</span>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Alertas de Reposición</CardTitle>
            <CardDescription>Productos con stock igual o inferior al mínimo</CardDescription>
          </div>
          <Badge variant={data.lowStockCount > 0 ? "destructive" : "outline"}>
            {data.lowStockCount} alertas
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium">Categoría</th>
                  <th className="text-right p-3 font-medium">Stock Actual</th>
                  <th className="text-right p-3 font-medium">Stock Mínimo</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      No hay alertas de stock en este momento.
                    </td>
                  </tr>
                ) : (
                  data.lowStockProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-red-600">
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {product.minStock}
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/adm/products?search=${product.name}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Ver producto</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
