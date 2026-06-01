import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/useSettingsStore';
import { DeviceTierDetector } from './src/inference/DeviceTierDetector';
import { ToastProvider } from './src/components/ui/ToastProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { COLORS } from './src/theme';

LogBox.ignoreLogs(['Sending', 'Require cycle', 'new NativeEventEmitter']);

const Stack = createStackNavigator();

const SplashFallback: React.FC = () => (
  <View style={styles.splash}>
    <ActivityIndicator size="large" color={COLORS.dark.primary} />
    <Text style={styles.splashText}>Starting PocketLLM...</Text>
  </View>
);

const App: React.FC = () => {
  const { onboardingComplete, deviceTier, setDeviceTier } = useSettingsStore();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
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
    return <SplashFallback />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.background,
  },
  splashText: {
    color: COLORS.dark.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
});

export default App;
