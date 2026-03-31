'use client';

import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Header
        title="Configuración"
        description="Personaliza la apariencia y comportamiento de la aplicación."
      />

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Personaliza el tema visual de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThemeSelector />
        </CardContent>
      </Card>

      <Separator />

      {/* Próximamente */}
      <Card>
        <CardHeader>
          <CardTitle>Más opciones</CardTitle>
          <CardDescription>
            Configuraciones adicionales estarán disponibles próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-2xl">🚧</span>
            <span>En desarrollo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
