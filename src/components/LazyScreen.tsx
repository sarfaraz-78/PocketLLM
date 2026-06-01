import React, { useEffect, useState, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LazyScreenProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: ReactNode;
  props?: Record<string, any>;
}

export const LazyScreen: React.FC<LazyScreenProps> = ({ loader, fallback, props }) => {
  const { colors } = useTheme();
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    loader()
      .then((m) => {
        if (mounted) setComponent(() => m.default);
      })
      .catch(() => {
        if (mounted) setComponent(() => () => null);
      });
    return () => {
      mounted = false;
    };
  }, [loader]);

  if (!Component) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        {fallback || <ActivityIndicator color={colors.primary} />}
      </View>
    );
  }

  return <Component {...(props || {})} />;
};
