import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatScreen } from '../screens/ChatScreen';
import { WorkspaceScreen } from '../screens/WorkspaceScreen';
import { ModelListScreen } from '../screens/ModelListScreen';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FloatingTabBar, TabConfig } from '../components/FloatingTabBar';
import { useTheme } from '../hooks/useTheme';

const TABS: TabConfig[] = [
  { key: 'Chat', label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { key: 'Workspace', label: 'Code', icon: 'code-working-outline', iconActive: 'code-working' },
  { key: 'Models', label: 'Models', icon: 'cube-outline', iconActive: 'cube' },
  { key: 'History', label: 'History', icon: 'time-outline', iconActive: 'time' },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

const SCREENS: Record<string, React.FC<any>> = {
  Chat: ChatScreen,
  Workspace: WorkspaceScreen,
  Models: ModelListScreen,
  History: ConversationListScreen,
  Settings: SettingsScreen,
};

export const AppNavigator: React.FC = () => {
  const [active, setActive] = useState<string>('Chat');
  const insets = useSafeAreaInsets();
  const Active = SCREENS[active];
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Active />
      <FloatingTabBar
        tabs={TABS}
        activeKey={active}
        onChange={setActive}
        bottomInset={Math.max(insets.bottom - 8, 0)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
