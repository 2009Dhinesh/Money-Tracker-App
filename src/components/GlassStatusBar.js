import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function GlassStatusBar() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Requirements:
  // WHEN DARK MODE: App bg is dark -> Blur is BLACK (dark) -> Icons are WHITE (light-content)
  // WHEN LIGHT MODE: App bg is light -> Blur is WHITE (light) -> Icons are DARK (dark-content)
  const blurTint = isDark ? 'dark' : 'light';
  const barStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <>
      {/* Make raw status bar transparent to sit over components */}
      <StatusBar
        barStyle={barStyle}
        translucent={true}
        backgroundColor="transparent"
      />

      <View style={[styles.statusBarContainer, { height: insets.top }]}>
        {Platform.OS === 'android' && Platform.Version < 31 ? (
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { backgroundColor: isDark ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)' }
            ]} 
          />
        ) : (
          <BlurView
            intensity={80}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
