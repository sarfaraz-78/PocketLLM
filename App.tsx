import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/useSettingsStore';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const { onboardingComplete } = useSettingsStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
