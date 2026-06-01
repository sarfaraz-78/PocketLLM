// Card is now an alias for GlassCard. Use GlassCard directly in new code.
import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { GlassCard, GlassCardVariant } from './GlassCard';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  darkMode?: boolean;
}

const paddingMap = { none: 0, sm: 8, md: 12, lg: 20 };

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  darkMode: _darkMode,
}) => {
  return (
    <GlassCard variant={variant} style={style} padding={paddingMap[padding]}>
      {children}
    </GlassCard>
  );
};
