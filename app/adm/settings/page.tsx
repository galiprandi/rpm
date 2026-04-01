'use client';

import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { Separator } from '@/components/ui/separator';
import { Upload, FileSpreadsheet, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

      {/* Importación de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importación de Datos
          </CardTitle>
          <CardDescription>
            Importa datos desde archivos CSV u otros formatos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/settings/import/products">
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Importar Productos</div>
                  <div className="text-sm text-muted-foreground">
                    Carga productos desde CSV con mapeo de columnas
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
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
