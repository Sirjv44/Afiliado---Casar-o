import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS } from '@/constants/Colors';

interface ActionButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  primary?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function ActionButton({
  title,
  onPress,
  primary = true,
  loading = false,
  disabled = false,
  icon,
}: ActionButtonProps) {
  const handlePress = async () => {
    try {
      await onPress();
    } catch (error) {
      console.error('Error in button press:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={primary ? '#FFFFFF' : COLORS.primary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.buttonText,
              primary ? styles.primaryButtonText : styles.secondaryButtonText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: COLORS.text,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  iconContainer: {
    marginRight: 10,
  },
});