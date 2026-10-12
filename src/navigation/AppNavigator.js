// src/navigation/AppNavigator.js
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GameCatalogScreen from '../screens/GameCatalogScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold },
      }}
    >
      <Tab.Screen
        name="Catalogo"
        component={GameCatalogScreen}
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favoritos"
        component={FavoritesScreen}
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Pantalla mostrada mientras se restaura la sesión guardada.
function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export default function AppNavigator() {
  const { loading, user } = useAuth();

  // Mientras se comprueba si hay sesión, mostrar un indicador.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? (
        // Sesión iniciada: catálogo (tabs), detalle y perfil.
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="GameDetail" component={GameDetailScreen} />
        </Stack.Navigator>
      ) : (
        // Sin sesión: login y registro.
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
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
