'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export default function LogoutPage() {
  useEffect(() => {
    authClient.signOut().then(() => {
      window.location.href = '/login';
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Cerrando sesión...</p>
    </div>
  );
}
