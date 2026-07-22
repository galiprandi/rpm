"use client";

import { useState } from "react";
import { Header } from "@/components/adm/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Database } from "lucide-react";
import { useUI } from "@/components/ui/UIProvider";

interface RecalculateResult {
  success: boolean;
  customersProcessed?: number;
  driftsFound?: number;
  totalDrift?: number;
  error?: string;
}

export default function MaintenanceClient() {
  const { alert, confirm } = useUI();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<RecalculateResult | null>(null);

  const handleRecalculate = async () => {
    if (isRecalculating) return;

    const confirmed = await confirm({
      title: "Recalcular balances",
      description:
        "Esto recalcula el balance de todos los clientes desde los registros fuente (OTs, ventas directas, notas de crédito). Si hay desfasajes, se corregirán automáticamente. ¿Continuar?",
      confirmText: "Recalcular",
      variant: "warning",
    });

    if (!confirmed) return;

    setIsRecalculating(true);
    try {
      const res = await fetch("/api/admin/recalculate-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: RecalculateResult = await res.json();
      setLastResult(data);

      if (data.success) {
        if (data.driftsFound && data.driftsFound > 0) {
          await alert({
            title: "Recálculo completado",
            description: `Se corrigieron ${data.driftsFound} desfasajes de ${data.customersProcessed} clientes. Drift total: $${data.totalDrift?.toFixed(2)}`,
            variant: "success",
          });
        } else {
          await alert({
            title: "Recálculo completado",
            description: `No se encontraron desfasajes. ${data.customersProcessed} clientes verificados.`,
            variant: "success",
          });
        }
      } else {
        await alert({
          title: "Error",
          description: data.error || "Error al recalcular balances",
          variant: "error",
        });
      }
    } catch {
      await alert({
        title: "Error",
        description: "Error al recalcular balances",
        variant: "error",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Mantenimiento"
        description="Controles de mantenimiento del sistema"
      />

      <Card className="max-w-2xl overflow-hidden">
        <CardHeader className="bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Operación de mantenimiento</p>
              <p className="mt-1">
                Recalcula el balance de todos los clientes desde los registros
                fuente. Solo usar post-deploy o ante sospecha de desfasajes.
              </p>
            </div>
          </div>

          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            variant="outline"
            className="w-full"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRecalculating ? "animate-spin" : ""}`}
            />
            {isRecalculating ? "Recalculando..." : "Recalcular Balances"}
          </Button>

          {lastResult && (
            <div className="text-sm text-muted-foreground border-t pt-3">
              {lastResult.success ? (
                <span>
                  Ultima ejecución: {lastResult.customersProcessed} clientes
                  procesados, {lastResult.driftsFound} desfasajes corregidos
                  {lastResult.totalDrift !== undefined &&
                    ` (drift: $${lastResult.totalDrift.toFixed(2)})`}
                </span>
              ) : (
                <span className="text-red-600">
                  Error: {lastResult.error}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
