/**
 * StepActions Component
 * Botones de navegación entre pasos
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepActionsProps {
  onBack?: () => void;
  onContinue?: () => void;
  onContinueDisabled?: boolean;
  backLabel?: string;
  continueLabel?: string;
  extraActions?: React.ReactNode;
  loading?: boolean;
}

export function StepActions({
  onBack,
  onContinue,
  onContinueDisabled = false,
  backLabel = 'Volver',
  continueLabel = 'Continuar',
  extraActions,
  loading = false,
}: StepActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {extraActions}
        
        {onContinue && (
          <Button
            onClick={onContinue}
            disabled={onContinueDisabled || loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {continueLabel}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
