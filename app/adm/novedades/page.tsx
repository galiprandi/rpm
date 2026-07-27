'use client';

import { useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';
import { FileText } from 'lucide-react';
import { useNovedadesRead } from '@/hooks/useNovedadesRead';
import { Header } from '@/components/adm/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NovedadesPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { markAsRead } = useNovedadesRead();

  useEffect(() => {
    async function loadNovedades() {
      try {
        const response = await fetch('/NOVEDADES.md');
        if (!response.ok) throw new Error('Failed to load');
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading NOVEDADES.md:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadNovedades();
    // Mark as read when page loads
    markAsRead();
  }, [markAsRead]);

  if (loading) {
    return (
      <div
        className="max-w-3xl mx-auto space-y-6"
        role="status"
        aria-label="Cargando novedades"
        aria-busy="true"
      >
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <div className="pt-4 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header
        title="Novedades"
        description="Últimas actualizaciones del sistema"
      />

      {error || !content.trim() ? (
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">
                No hay novedades disponibles para mostrar en este momento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <Streamdown>{content}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
