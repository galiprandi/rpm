'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Fingerprint, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/adm',
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-brand selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/10 blur-[150px] rounded-full animate-float" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tighter text-white">
              RPM<span className="text-brand">ACCESORIOS</span>
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white tracking-tight">Bienvenido.</h1>
          <p className="text-zinc-500">Accedé a tu cuenta o gestioná tu vehículo.</p>
        </div>

        <div className="space-y-4">
          {/* Primary Login Option */}
          <Button 
            onClick={handleGoogleLogin}
            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
          >
             <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-0.6z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
             </svg>
             Continuar con Google
          </Button>

          {/* Biometrics Placeholder (Future implementation with Passkeys) */}
          <Button 
            variant="outline"
            className="w-full h-16 border-white/10 bg-zinc-900/50 text-white hover:bg-zinc-900 font-bold text-lg rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
          >
             <Fingerprint className="h-6 w-6 text-brand" />
             Acceso con Huella / FaceID
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl text-center space-y-2">
            <ShieldCheck className="h-6 w-6 text-brand mx-auto" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Seguridad</p>
            <p className="text-xs text-white">Auth Certificada</p>
          </div>
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl text-center space-y-2">
            <Camera className="h-6 w-6 text-brand mx-auto" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Historial</p>
            <p className="text-xs text-white">Fotos de tu OT</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
            Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
