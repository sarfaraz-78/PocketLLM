import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ToastItem } from './Toast';
import { ToastContext, ToastOptions, ToastVariant } from '../../hooks/useToast';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ThemeName } from '../../theme/tokens';

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { themeVariant, darkMode } = useSettingsStore();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);

  const themeName: ThemeName = themeVariant || (darkMode ? 'midnight' : 'aurora');

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (message: string, options: Omit<ToastOptions, 'message'> = {}) => {
      const id = `toast-${Date.now()}-${counterRef.current++}`;
      const variant: ToastVariant = options.variant || 'info';
      const duration = options.duration ?? DEFAULT_DURATION;

      setToasts((prev) => {
        const next = [...prev, { id, message, variant, duration, action: options.action }];
        if (next.length > MAX_TOASTS) {
          return next.slice(next.length - MAX_TOASTS);
        }
        return next;
      });
    },
    []
  );

  const success = useCallback(
    (message: string, options: Omit<ToastOptions, 'message' | 'variant'> = {}) => {
      show(message, { ...options, variant: 'success' });
    },
    [show]
  );

  const error = useCallback(
    (message: string, options: Omit<ToastOptions, 'message' | 'variant'> = {}) => {
      show(message, { ...options, variant: 'error' });
    },
    [show]
  );

  const info = useCallback(
    (message: string, options: Omit<ToastOptions, 'message' | 'variant'> = {}) => {
      show(message, { ...options, variant: 'info' });
    },
    [show]
  );

  const warning = useCallback(
    (message: string, options: Omit<ToastOptions, 'message' | 'variant'> = {}) => {
      show(message, { ...options, variant: 'warning' });
    },
    [show]
  );

  const contextValue = useMemo(
    () => ({ show, success, error, info, warning, dismiss, dismissAll }),
    [show, success, error, info, warning, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <SafeAreaView
        pointerEvents="box-none"
        style={styles.toastContainer}
        edges={['top']}
      >
        <View pointerEvents="box-none">
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              message={toast.message}
              variant={toast.variant}
              duration={toast.duration}
              action={toast.action}
              onDismiss={dismiss}
              index={index}
              themeName={themeName}
            />
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    ...Platform.select({
      android: { elevation: 9999 },
      ios: { zIndex: 9999 },
    }),
  },
});
