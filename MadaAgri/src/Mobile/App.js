import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { LanguageProvider } from './src/i18n/LanguageContext';
import './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const theme = useTheme();
  const auth = useAuth();

  if (theme.isLoading || auth.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors?.background || '#F6F8FA' }}>
        <ActivityIndicator size="large" color={theme.colors?.primary || '#1B6B32'} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

function AppLoaded() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <AppLoaded />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
