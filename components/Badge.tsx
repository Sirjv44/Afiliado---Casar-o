import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface BadgeProps {
  status: string;
}

export default function Badge({ status }: BadgeProps) {
  const { color, label } = getStatusInfo(status);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function getStatusInfo(statusRaw: string) {
  const status = statusRaw?.toLowerCase?.().trim();

  if (status === 'paga' || status === 'paid') {
    return { color: COLORS.success, label: 'Paga' };
  }

  if (status === 'pendente' || status === 'pending') {
    return { color: COLORS.warning, label: 'Pendente' };
  }

  if (status === 'em processamento' || status === 'processing') {
    return { color: COLORS.accent, label: 'Processando' };
  }

  // Qualquer outro status será tratado como "Pendente" por padrão
  return { color: COLORS.warning, label: 'Pendente' };
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
