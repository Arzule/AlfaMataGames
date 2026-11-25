// src/components/CityMap.js
// Mapa estático de la ciudad con teselas de OpenStreetMap (estilo oscuro de CARTO): funciona
// igual en Android, iOS, web y el APK, sin clave ni módulo nativo. Tocarlo abre OpenStreetMap.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const TILE = 256;
const ZOOM = 11;
const HEIGHT = 170;
const tileUrl = (x, y) => `https://basemaps.cartocdn.com/dark_all/${ZOOM}/${x}/${y}@2x.png`;

// Coordenadas -> píxel global en el zoom elegido (proyección Web Mercator).
function toPixel(latitude, longitude) {
  const scale = TILE * 2 ** ZOOM;
  const lat = (latitude * Math.PI) / 180;
  return {
    x: ((longitude + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * scale,
  };
}

function visibleTiles(center, width, height) {
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const count = 2 ** ZOOM;
  const tiles = [];
  for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty += 1) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx += 1) {
      tiles.push({
        key: `${tx}-${ty}`,
        url: tileUrl(((tx % count) + count) % count, ty),
        left: tx * TILE - left,
        top: ty * TILE - top,
      });
    }
  }
  return tiles;
}

export default function CityMap({ latitude, longitude, city }) {
  const [width, setWidth] = useState(0);
  const center = toPixel(latitude, longitude);
  const tiles = width ? visibleTiles(center, width, HEIGHT) : [];
  const openMap = () => {
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${ZOOM}/${latitude}/${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={openMap}
      accessibilityRole="link"
      accessibilityLabel={`Mapa de ${city}. Abrir en OpenStreetMap`}
      style={styles.map}
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.url }}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ))}
      <View pointerEvents="none" style={styles.area} />
      <View pointerEvents="none" style={styles.pin}>
        <Ionicons name="location" size={30} color={colors.primary} />
      </View>
      <Text style={styles.attribution}>© OpenStreetMap © CARTO</Text>
    </TouchableOpacity>
  );
}

CityMap.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  city: PropTypes.string.isRequired,
};

const AREA = 56;

const styles = StyleSheet.create({
  map: {
    height: HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tile: {
    position: 'absolute',
    width: TILE,
    height: TILE,
  },
  // Círculo de la zona aproximada (la posición se redondea a unos 1 km).
  area: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: AREA,
    height: AREA,
    marginLeft: -AREA / 2,
    marginTop: -AREA / 2,
    borderRadius: AREA / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  pin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -15,
    marginTop: -30,
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    color: colors.textOnImage,
    fontSize: 10,
    fontFamily: fonts.body,
  },
});
