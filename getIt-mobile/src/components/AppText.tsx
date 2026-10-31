import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export default function AppText({ style, ...props }: TextProps) {
  return <Text style={[styles.default, style]} {...props} />;
}

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Nunito_400Regular',
  },
});