import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatScreen } from '../screens/ChatScreen';
import { WorkspaceScreen } from '../screens/WorkspaceScreen';
import { ModelListScreen } from '../screens/ModelListScreen';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../theme';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ name: string; focused: boolean; color: string; primaryColor: string }> = ({ name, focused, color, primaryColor }) => (
  <View style={[styles.iconContainer, focused && { backgroundColor: primaryColor + '18' }]}>
    <Icon name={name} size={20} color={color} />
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
          height: Platform.OS === 'ios' ? 76 : 64,
          paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
          paddingTop: SPACING.xs,
          borderTopWidth: 1,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontWeight: '700',
          marginTop: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "chatbubbles" : "chatbubbles-outline"} focused={focused} color={color} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Workspace"
        component={WorkspaceScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "code-working" : "code-working-outline"} focused={focused} color={color} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Models"
        component={ModelListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} color={color} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={ConversationListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "time" : "time-outline"} focused={focused} color={color} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "settings" : "settings-outline"} focused={focused} color={color} primaryColor={colors.primary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
});