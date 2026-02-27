import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING } from '../constants/theme';

export default function NetworkStatus() {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // If we haven't loaded the state yet, or if it is connected, return null
  if (netInfo.isConnected !== false) {
    return null;
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: COLORS.expense,
        paddingTop: insets.top || SPACING.md,
      }
    ]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#FFFFFF" />
        <Text style={styles.text}>No Internet Connection / Network Problem</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 9999,
    paddingBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
});
