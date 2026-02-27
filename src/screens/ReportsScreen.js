import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { format, addMonths, addYears, addDays, startOfMonth, startOfYear } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { getShortMonth, formatCurrencyShort, formatCurrency } from '../utils/formatters';
import { useAppDrawer } from '../context/DrawerContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const CHART_W = width - SPACING.xl * 2 - SPACING.xl; // inside card padding

export default function ReportsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { transactions, summary, report, loading, fetchSummary, fetchReport, fetchTransactions } = useTransactions();
  const { openDrawer } = useAppDrawer();
  
  const now = new Date();
  const [mode, setMode] = useState('day'); // 'day', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(now);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const showPicker = () => {
    setShowDatePicker(true);
  };

  const load = useCallback(async () => {
    let summaryParams = {};
    if (mode === 'day') {
      summaryParams = { date: format(selectedDate, 'yyyy-MM-dd') };
    } else if (mode === 'month') {
      summaryParams = { month: selectedDate.getMonth() + 1, year: selectedDate.getFullYear() };
    } else {
      summaryParams = { year: selectedDate.getFullYear() };
    }

    await Promise.all([
      fetchSummary(summaryParams),
      fetchReport({ year: selectedDate.getFullYear() }),
      fetchTransactions({ limit: 500 }),
    ]);
  }, [mode, selectedDate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(130, 70, 255, ${opacity})`,
    labelColor: (opacity = 1) => colors.textTertiary,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: COLORS.primary },
    barPercentage: 0.6,
  };

  // Prepare Bar Data
  const barMonths = report?.slice(0, 6) || [];
  const barData = {
    labels: barMonths.map((m) => getShortMonth(m.month)),
    datasets: [
      { data: barMonths.map((m) => m.income || 0), color: () => COLORS.income },
      { data: barMonths.map((m) => m.expense || 0), color: () => COLORS.expense },
    ],
  };

  // Prepare Line Data
  const netData = barMonths.map((m) => (m.income || 0) - (m.expense || 0));
  const lineData = {
    labels: barMonths.map((m) => getShortMonth(m.month)),
    datasets: [{ data: netData }],
  };

  // Prepare Pie Data
  const pieColors = ['#8246FF', '#00C896', '#FF4B4B', '#FFB020', '#20B2FF', '#FF69B4'];
  const pieData = (summary?.categoryBreakdown || []).slice(0, 6).map((c, i) => ({
    name: c.category?.name || 'Other',
    amount: c.total,
    color: pieColors[i % pieColors.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const totalExpense = summary?.totalExpense || 0;

  if (loading && !refreshing) return <LoadingSpinner message="Analysing data..." />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} style={{ marginRight: SPACING.md }}>
            <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Analysis</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.exportBtn, { backgroundColor: `${COLORS.primary}15` }]} 
            onPress={() => navigation.navigate('Export')}
          >
            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode & Date Selection */}
      <View style={[styles.periodBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.modeToggle, { backgroundColor: colors.surfaceAlt }]}>
          {['day', 'month', 'year'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && { backgroundColor: colors.surface, ...SHADOWS.sm }]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeBtnText, { color: mode === m ? COLORS.primary : colors.textTertiary }]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => {
            if (mode === 'day') setSelectedDate(d => addDays(d, -1));
            else if (mode === 'month') setSelectedDate(d => addMonths(d, -1));
            else setSelectedDate(d => addYears(d, -1));
          }}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={showPicker}
            style={{ paddingVertical: 4, paddingHorizontal: 12 }}
          >
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>
              {mode === 'day' ? format(selectedDate, 'dd MMM yyyy') :
               mode === 'month' ? format(selectedDate, 'MMMM yyyy') :
               format(selectedDate, 'yyyy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            const next = mode === 'day' ? addDays(selectedDate, 1) :
                         mode === 'month' ? addMonths(selectedDate, 1) :
                         addYears(selectedDate, 1);
            if (next <= now) setSelectedDate(next);
          }}>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={selectedDate >= (mode === 'day' ? now : (mode === 'month' ? startOfMonth(now) : startOfYear(now))) ? colors.textTertiary : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Saving Duration Card */}
        {(summary?.firstTransactionDate || summary?.userCreatedAt) && (
          <View style={[styles.durationCard, { backgroundColor: COLORS.primary, borderColor: colors.border }, SHADOWS.md]}>
            <View style={styles.durationIconBox}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.durationLabel}>
                Saving Since {format(new Date(summary.firstTransactionDate || summary.userCreatedAt), 'MMM yyyy')}
              </Text>
              <Text style={styles.durationValue}>
                {(() => {
                  const startDate = summary.firstTransactionDate || summary.userCreatedAt;
                  const start = new Date(startDate);
                  start.setHours(0, 0, 0, 0);
                  const end = new Date();
                  end.setHours(0, 0, 0, 0);
                  
                  const diffTime = Math.abs(end - start);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let years = end.getFullYear() - start.getFullYear();
                  let months = end.getMonth() - start.getMonth();
                  if (months < 0) {
                    years--;
                    months += 12;
                  }
                  
                  if (diffDays === 0) return 'Just started your saving journey today! 🚀';
                  if (diffDays < 30) return `You've been saving for ${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}! 👏`;
                  
                  const parts = [];
                  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
                  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
                  return `You've been saving for ${parts.join(' & ')}`;
                })()}
              </Text>
            </View>
          </View>
        )}

        {/* Monthly Savings Performance Card */}
        {mode === 'month' && summary?.totalIncome > 0 && (
          <View style={[styles.savingsCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={styles.savingsHeader}>
              <View style={[styles.savingsIcon, { backgroundColor: `${COLORS.income}15` }]}>
                <Ionicons name="pie-chart" size={20} color={COLORS.income} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.savingsTitle, { color: colors.textPrimary }]}>Monthly Savings Status</Text>
                <Text style={[styles.savingsSubtitle, { color: colors.textTertiary }]}>Based on your income this month</Text>
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsPercent}>
                  {Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.savingsProgressContainer}>
              <View style={[styles.savingsProgressBar, { backgroundColor: colors.surfaceAlt }]}>
                <View 
                  style={[
                    styles.savingsProgressFill, 
                    { 
                      width: `${Math.min(Math.max(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100, 0), 100)}%`,
                      backgroundColor: (summary.totalIncome - summary.totalExpense) / summary.totalIncome > 0.3 ? COLORS.income : COLORS.primary 
                    }
                  ]} 
                />
              </View>
              <View style={styles.savingsLabels}>
                <Text style={[styles.savingsLabelText, { color: colors.textTertiary }]}>Expenses: {formatCurrencyShort(summary.totalExpense)}</Text>
                <Text style={[styles.savingsLabelText, { color: COLORS.income, fontWeight: '700' }]}>Saved: {formatCurrencyShort(summary.totalIncome - summary.totalExpense)}</Text>
              </View>
            </View>

            <View style={[styles.savingsMessage, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons 
                name={(summary.totalIncome - summary.totalExpense) / summary.totalIncome > 0.2 ? "happy-outline" : "information-circle-outline"} 
                size={16} 
                color={COLORS.primary} 
              />
              <Text style={[styles.savingsMessageText, { color: colors.textSecondary }]}>
                {(summary.totalIncome - summary.totalExpense) / summary.totalIncome > 0.4 
                  ? "Semma da! You saved a huge portion of your salary! 💰" 
                  : (summary.totalIncome - summary.totalExpense) / summary.totalIncome > 0.2
                  ? "Great! You are maintaining a healthy saving habit. 📈"
                  : "Try to keep your expenses low to save more this month. 💪"}
              </Text>
            </View>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Income', value: summary?.totalIncome || 0, color: COLORS.income, icon: 'arrow-down-circle' },
            { label: 'Expense', value: summary?.totalExpense || 0, color: COLORS.expense, icon: 'arrow-up-circle' },
            { label: 'Saving', value: (summary?.totalIncome || 0) - (summary?.totalExpense || 0), color: COLORS.primary, icon: 'wallet' },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            >
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.summaryValue, { color: s.color }]}>
                {formatCurrencyShort(s.value)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Charts & Lists */}
        {mode !== 'day' && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Income vs Expense</Text>
            <BarChart
              data={barData}
              width={CHART_W}
              height={220}
              chartConfig={chartConfig}
              style={{ borderRadius: RADIUS.md, marginTop: SPACING.sm }}
              showBarTops
              fromZero
            />
          </View>
        )}

        {pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Spending Distribution</Text>
            <PieChart
              data={pieData}
              width={CHART_W}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Exepense Breakdown</Text>
          <View style={{ marginTop: SPACING.md }}>
            {summary?.categoryBreakdown?.length > 0 ? (
              summary.categoryBreakdown.map((c, i) => (
                <View key={i} style={[styles.catRow, { borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }]}>
                  <Text style={styles.catIcon}>{c.category?.icon || '💰'}</Text>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>{c.category?.name || 'Other'}</Text>
                    <Text style={[styles.catCount, { color: colors.textTertiary }]}>{c.count} transactions</Text>
                  </View>
                  <Text style={[styles.catAmount, { color: COLORS.expense }]}>{formatCurrency(c.total)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data for this period</Text>
              </View>
            )}
          </View>
        </View>

        {mode === 'year' && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Yearly Savings Trend</Text>
            <LineChart
              data={lineData}
              width={CHART_W}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: RADIUS.md, marginTop: SPACING.sm }}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          onChange={onDateChange}
          maximumDate={now}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base,
    borderBottomWidth: 1,
  },
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  exportBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBar: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.full,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  scroll: { padding: SPACING.xl },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  summaryCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 16, fontWeight: '800', marginVertical: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  chartCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  catIcon: { fontSize: 20 },
  catName: { fontSize: 14, fontWeight: '700' },
  catCount: { fontSize: 11, fontWeight: '500' },
  catAmount: { fontSize: 14, fontWeight: '800' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  durationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  savingsCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  savingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  savingsSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  savingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.income}15`,
  },
  savingsPercent: {
    color: COLORS.income,
    fontSize: 14,
    fontWeight: '800',
  },
  savingsProgressContainer: {
    marginBottom: SPACING.md,
  },
  savingsProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  savingsProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  savingsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savingsLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  savingsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  savingsMessageText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
