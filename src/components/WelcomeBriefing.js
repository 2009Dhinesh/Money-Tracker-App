import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Dimensions, ScrollView, Animated, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMetals } from '../hooks/useMetals';
import { useTransactions } from '../hooks/useTransactions';
import { useGoals } from '../hooks/useGoals';
import { useDebts } from '../hooks/useDebts';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import Button from './Button';

const { width, height } = Dimensions.get('window');

const WelcomeBriefing = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { prices, fetchPrices } = useMetals();
  const { summary, fetchSummary } = useTransactions();
  const { goals, fetchGoals } = useGoals();
  const { debts, fetchDebts } = useDebts();
  
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Fetch all data needed for the briefing
      fetchPrices();
      fetchSummary({ month, year });
      fetchGoals();
      fetchDebts();

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const totalDebt = debts?.reduce((acc, d) => acc + (d.remainingAmount || 0), 0) || 0;
  const nearestGoal = goals?.filter(g => g.status !== 'completed')
    .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <Animated.View style={[
          styles.modalContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: isDark ? 'rgba(30, 30, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)' },
          SHADOWS.xl
        ]}>
          <LinearGradient
            colors={isDark ? ['#1e1e2d', '#2d2d44'] : ['#ffffff', '#f8f9ff']}
            style={styles.gradient}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={[styles.dateText, { color: colors.textTertiary }]}>{format(new Date(), 'EEEE, do MMMM')}</Text>
                  <Text style={[styles.greeting, { color: colors.textPrimary }]}>Good Morning, {user?.name?.split(' ')[0]}! ☀️</Text>
                </View>
              </View>

              <Text style={[styles.introText, { color: colors.textSecondary }]}>
                Here's a quick reminder of where you stand today.
              </Text>

              {/* Metal Rates Row */}
              <View style={styles.row}>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.1)' : '#FFFBF0', borderColor: '#FFD700' }]}>
                  <Text style={styles.statLabel}>Gold (22K)</Text>
                  <Text style={[styles.statValue, { color: '#B8860B' }]}>₹{((prices?.gold?.price22k || prices?.gold?.price24k || 0).toLocaleString('en-IN')) || '--'}</Text>
                  <View style={styles.trendInfo}>
                    <Ionicons name="trending-up" size={12} color="#4CAF50" />
                    <Text style={styles.trendText}>Live Rate</Text>
                  </View>
                </View>
                <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(192, 192, 192, 0.1)' : '#F5F5F5', borderColor: '#C0C0C0' }]}>
                  <Text style={styles.statLabel}>Silver (999)</Text>
                  <Text style={[styles.statValue, { color: '#707070' }]}>₹{((prices?.silver?.price999 || 0).toLocaleString('en-IN')) || '--'}</Text>
                  <View style={styles.trendInfo}>
                    <Ionicons name="analytics" size={12} color={COLORS.primary} />
                    <Text style={styles.trendText}>Updated</Text>
                  </View>
                </View>
              </View>

              {/* Financial Snapshot */}
              <View style={[styles.wideBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.snapshotItem}>
                  <View style={[styles.iconBox, { backgroundColor: `${COLORS.income}15` }]}>
                    <Ionicons name="wallet-outline" size={18} color={COLORS.income} />
                  </View>
                  <View>
                    <Text style={styles.snapshotLabel}>Total Balance</Text>
                    <Text style={[styles.snapshotValue, { color: colors.textPrimary }]}>₹{summary?.balance?.toLocaleString() || '0'}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.snapshotItem}>
                  <View style={[styles.iconBox, { backgroundColor: `${COLORS.expense}15` }]}>
                    <Ionicons name="warning-outline" size={18} color={COLORS.expense} />
                  </View>
                  <View>
                    <Text style={styles.snapshotLabel}>Total Debts</Text>
                    <Text style={[styles.snapshotValue, { color: COLORS.expense }]}>₹{totalDebt.toLocaleString() || '0'}</Text>
                  </View>
                </View>
              </View>

              {/* Goal Highlight */}
              {nearestGoal && (
                <View style={[styles.goalSection, { backgroundColor: `${COLORS.primary}08`, borderColor: `${COLORS.primary}30` }]}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>Target: {nearestGoal.title}</Text>
                    <Text style={[styles.goalPercent, { color: COLORS.primary }]}>
                      {Math.round((nearestGoal.currentAmount / nearestGoal.targetAmount) * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(nearestGoal.currentAmount / nearestGoal.targetAmount) * 100}%`, backgroundColor: COLORS.primary }]} />
                  </View>
                  <Text style={styles.goalRemaining}>
                    ₹{(nearestGoal.targetAmount - nearestGoal.currentAmount).toLocaleString()} more to reach your goal! 🚀
                  </Text>
                </View>
              )}

              <Button 
                title="Continue to App" 
                onPress={onClose}
                style={styles.mainBtn}
              />
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.8,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradient: {
    padding: SPACING.xl,
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  greeting: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOWS.sm,
      android: { elevation: 2 }
    })
  },
  introText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  wideBox: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  snapshotItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  snapshotValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    marginHorizontal: SPACING.sm,
  },
  goalSection: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalRemaining: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  mainBtn: {
    marginTop: SPACING.sm,
  }
});

export default WelcomeBriefing;
