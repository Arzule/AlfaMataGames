// src/components/SteamCard.js
// Tarjeta de Steam en Perfil: conectar la cuenta, sincronizar la biblioteca con progreso y ver
// los juegos no encontrados. Se oculta si el backend no tiene Steam configurado.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { formatDateTime } from '../utils/dateFormat';

const RULES_HINT =
  'Menos de 2 h jugadas → Pendiente; 2 h o más → Jugando; más de 50 h → además favorito. ' +
  'Lo que cambies a mano no se vuelve a tocar.';

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

function ProgressBar({ progress }) {
  const ratio = progress.total ? progress.processed / progress.total : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Sincronizando con Steam"
      accessibilityValue={{ min: 0, max: progress.total, now: progress.processed }}
      style={styles.progressBox}
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.hint}>
        {progress.total
          ? `Procesando ${progress.processed} de ${progress.total} juegos…`
          : 'Pidiendo tus juegos a Steam…'}
      </Text>
    </View>
  );
}

ProgressBar.propTypes = {
  progress: PropTypes.shape({
    processed: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

function SyncResult({ result }) {
  const [open, setOpen] = useState(false);
  const notFound = result.notFound || [];
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultText}>
        {result.total === 0
          ? 'Tu cuenta de Steam no tiene juegos.'
          : `Listo: ${plural(result.added, 'juego agregado', 'juegos agregados')} y ${plural(
              result.updated,
              'actualizado',
              'actualizados'
            )}.`}
      </Text>
      {result.notFoundCount ? (
        <>
          <TouchableOpacity
            onPress={() => setOpen((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            style={styles.linkRow}
          >
            <Text style={styles.link}>
              {`${plural(result.notFoundCount, 'juego no encontrado', 'juegos no encontrados')} en el catálogo`}
            </Text>
            <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
          </TouchableOpacity>
          {open ? (
            <Text style={styles.hint}>
              {notFound.join(' · ')}
              {result.notFoundCount > notFound.length ? ' …' : ''}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

SyncResult.propTypes = {
  result: PropTypes.shape({
    total: PropTypes.number,
    added: PropTypes.number,
    updated: PropTypes.number,
    notFoundCount: PropTypes.number,
    notFound: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default function SteamCard({ steam }) {
  const { status, loadError, busy, progress, result, message } = steam;

  // Sin Steam en el backend no se muestra nada.
  if (status && !status.available) return null;

  let body;
  if (!status) {
    body = loadError ? (
      <TouchableOpacity onPress={steam.reload} accessibilityRole="button">
        <Text style={styles.hint}>No se pudo cargar Steam. <Text style={styles.link}>Reintentar</Text></Text>
      </TouchableOpacity>
    ) : (
      <ActivityIndicator color={colors.primary} />
    );
  } else if (!status.linked) {
    body = (
      <>
        <Text style={styles.hint}>
          Conecta tu cuenta para importar tus juegos. En Steam, los detalles de juego de tu
          perfil deben ser públicos.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={steam.link}
          disabled={Boolean(busy)}
          accessibilityRole="button"
        >
          {busy === 'link' ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>Conectar Steam</Text>
          )}
        </TouchableOpacity>
      </>
    );
  } else {
    body = (
      <>
        <Text style={styles.hint}>
          Conectado como <Text style={styles.strong}>{status.personaName || status.steamId}</Text>
          {status.lastSyncAt ? ` · Última sincronización: ${formatDateTime(status.lastSyncAt)}` : ''}
        </Text>
        {progress ? <ProgressBar progress={progress} /> : null}
        {result && !progress ? <SyncResult result={result} /> : null}
        {!progress ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={steam.sync}
            disabled={Boolean(busy)}
            accessibilityRole="button"
          >
            {busy === 'sync' ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {status.lastSyncAt ? 'Volver a sincronizar' : 'Importar biblioteca'}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
        <Text style={styles.rules}>{RULES_HINT}</Text>
        <TouchableOpacity
          onPress={steam.unlink}
          disabled={Boolean(busy)}
          accessibilityRole="button"
          style={styles.unlinkBtn}
        >
          <Text style={[styles.link, styles.danger]}>
            {busy === 'unlink' ? 'Desconectando…' : 'Desconectar Steam'}
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="logo-steam" size={18} color={colors.textPrimary} />
        <Text style={styles.title}>Steam</Text>
      </View>
      {body}
      {message ? (
        <Text style={[styles.hint, message.type === 'error' ? styles.danger : styles.success]}>
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

SteamCard.propTypes = {
  steam: PropTypes.shape({
    status: PropTypes.object,
    loadError: PropTypes.string,
    busy: PropTypes.string,
    progress: PropTypes.object,
    result: PropTypes.object,
    message: PropTypes.shape({ type: PropTypes.string, text: PropTypes.string }),
    reload: PropTypes.func.isRequired,
    link: PropTypes.func.isRequired,
    unlink: PropTypes.func.isRequired,
    sync: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  strong: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  rules: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  progressBox: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.badgeNeutral,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  resultBox: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
  },
  link: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  unlinkBtn: {
    alignSelf: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  danger: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
});
