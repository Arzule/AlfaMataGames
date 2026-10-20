// src/components/ReviewCard.js
// Reseña de otro usuario: avatar, nombre, fecha, puntuación y texto.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Avatar from './Avatar';
import Rating from './Rating';
import { formatDate } from '../utils/dateFormat';

// Memorizada: escribir la reseña propia en el detalle no vuelve a dibujar las de la comunidad.
function ReviewCard({ review }) {
  const date = formatDate(review.date);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={review.user.avatar} name={review.user.name} size={32} />
        <View style={styles.headerTexts}>
          <Text style={styles.name} numberOfLines={1}>
            {review.user.name}
          </Text>
          {date ? <Text style={styles.date}>{date}</Text> : null}
        </View>
        {typeof review.userScore === 'number' ? (
          <Rating value={review.userScore} size={12} readOnly />
        ) : null}
      </View>
      <Text style={styles.text}>{review.review}</Text>
    </View>
  );
}

export default React.memo(ReviewCard);

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    review: PropTypes.string.isRequired,
    userScore: PropTypes.number,
    date: PropTypes.string,
    user: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTexts: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 19,
  },
});
