import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

import wealthApi from '../api/wealthApi';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import LoadingSpinner from '../components/LoadingSpinner';

const WIDTH = Dimensions.get('window').width;

export default function WealthDashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await wealthApi.getDashboard();
      setData(res.dashboard);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const d = data || {};
  const nw = d.netWorth || 0;
  const nwColor = nw >= 0 ? COLORS.income : COLORS.expense;

  // Pie chart data
  const distribution = d.distribution || [];
  const totalDistValue = distribution.reduce((s, i) => s + i.value, 0);

  // Monthly trend
  const monthlyTrend = d.monthlyTrend || [];
  const maxTrend = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

  const formatNum = (n) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString()}`;
  };

  if (loading && !refreshing) return <LoadingSpinner message="Loading wealth dashboard..." />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>💰 Wealth Overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Net Worth Hero */}
        <View style={[styles.heroCard, SHADOWS.md, { backgroundColor: isDark ? '#1A1A2E' : '#6C63FF' }]}>
          <Text style={styles.heroLabel}>Net Worth</Text>
          <Text style={styles.heroAmount}>{formatNum(nw)}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroItemLabel}>Assets</Text>
              <Text style={styles.heroItemVal}>{formatNum(d.totalAssets || 0)}</Text>
            </View>
            <View style={[styles.heroDivider]} />
            <View style={styles.heroItem}>
              <Ionicons name="trending-down" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroItemLabel}>Liabilities</Text>
              <Text style={styles.heroItemVal}>{formatNum(d.totalLiabilities || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Asset Breakdown Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Asset Breakdown</Text>

        <View style={styles.gridRow}>
          {/* Cash */}
          <TouchableOpacity style={[styles.assetTile, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Accounts')}>
            <View style={[styles.tileDot, { backgroundColor: '#6C63FF' }]} />
            <Text style={{ fontSize: 24 }}>🏦</Text>
            <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>Cash & Bank</Text>
            <Text style={[styles.tileAmount, { color: '#6C63FF' }]}>{formatNum(d.cash?.total || 0)}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>{d.cash?.accounts || 0} accounts</Text>
          </TouchableOpacity>

          {/* Gold */}
          <TouchableOpacity style={[styles.assetTile, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Metals')}>
            <View style={[styles.tileDot, { backgroundColor: '#FFB020' }]} />
            <Text style={{ fontSize: 24 }}>🪙</Text>
            <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>Gold</Text>
            <Text style={[styles.tileAmount, { color: '#FFB020' }]}>{formatNum(d.gold?.currentValue || 0)}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>{d.gold?.totalWeight || 0}g · {d.gold?.count || 0} items</Text>
            {d.gold?.profitLoss != null && (
              <Text style={{ color: d.gold.profitLoss >= 0 ? COLORS.income : COLORS.expense, fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 2 }}>
                {d.gold.profitLoss >= 0 ? '+' : ''}{formatNum(d.gold.profitLoss)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Silver */}
          <TouchableOpacity style={[styles.assetTile, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Metals')}>
            <View style={[styles.tileDot, { backgroundColor: '#C0C0C0' }]} />
            <Text style={{ fontSize: 24 }}>🥈</Text>
            <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>Silver</Text>
            <Text style={[styles.tileAmount, { color: '#8E8E93' }]}>{formatNum(d.silver?.currentValue || 0)}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>{d.silver?.totalWeight || 0}g · {d.silver?.count || 0} items</Text>
            {d.silver?.profitLoss != null && (
              <Text style={{ color: d.silver.profitLoss >= 0 ? COLORS.income : COLORS.expense, fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 2 }}>
                {d.silver.profitLoss >= 0 ? '+' : ''}{formatNum(d.silver.profitLoss)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          {/* Land */}
          <TouchableOpacity style={[styles.assetTile, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Land')}>
            <View style={[styles.tileDot, { backgroundColor: '#00C896' }]} />
            <Text style={{ fontSize: 24 }}>🏡</Text>
            <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>Properties</Text>
            <Text style={[styles.tileAmount, { color: '#00C896' }]}>{formatNum(d.land?.currentValue || 0)}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>{d.land?.count || 0} properties</Text>
            {d.land?.appreciation != null && (
              <Text style={{ color: d.land.appreciation >= 0 ? COLORS.income : COLORS.expense, fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 2 }}>
                {d.land.appreciation >= 0 ? '+' : ''}{formatNum(d.land.appreciation)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Receivables */}
          <View style={[styles.assetTile, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.tileDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={{ fontSize: 24 }}>🤝</Text>
            <Text style={[styles.tileLabel, { color: colors.textTertiary }]}>Receivables</Text>
            <Text style={[styles.tileAmount, { color: '#4ECDC4' }]}>{formatNum(d.debts?.lent || 0)}</Text>
            <Text style={{ color: COLORS.expense, fontSize: FONT_SIZES.xs }}>Owes: {formatNum(d.debts?.owed || 0)}</Text>
          </View>
        </View>

        {/* Asset Distribution Bar */}
        {distribution.length > 0 && (
          <View style={{ marginTop: SPACING.xl }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Distribution</Text>
            <View style={[styles.distBar, { backgroundColor: colors.surfaceAlt }]}>
              {distribution.map((item, i) => {
                const pct = totalDistValue > 0 ? (item.value / totalDistValue) * 100 : 0;
                if (pct < 1) return null;
                return (
                  <View key={i} style={[styles.distSegment, { width: `${pct}%`, backgroundColor: item.color }]} />
                );
              })}
            </View>
            <View style={styles.distLegend}>
              {distribution.map((item, i) => {
                const pct = totalDistValue > 0 ? ((item.value / totalDistValue) * 100).toFixed(0) : 0;
                return (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.xs }}>{item.name} ({pct}%)</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly Trend */}
        {monthlyTrend.length > 0 && (
          <View style={{ marginTop: SPACING.xl }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Monthly Trend</Text>
            <View style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
              {monthlyTrend.map((m, i) => (
                <View key={i} style={styles.trendCol}>
                  <View style={styles.trendBars}>
                    <View style={[styles.trendBar, { height: Math.max((m.income / maxTrend) * 80, 4), backgroundColor: COLORS.income }]} />
                    <View style={[styles.trendBar, { height: Math.max((m.expense / maxTrend) * 80, 4), backgroundColor: COLORS.expense }]} />
                  </View>
                  <Text style={{ color: colors.textTertiary, fontSize: 9, marginTop: 4 }}>{m.month}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginTop: SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.income }} />
                <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Income</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.expense }} />
                <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Expense</Text>
              </View>
            </View>
          </View>
        )}

        {/* Financial Summary */}
        <View style={{ marginTop: SPACING.xl }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Financial Summary</Text>
          <View style={[styles.finCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            {[
              { label: 'Total Income', value: d.income?.total || 0, color: COLORS.income, icon: 'arrow-down-circle' },
              { label: 'Total Expenses', value: d.expense?.total || 0, color: COLORS.expense, icon: 'arrow-up-circle' },
              { label: 'Net Savings', value: d.savings || 0, color: (d.savings || 0) >= 0 ? COLORS.income : COLORS.expense, icon: 'wallet' },
              { label: 'Gold Investment', value: d.gold?.invested || 0, color: '#FFB020', icon: 'diamond' },
              { label: 'Silver Investment', value: d.silver?.invested || 0, color: '#8E8E93', icon: 'disc' },
              { label: 'Land Investment', value: d.land?.invested || 0, color: '#00C896', icon: 'home' },
            ].map((item, i, arr) => (
              <View key={i} style={[styles.finRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View style={[styles.finIcon, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '500' }}>{item.label}</Text>
                </View>
                <Text style={{ color: item.color, fontSize: FONT_SIZES.base, fontWeight: '700' }}>{formatNum(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: SPACING.xl }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 0 }]}>Quick Actions</Text>
          <View style={styles.actionRow}>
            {[
              { label: 'Add Metal', icon: '⚜️', color: '#FFB020', screen: 'Metals' },
              { label: 'Add Property', icon: '🏡', color: '#00C896', screen: 'Land' },
              { label: 'Accounts', icon: '🏦', color: '#6C63FF', screen: 'Accounts' },
            ].map((a, i) => (
              <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
                onPress={() => navigation.navigate(a.screen)}>
                <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                <Text style={{ color: a.color, fontSize: FONT_SIZES.xs, fontWeight: '700', marginTop: 4 }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: SPACING.xl, 
    paddingTop: 56, 
    paddingBottom: SPACING.base, 
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
  scroll: { padding: SPACING.xl },

  heroCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl, alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: 4 },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  heroRow: { flexDirection: 'row', marginTop: SPACING.md, width: '100%' },
  heroItem: { flex: 1, alignItems: 'center' },
  heroItemLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZES.xs, marginTop: 2 },
  heroItemVal: { color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '700' },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: SPACING.md },

  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: SPACING.xl, marginBottom: SPACING.md },

  gridRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  assetTile: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  tileDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  tileLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: SPACING.xs },
  tileAmount: { fontSize: FONT_SIZES.md, fontWeight: '800', marginTop: 2 },

  distBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  distSegment: { height: '100%' },
  distLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  trendCard: { flexDirection: 'row', justifyContent: 'space-around', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  trendCol: { alignItems: 'center' },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 80 },
  trendBar: { width: 8, borderRadius: 4, minHeight: 4 },

  finCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  finIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
});
