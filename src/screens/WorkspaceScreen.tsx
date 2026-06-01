import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { SPACING, RADIUS, FONT_SIZES } from '../theme/tokens';
import { useTheme } from '../hooks/useTheme';
import { IdeScreen } from './IdeScreen';
import { TerminalScreen } from './TerminalScreen';
import { BrowserScreen } from './BrowserScreen';

type WorkspaceTab = 'ide' | 'terminal' | 'browser';

export const WorkspaceScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ide');

  const renderContent = () => {
    switch (activeTab) {
      case 'ide':
        return <IdeScreen />;
      case 'terminal':
        return <TerminalScreen />;
      case 'browser':
        return <BrowserScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Glassmorphic/Sleek Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Icon name="code-working-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Workspace</Text>
        </View>

        {/* Premium Segmented Switcher */}
        <View style={[styles.switcherContainer, { backgroundColor: darkMode ? '#0b0f19' : '#f1f5f9' }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'ide' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setActiveTab('ide')}
            activeOpacity={0.8}
          >
            <Icon
              name="document-text-outline"
              size={16}
              color={activeTab === 'ide' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'ide' ? colors.text : colors.textSecondary },
                activeTab === 'ide' && styles.activeTabText,
              ]}
            >
              IDE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'terminal' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setActiveTab('terminal')}
            activeOpacity={0.8}
          >
            <Icon
              name="terminal-outline"
              size={16}
              color={activeTab === 'terminal' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'terminal' ? colors.text : colors.textSecondary },
                activeTab === 'terminal' && styles.activeTabText,
              ]}
            >
              Terminal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'browser' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
            ]}
            onPress={() => setActiveTab('browser')}
            activeOpacity={0.8}
          >
            <Icon
              name="globe-outline"
              size={16}
              color={activeTab === 'browser' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'browser' ? colors.text : colors.textSecondary },
                activeTab === 'browser' && styles.activeTabText,
              ]}
            >
              Browser
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab View Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  switcherContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.lg,
  },
  activeTabBtn: {
    // Styling handled dynamically via inline styles
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
