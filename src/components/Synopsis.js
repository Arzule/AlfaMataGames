// src/components/Synopsis.js
// Sinopsis del juego con su etiqueta de origen: traducida con DeepL, original sin traducir
// o traduciendo. Permite ver el original y expandir el texto.
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const COLLAPSED_LINES = 6;
// Aproximación: a partir de este largo el texto supera las 6 líneas en un celular.
const LONG_TEXT_CHARS = 320;

// Avisos cuando no hay traducción (el texto mostrado es el original).
const NOTICE_LABELS = {
  'not-configured': 'Texto original · traducción no disponible',
  quota: 'Texto original · se agotó la cuota de traducción',
  unavailable: 'Texto original · traducción no disponible',
};

export default function Synopsis({ text, original, translated, notice, loading }) {
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Al cambiar de juego o de traducción se vuelve al estado inicial.
  useEffect(() => {
    setExpanded(false);
    setShowOriginal(false);
  }, [text]);

  const visibleText = translated && showOriginal ? original : text;
  const isEmpty = !visibleText;
  const isLong = visibleText.length > LONG_TEXT_CHARS;

  let label = null;
  if (loading) {
    label = (
      <View style={styles.labelRow}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={styles.labelText}>Traduciendo…</Text>
      </View>
    );
  } else if (translated) {
    label = (
      <View style={styles.labelRow}>
        <Feather name="globe" size={12} color={colors.info} />
        <Text style={[styles.labelText, styles.labelInfo]}>
          {showOriginal ? 'Texto original' : 'Traducido automáticamente con DeepL'}
        </Text>
        <TouchableOpacity onPress={() => setShowOriginal((value) => !value)} hitSlop={8}>
          <Text style={styles.link}>{showOriginal ? 'Ver traducción' : 'Ver original'}</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (NOTICE_LABELS[notice] && !isEmpty) {
    label = (
      <View style={styles.labelRow}>
        <Feather name="info" size={12} color={colors.warning} />
        <Text style={[styles.labelText, styles.labelWarning]}>{NOTICE_LABELS[notice]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Text style={styles.title}>SINOPSIS</Text>
      {label}
      {isEmpty ? (
        <Text style={styles.text}>
          {loading ? 'Cargando sinopsis…' : 'Sin descripción disponible.'}
        </Text>
      ) : (
        <>
          <Text
            style={[styles.text, loading && styles.textLoading]}
            numberOfLines={expanded ? undefined : COLLAPSED_LINES}
          >
            {visibleText}
          </Text>
          {isLong ? (
            <TouchableOpacity onPress={() => setExpanded((value) => !value)} hitSlop={8}>
              <Text style={styles.link}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

Synopsis.propTypes = {
  text: PropTypes.string.isRequired,
  original: PropTypes.string,
  translated: PropTypes.bool,
  notice: PropTypes.string,
  loading: PropTypes.bool,
};

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
  },
  labelInfo: {
    color: colors.info,
  },
  labelWarning: {
    color: colors.warning,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  textLoading: {
    opacity: 0.6,
  },
  link: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
});
