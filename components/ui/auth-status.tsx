'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

interface AuthStatusProps {
  variant?: 'button' | 'link';
  className?: string;
}

export function AuthStatus({ variant = 'button', className }: AuthStatusProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <span className="text-sm text-muted-foreground">...</span>;
  }

  const isAuthenticated = !!session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  if (variant === 'link') {
    return isAuthenticated ? (
      <button
        onClick={handleSignOut}
        className={`text-sm text-muted-foreground hover:text-foreground ${className}`}
      >
        Cerrar sesión
      </button>
    ) : (
      <a
        href="/login"
        className={`text-sm text-muted-foreground hover:text-foreground ${className}`}
      >
        Iniciar sesión
      </a>
    );
  }

  return isAuthenticated ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Cerrar sesión
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      className={className}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Iniciar sesión
    </Button>
  );
}
