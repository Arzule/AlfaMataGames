// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { LibraryProvider } from './src/context/LibraryContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </LibraryProvider>
    </AuthProvider>
  );
}
