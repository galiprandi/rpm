'use client';

import { useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';
import { useNovedadesRead } from '@/hooks/useNovedadesRead';
import { Header } from '@/components/adm/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function NovedadesPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { markAsRead } = useNovedadesRead();

  useEffect(() => {
    async function loadNovedades() {
      try {
        const response = await fetch('/NOVEDADES.md');
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading NOVEDADES.md:', error);
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

      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <Streamdown>{content}</Streamdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
