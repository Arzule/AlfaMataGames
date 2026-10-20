// src/shims/TopicSubscriptionModule.android.js
// Reemplaza el módulo de temas push de expo-notifications (ver metro.config.js).
// Expo Go en Android no incluye ExpoTopicSubscriptionModule y el original usa
// requireNativeModule, que lanza al importar expo-notifications y tumba la app.
// Con requireOptionalNativeModule la importación funciona; si el módulo falta,
// subscribeToTopicAsync lanza UnavailabilityError (la app no usa temas push).
import { requireOptionalNativeModule } from 'expo-modules-core';

export default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? {};
