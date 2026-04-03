'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { Toaster } from 'sonner';
import { AlertDialog } from './alert-dialog';
import { ConfirmDialog } from './confirm-dialog';

// Alert Types
export interface AlertOptions {
  title: string;
  description: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertState extends AlertOptions {
  isOpen: boolean;
  onClose: () => void;
}

// Confirm Types
export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Context Type
interface UIContextType {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        ...options,
        isOpen: true,
        onClose: () => {
          setAlertState(null);
          resolve();
        },
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        isOpen: true,
        onConfirm: () => {
          setConfirmState(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <UIContext.Provider value={{ alert, confirm }}>
      {children}

      <Toaster position="top-right" />

      <AlertDialog
        isOpen={!!alertState}
        title={alertState?.title || ''}
        description={alertState?.description || ''}
        variant={alertState?.variant}
        action={alertState?.action}
        onClose={() => alertState?.onClose()}
      />

      <ConfirmDialog
        isOpen={!!confirmState}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        variant={confirmState?.variant}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => confirmState?.onCancel()}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
