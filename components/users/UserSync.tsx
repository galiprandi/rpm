'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * Componente que sincroniza el usuario con UserRole al cargar
 * Se ejecuta para cualquier usuario autenticado
 */
export function UserSync() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Sync user with UserRole table
      fetch('/api/auth/sync', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.created) {
            console.log('Usuario sincronizado con UserRole');
          }
        })
        .catch((err) => {
          console.error('Error sincronizando usuario:', err);
        });
    }
  }, [session]);

  // This component doesn't render anything
  return null;
}
