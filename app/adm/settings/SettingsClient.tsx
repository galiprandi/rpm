'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SettingItem } from '@/components/settings/SettingItem';
import { CreditCard, ChevronRight, Palette, Percent, TrendingUp } from 'lucide-react';

interface SettingsClientProps {
  initialMinimumMargin: number;
}

export default function SettingsClient({ initialMinimumMargin }: SettingsClientProps) {
  const [minimumMargin, setMinimumMargin] = useState<string>(initialMinimumMargin.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = parseFloat(minimumMargin);
      if (isNaN(value) || value < 0 || value > 100) {
        toast.error('El margen debe estar entre 0 y 100');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimumMarginPercentage: value }),
      });

      if (response.ok) {
        toast.success('Configuración actualizada correctamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header
        title="Configuración"
        description="Personaliza la apariencia y comportamiento de la aplicación."
      />

      <div className="space-y-6">
        {/* Apariencia */}
        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="pb-4 bg-muted/20">
            <CardTitle className="text-lg">Apariencia</CardTitle>
            <CardDescription>
              Personaliza el tema visual de la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <SettingItem
                title="Tema del Sistema"
                description="Selecciona entre tema claro, oscuro o sincronizado con el sistema"
                icon={Palette}
              >
                <ThemeSelector />
              </SettingItem>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Precios */}
        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="pb-4 bg-muted/20">
            <CardTitle className="text-lg">Listas de Precios</CardTitle>
            <CardDescription>
              Configuración global para el cálculo y alertas de precios.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <SettingItem
                title="Margen Mínimo Global"
                description="Alerta cuando una lista o excepción quede por debajo de este valor"
                icon={Percent}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TrendingUp
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={minimumMargin}
                      onChange={(e) => setMinimumMargin(e.target.value)}
                      className="w-32 h-9 text-sm pl-9 pr-7 font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 px-4"
                    onClick={handleSave}
                    loading={saving}
                  >
                    Guardar
                  </Button>
                </div>
              </SettingItem>
            </div>
          </CardContent>
        </Card>

        {/* Finanzas */}
        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="pb-4 bg-muted/20">
            <CardTitle className="text-lg">Finanzas</CardTitle>
            <CardDescription>
              Configuración de métodos de pago y opciones de cobro.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href="/adm/payment-methods"
              className="group block hover:bg-muted/30 transition-colors"
            >
              <div className="px-6">
                <SettingItem
                  title="Métodos de Pago"
                  description="Administra las formas de pago disponibles (Efectivo, Transferencia, QR, etc.)"
                  icon={CreditCard}
                >
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </SettingItem>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
