// src/components/OfflineBanner.js
// Franja inferior de toda la app: avisa cuando no hay conexión y, al volver,
// muestra "Conexión restablecida" unos segundos antes de desaparecer.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const BACK_ONLINE_MS = 2500;

export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  // 'offline' | 'back-online' | null
  const [mode, setMode] = useState(null);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
      setMode('offline');
      return undefined;
    }
    // Solo se avisa del regreso si antes se mostró el aviso de sin conexión.
    if (!wasOfflineRef.current) return undefined;
    wasOfflineRef.current = false;
    setMode('back-online');
    const timer = setTimeout(() => setMode(null), BACK_ONLINE_MS);
    return () => clearTimeout(timer);
  }, [isOffline]);

  if (!mode) return null;

  const offline = mode === 'offline';
  return (
    <View
      style={[
        styles.banner,
        offline ? styles.offline : styles.online,
        { paddingBottom: 8 + insets.bottom },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Feather
        name={offline ? 'wifi-off' : 'wifi'}
        size={14}
        color={offline ? colors.warning : colors.success}
      />
      <Text style={[styles.text, { color: offline ? colors.warning : colors.success }]}>
        {offline
          ? 'Sin conexión a internet. Algunas funciones no estarán disponibles.'
          : 'Conexión restablecida.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Fondo opaco: los *Bg del tema son translúcidos y se verían mal sobre el contenido.
  offline: {
    backgroundColor: '#2a2216',
  },
  online: {
    backgroundColor: '#14261f',
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    textAlign: 'center',
  },
});
