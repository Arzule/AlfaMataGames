// metro.config.js
// Configuración por defecto de Expo con un único cambio: en Android, el módulo de temas
// push de expo-notifications se sustituye por src/shims/TopicSubscriptionModule.android.js
// (Expo Go no trae ese módulo nativo y la app se cerraba al arrancar).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const TOPIC_SHIM = path.resolve(__dirname, 'src/shims/TopicSubscriptionModule.android.js');
const FROM_EXPO_NOTIFICATIONS = /[\\/]node_modules[\\/]expo-notifications[\\/]/;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    FROM_EXPO_NOTIFICATIONS.test(context.originModulePath)
  ) {
    return { type: 'sourceFile', filePath: TOPIC_SHIM };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
