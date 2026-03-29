import { ReactNode } from 'react';
import { AuthStatus } from '@/components/ui/auth-status';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <AuthStatus variant="link" />
      </div>
      <div className="text-center">
        {children}
      </div>
    </div>
  );
}
