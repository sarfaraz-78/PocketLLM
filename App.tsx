import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/useSettingsStore';
import { DeviceTierDetector } from './src/inference/DeviceTierDetector';
import { ToastProvider } from './src/components/ui/ToastProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const { onboardingComplete, deviceTier, setDeviceTier } = useSettingsStore();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    // Auto-detect device tier on startup if not set
    const init = async () => {
      if (!deviceTier) {
        try {
          const profile = await DeviceTierDetector.detect();
          setDeviceTier(profile.tier);
        } catch (e) {
          console.warn('[App] Device detection failed:', e);
        }
      }
      setInitDone(true);
    };
    init();
  }, []);

  if (!initDone) {
    return null; // or a splash screen
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!onboardingComplete ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <Stack.Screen name="Main" component={AppNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
