import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext.jsx';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Provider } from 'react-redux';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const auth = useAuth();
  const theme = useTheme();

  if (auth.loading || theme.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors?.background || '#fff' }}>
        <ActivityIndicator size="large" color={theme.colors?.primary || '#4CAF50'} />
        <Text style={{ marginTop: 10, color: theme.colors?.text || '#000' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
