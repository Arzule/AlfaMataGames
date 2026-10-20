// src/components/ErrorBoundary.js
// Captura los errores de render de toda la app y muestra una pantalla con "Reintentar".
// Reintentar vuelve a montar el árbol desde cero (la sesión se restaura del almacenamiento).
// Solo captura errores de render y ciclo de vida; los de eventos y promesas se manejan
// en cada pantalla con mensajes visibles.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { createLogger } from '../utils/logger';

const log = createLogger('render');

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetCount: 0 };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    log.error('Error de render capturado', {
      error,
      componentStack: info?.componentStack,
    });
  }

  handleRetry() {
    // Cambiar la key obliga a React a crear de nuevo todos los componentes hijos.
    this.setState((state) => ({ error: null, resetCount: state.resetCount + 1 }));
  }

  render() {
    const { error, resetCount } = this.state;

    if (!error) {
      return <React.Fragment key={resetCount}>{this.props.children}</React.Fragment>;
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconWrap}>
            <Feather name="alert-octagon" size={32} color={colors.warning} />
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Ocurrió un error inesperado en la app. Puedes reintentar; tus datos están a salvo.
          </Text>
          {__DEV__ ? (
            <Text style={styles.devDetails} selectable>
              {String(error?.message ?? error)}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={this.handleRetry}
            accessibilityRole="button"
          >
            <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.headingExtraBold,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    maxWidth: 360,
  },
  devDetails: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
    maxWidth: 360,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 24,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
