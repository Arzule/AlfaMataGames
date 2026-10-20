// App.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider } from './src/context/AuthContext';
import { LibraryProvider } from './src/context/LibraryContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { cleanExpiredCache } from './src/services/catalogCache';
import { configureNotifications } from './src/services/notifications';

export default function App() {
  // Al iniciar, borrar las entradas de caché vencidas (más de 7 días).
  useEffect(() => {
    cleanExpiredCache();
    // Mostrar notificaciones con la app abierta y crear el canal de Android.
    configureNotifications();
  }, []);

  // Carga las fuentes Sora e Inter antes de mostrar la app.
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Mientras cargan, mostrar un indicador (si fallan, seguimos con las del sistema).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <LibraryProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </LibraryProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
