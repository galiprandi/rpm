'use client';

import { useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';
import { useNovedadesRead } from '@/hooks/useNovedadesRead';

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
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando novedades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="prose prose-slate max-w-none dark:prose-invert">
        <Streamdown>{content}</Streamdown>
      </div>
    </div>
  );
}
