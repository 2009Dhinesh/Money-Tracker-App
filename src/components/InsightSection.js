import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInsights } from '../hooks/useInsights';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const InsightSection = memo(() => {
  const { colors } = useTheme();
  const { insights, fetchInsights, loading } = useInsights();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading || insights.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>AI Insights 🧠</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        snapToInterval={width - SPACING.xl * 2}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight, index) => (
          <View 
            key={index} 
            style={[
              styles.card, 
              { 
                backgroundColor: colors.surface, 
                borderColor: insight.type === 'warning' ? COLORS.expense : (insight.type === 'success' ? COLORS.income : colors.border)
              },
              SHADOWS.sm
            ]}
          >
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: `${insight.type === 'warning' ? COLORS.expense : (insight.type === 'success' ? COLORS.income : COLORS.primary)}15` }]}>
                <Ionicons 
                  name={insight.type === 'warning' ? 'alert-circle' : (insight.type === 'success' ? 'checkmark-circle' : 'bulb')} 
                  size={20} 
                  color={insight.type === 'warning' ? COLORS.expense : (insight.type === 'success' ? COLORS.income : COLORS.primary)} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{insight.title}</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{insight.message}</Text>
              </View>
            </View>
            <View style={[styles.suggestionBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.suggestionLabel, { color: colors.textTertiary }]}>AI SUGGESTION:</Text>
              <Text style={[styles.suggestion, { color: colors.textPrimary }]}>{insight.suggestion}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', marginBottom: SPACING.sm },
  scrollContent: { gap: SPACING.md },
  card: {
    width: width - SPACING.xl * 2,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT_SIZES.base, fontWeight: '700', marginBottom: 2 },
  message: { fontSize: FONT_SIZES.xs, lineHeight: 18 },
  suggestionBox: { padding: SPACING.md, borderRadius: RADIUS.md },
  suggestionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  suggestion: { fontSize: 11, fontWeight: '600' },
});

export default InsightSection;
