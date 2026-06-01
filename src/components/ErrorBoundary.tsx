import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION } from '../theme/tokens';
import { getThemeColors } from '../theme/tokens';
import { useSettingsStore } from '../store/useSettingsStore';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onReload={this.handleReload} />;
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: string | null;
  onReload: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReload }) => {
  const { themeVariant, darkMode } = useSettingsStore();
  const themeName = themeVariant || (darkMode ? 'midnight' : 'aurora');
  const colors = getThemeColors(themeName);
  const isDev = __DEV__;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.error + '15' }]}>
        <Icon name="bug-outline" size={56} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        The app encountered an unexpected error. Your data is safe.
      </Text>

      <TouchableOpacity
        style={[styles.reloadButton, { backgroundColor: colors.primary }]}
        onPress={onReload}
        activeOpacity={0.85}
      >
        <Icon name="refresh" size={18} color={colors.textInverse} />
        <Text style={[styles.reloadText, { color: colors.textInverse }]}>Reload App</Text>
      </TouchableOpacity>

      {isDev && error && (
        <ScrollView style={[styles.devPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.devTitle, { color: colors.error }]}>Dev Mode - Error Details</Text>
          <Text style={[styles.devText, { color: colors.text }]}>{error.toString()}</Text>
          {errorInfo && (
            <Text style={[styles.devStack, { color: colors.textSecondary }]}>{errorInfo}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['4xl'],
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...ELEVATION[2],
  },
  reloadText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  devPanel: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    maxHeight: 240,
    width: '100%',
  },
  devTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  devText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: SPACING.sm,
  },
  devStack: {
    fontSize: FONT_SIZES.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
