'use client';

import { useRouter } from 'next/navigation';
import { CreditNoteDialog } from '@/components/credit-notes/CreditNoteDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreditNotesNewClient() {
  const router = useRouter();

  const handleCreate = async (data: unknown) => {
    try {
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear nota de crédito');
      }

      router.push('/adm/credit-notes');
    } catch (error) {
      console.error('Error creating credit note:', error);
      alert(error instanceof Error ? error.message : 'Error al crear nota de crédito');
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push('/adm/credit-notes')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva Nota de Crédito</h1>
        <p className="text-muted-foreground">Crea una nueva nota de crédito para devoluciones</p>
      </div>

      <CreditNoteDialog
        open={true}
        onOpenChange={(open) => !open && router.push('/adm/credit-notes')}
        onCreate={handleCreate}
      />
    </div>
  );
}
