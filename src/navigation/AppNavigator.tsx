import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatScreen } from '../screens/ChatScreen';
import { ModelListScreen } from '../screens/ModelListScreen';
import { LocalModelsScreen } from '../screens/LocalModelsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();

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
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Models"
        component={ModelListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Import"
        component={LocalModelsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="folder-open-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={ConversationListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
