'use client';

import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ui/ThemeSelector';

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
    </div>
  );
}
