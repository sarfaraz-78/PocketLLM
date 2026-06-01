import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface ToastContextValue {
  show: (message: string, options?: Omit<ToastOptions, 'message'>) => void;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => void;
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => void;
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
