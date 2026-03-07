import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useDebts } from '../hooks/useDebts';
import { sendInstantNotification } from '../utils/notificationService';
import BalanceCard from '../components/BalanceCard';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import InsightSection from '../components/InsightSection';
import WelcomeBriefing from '../components/WelcomeBriefing';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { storage } from '../utils/storage';
import { requestNotificationPermissions, checkPermissionStatus } from '../utils/notificationService';
import { BANK_LIST } from '../constants/banks';
import { formatMonth, formatCurrencyShort, getPercentage } from '../utils/formatters';
import { useAppDrawer } from '../context/DrawerContext';

const { width } = Dimensions.get('window');
const SCREEN_PAD = SPACING.xl;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { summary, fetchSummary, loading } = useTransactions();
  const { alertBudgets, fetchBudgets } = useBudgets();
  const { fetchDebts } = useDebts();
  const { openDrawer } = useAppDrawer();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      fetchSummary({ month, year }),
      fetchBudgets({ month, year }),
      fetchDebts(), // This will trigger the notification sync
    ]);
  }, [month, year, fetchDebts]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const checkNotif = async () => {
      const savedStatus = await storage.getNotifPermission();
      // If null or pending, show the popup after a small delay
      if (!savedStatus || savedStatus === 'pending') {
        const deviceStatus = await checkPermissionStatus();
        if (deviceStatus !== 'granted') {
          setTimeout(() => setShowNotifModal(true), 2000);
        }
      }
    };
    checkNotif();
  }, []);

  useEffect(() => {
    const checkBriefing = async () => {
      const today = new Date().toDateString();
      const lastShown = await storage.getLastBriefing(user?._id);
      if (lastShown !== today) {
        // Show briefing after a short delay so it feels like a welcome message
        setTimeout(() => setShowBriefing(true), 1500);
      }
    };
    if (user) checkBriefing();
  }, [user]);

  const handleAllowNotif = async () => {
    const status = await requestNotificationPermissions();
    if (status === 'granted') {
      await storage.setNotifPermission('granted');
    }
    setShowNotifModal(false);
  };

  const handleDenyNotif = async () => {
    await storage.setNotifPermission('denied');
    setShowNotifModal(false);
  };

  const handleCloseNotif = async () => {
    await storage.setNotifPermission('pending');
    setShowNotifModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Pie chart data from category breakdown
  const pieData = summary?.categoryBreakdown
    ?.filter((c) => c.total > 0)
    ?.slice(0, 6)
    ?.map((c, i) => ({
      name: c.category?.name || 'Other',
      amount: c.total,
      color: c.category?.color || COLORS.chartColors[i % COLORS.chartColors.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    })) || [];

  if (loading && !refreshing) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />
      <WelcomeBriefing 
        visible={showBriefing} 
        onClose={async () => {
          setShowBriefing(false);
          await storage.setLastBriefing(user?._id, new Date().toDateString());
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openDrawer} style={{ marginRight: SPACING.md }}>
              <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{`Good ${getGreeting()} 👋`}</Text>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            {alertBudgets.length > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        {/* ── Balance Card ───────────────────────── */}
        <BalanceCard
          balance={summary?.balance ?? 0}
          income={summary?.monthly?.income ?? 0}
          expense={summary?.monthly?.expense ?? 0}
          month={formatMonth(now)}
        />

        <InsightSection />

        {/* ── Accounts List ──────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Accounts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={[styles.sectionLink, { color: COLORS.primary }]}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {summary?.accounts?.map((acc) => (
            <TouchableOpacity 
              key={acc._id} 
              style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
              onPress={() => navigation.navigate('Transactions', { account: acc._id })}
            >
              <View style={[styles.accIconBg, { backgroundColor: `${acc.color}18` }]}>
                {(() => {
                  const logoFromList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                  const displayLogo = acc.bankLogo || logoFromList;
                  
                  if (displayLogo) {
                    return (
                      <Image 
                        source={{ uri: displayLogo }} 
                        style={styles.logoImageSmall} 
                        resizeMode="contain"
                      />
                    );
                  }
                  return <Text style={styles.accIcon}>{acc.icon}</Text>;
                })()}
              </View>
              <View>
                <Text style={[styles.accName, { color: colors.textSecondary }]}>{acc.name}</Text>
                <Text style={[styles.accBalance, { color: colors.textPrimary }]}>₹{acc.balance.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Wealth Quick Access ──────────────────── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Wealth</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WealthDashboard')}>
            <Text style={[styles.sectionLink, { color: COLORS.primary }]}>Net Worth →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.md }}>
          {[
            { label: '⚜️ Metals', screen: 'Metals', color: '#FFB020' },
            { label: '🏡 Properties', screen: 'Land', color: '#00C896' },
            { label: '📈 Stocks & MF', screen: 'Investments', color: '#00A3FF' },
            { label: '💰 Net Worth', screen: 'WealthDashboard', color: '#6C63FF' },
          ].map((item, i) => (
            <TouchableOpacity key={i}
              style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.border, minWidth: 100, alignItems: 'center' }, SHADOWS.sm]}
              onPress={() => navigation.navigate(item.screen)}>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>{item.label.split(' ')[0]}</Text>
              <Text style={{ color: item.color, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>{item.label.split(' ').slice(1).join(' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Budget Alerts ──────────────────────── */}
        {alertBudgets.length > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: isDark ? 'rgba(255,176,32,0.12)' : COLORS.warningLight, borderColor: COLORS.warning }]}
            onPress={() => navigation.navigate('Budgets')}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={18} color={COLORS.warning} />
            <Text style={[styles.alertText, { color: COLORS.warning }]}>
              {alertBudgets.length} budget{alertBudgets.length > 1 ? 's' : ''} near or over limit!
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ──────────────────────── */}
        <View style={styles.quickActions}>
          {[
            { label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, type: 'expense' },
            { label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.income, type: 'income' },
            { label: 'Goals', icon: 'trophy', color: '#6C63FF', screen: 'Goals' },
            { label: 'Analysis', icon: 'bar-chart', color: '#FFB020', screen: 'Analysis' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
              onPress={() => {
                if (action.action === 'test') {
                  sendInstantNotification('🔔 Notification Working!', 'Your reminders will appear here directly in the notification bar.');
                } else if (action.type) {
                  navigation.navigate('AddTransaction', { type: action.type });
                } else {
                  navigation.navigate(action.screen);
                }
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Expense by Category Pie Chart ─────── */}
        {pieData.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <SectionHeader title="Spending by Category" onPress={() => navigation.navigate('Analysis')} />
            <PieChart
              data={pieData}
              width={width - SCREEN_PAD * 2 - SPACING.xl * 2}
              height={180}
              chartConfig={{
                color: () => colors.textPrimary,
                labelColor: () => colors.textSecondary,
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              center={[0, 0]}
              hasLegend
              absolute={false}
            />
          </View>
        )}

        {/* ── This Month Stats ───────────────────── */}
        <View style={styles.monthlyStats}>
          <StatCard
            label="Income"
            value={formatCurrencyShort(summary?.monthly?.income ?? 0)}
            count={summary?.monthly?.incomeCount ?? 0}
            color={COLORS.income}
            icon="arrow-down-circle"
            bg={colors.surface}
            border={colors.border}
          />
          <StatCard
            label="Expenses"
            value={formatCurrencyShort(summary?.monthly?.expense ?? 0)}
            count={summary?.monthly?.expenseCount ?? 0}
            color={COLORS.expense}
            icon="arrow-up-circle"
            bg={colors.surface}
            border={colors.border}
          />
        </View>

        {/* ── Data Management Quick Access ────────── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
        </View>
        <View style={styles.dataMgmtRow}>
          <TouchableOpacity 
            style={[styles.dataBlock, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Categories')}
          >
            <View style={[styles.dataIcon, { backgroundColor: `${COLORS.primary}12` }]}>
              <Ionicons name="grid" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.dataLabel, { color: colors.textPrimary }]}>Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dataBlock, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
            onPress={() => navigation.navigate('Categories')}
          >
            <View style={[styles.dataIcon, { backgroundColor: `${COLORS.primary}12` }]}>
              <Ionicons name="card" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.dataLabel, { color: colors.textPrimary }]}>Payments</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent Transactions ────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <SectionHeader
            title="Recent Transactions"
            onPress={() => navigation.navigate('Transactions')}
          />
          {summary?.recentTransactions?.length > 0 ? (
            summary.recentTransactions.map((txn) => (
              <TransactionItem
                key={txn._id}
                transaction={txn}
                onPress={() => navigation.navigate('TransactionDetail', { transaction: txn })}
              />
            ))
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              subtitle="Add your first transaction to get started"
            />
          )}
        </View>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      <NotificationPermissionModal
        isVisible={showNotifModal}
        onAllow={handleAllowNotif}
        onDeny={handleDenyNotif}
        onClose={handleCloseNotif}
      />

    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────
const SectionHeader = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <View style={sectionHeaderStyles.row}>
      <Text style={[sectionHeaderStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={[sectionHeaderStyles.action, { color: COLORS.primary }]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const sectionHeaderStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  action: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
});

const StatCard = ({ label, value, count, color, icon, bg, border }) => (
  <View style={[statStyles.card, { backgroundColor: bg, borderColor: border }, SHADOWS.sm]}>
    <View style={[statStyles.icon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={statStyles.count}>{count} transactions</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    marginHorizontal: SPACING.xs / 2,
    alignItems: 'flex-start',
  },
  icon: { width: 40, height: 40, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  value: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: FONT_SIZES.sm, color: '#9CA3AF', fontWeight: '600' },
  count: { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 2 },
});

// ─── Helper ────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SCREEN_PAD, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xl },
  greeting: { fontSize: FONT_SIZES.sm, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: FONT_SIZES['3xl'], fontWeight: '800', letterSpacing: -0.5 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.expense,
  },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1,
    marginBottom: SPACING.base,
  },
  alertText: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, marginBottom: SPACING.xl,
  },
  quickBtn: {
    width: (width - SCREEN_PAD * 2 - SPACING.sm * 3) / 4,
    borderRadius: RADIUS.md, borderWidth: 1,
    padding: SPACING.sm, alignItems: 'center', gap: SPACING.xs,
  },
  quickIcon: { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  section: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: SPACING.base + 2, marginBottom: SPACING.base,
  },
  monthlyStats: { flexDirection: 'row', marginBottom: SPACING.base, marginHorizontal: -SPACING.xs / 2 },
  dataMgmtRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  dataBlock: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dataIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dataLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, marginTop: SPACING.base },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  sectionLink: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  accountsScroll: { marginHorizontal: -SCREEN_PAD, marginBottom: SPACING.lg },
  accountsScrollContent: { paddingHorizontal: SCREEN_PAD, gap: SPACING.sm },
  accCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: width * 0.45,
  },
  accIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f8f9fa' },
  logoImageSmall: { width: 24, height: 24 },
  accIcon: { fontSize: 18 },
  accName: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});
