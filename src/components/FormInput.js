// src/components/FormInput.js
// Campo de formulario reutilizable.
// label, icon (nombre de Feather), error y el resto de props de TextInput.
// Si recibe secureTextEntry, muestra el boton para ver/ocultar el texto.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function FormInput({ label, icon, error, secureTextEntry, style, ...props }) {
  const [hidden, setHidden] = useState(true);
  const isSecure = !!secureTextEntry;

  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputBox, error && styles.inputBoxError]}>
        {icon ? <Feather name={icon} size={18} color={colors.textSecondary} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure ? hidden : false}
          {...props}
        />
        {isSecure ? (
          <TouchableOpacity onPress={() => setHidden((prev) => !prev)}>
            <Feather
              name={hidden ? 'eye' : 'eye-off'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

FormInput.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  error: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  field: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputBoxError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 6,
  },
});
