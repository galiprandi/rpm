'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SettingItem } from '@/components/settings/SettingItem';

export default function SettingsPage() {
  const [minimumMargin, setMinimumMargin] = useState<string>('15.0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setMinimumMargin(data.minimumMarginPercentage.toString());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-6">
      <Header
        title="Configuración"
        description="Personaliza la apariencia y comportamiento de la aplicación."
      />

      {/* Apariencia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Personaliza el tema visual de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Configuración de Precios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listas de Precios</CardTitle>
          <CardDescription>
            Configuración global para el cálculo y alertas de precios.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <SettingItem
            title="Margen Mínimo Global"
            description="Alerta cuando una lista o excepción quede por debajo de este valor"
          >
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={minimumMargin}
              onChange={(e) => setMinimumMargin(e.target.value)}
              disabled={loading}
              className="w-24 h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? '...' : 'Guardar'}
            </Button>
          </SettingItem>
        </CardContent>
      </Card>
    </div>
  );
}
