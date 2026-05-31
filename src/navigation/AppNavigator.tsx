import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatScreen } from '../screens/ChatScreen';
import { ModelListScreen } from '../screens/ModelListScreen';
import { LocalModelsScreen } from '../screens/LocalModelsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { TerminalScreen } from '../screens/TerminalScreen';
import { IdeScreen } from '../screens/IdeScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Icon name={name} size={22} color={color} />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
          paddingTop: SPACING.sm,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "chatbubbles" : "chatbubbles-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Models"
        component={ModelListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Import"
        component={LocalModelsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "folder" : "folder-open-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={ConversationListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "time" : "time-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "settings" : "settings-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "terminal" : "terminal-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="IDE"
        component={IdeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "code-slash" : "code-slash"} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Browser"
        component={BrowserScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "globe" : "globe-outline"} focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
});