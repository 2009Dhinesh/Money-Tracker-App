import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions, Image, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import { useDebts } from '../hooks/useDebts';
import { useCategories } from '../hooks/useCategories';
import { sendInstantNotification } from '../utils/notificationService';
import BalanceCard from '../components/BalanceCard';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import InsightSection from '../components/InsightSection';
import WelcomeBriefing from '../components/WelcomeBriefing';
import Button from '../components/Button';
import Input from '../components/Input';
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
  const { summary, fetchSummary, loading, addTransaction } = useTransactions();
  const { alertBudgets, fetchBudgets } = useBudgets();
  const { fetchDebts } = useDebts();
  const { categories, fetchCategories } = useCategories();
  const { openDrawer } = useAppDrawer();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [incomeReminderVisible, setIncomeReminderVisible] = useState(false);
  const [currentReminderIncome, setCurrentReminderIncome] = useState(null);
  const [reminderAmount, setReminderAmount] = useState('');
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      fetchSummary({ month, year }),
      fetchBudgets({ month, year }),
      fetchDebts(), // This will trigger the notification sync
      fetchCategories(),
    ]);
  }, [month, year, fetchDebts, fetchSummary, fetchBudgets, fetchCategories]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const checkExpectedIncomes = async () => {
      if (!user?.expectedIncomes || user.expectedIncomes.length === 0) return;
      
      const today = new Date();
      const todayDay = today.getDate();
      
      const dueIncomes = user.expectedIncomes.filter(inc => inc.expectedDate === todayDay);
      if (dueIncomes.length === 0) return;
      
      for (const income of dueIncomes) {
        const cacheKey = `income_prompt_${user._id}_${income._id}_${today.toDateString()}`;
        const hasPrompted = await AsyncStorage.getItem(cacheKey);
        
        if (!hasPrompted) {
          setCurrentReminderIncome(income);
          setReminderAmount(income.amount.toString());
          setTimeout(() => setIncomeReminderVisible(true), 1500);
          break; // Show one at a time
        }
      }
    };
    if (user) checkExpectedIncomes();
  }, [user]);

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

  useEffect(() => {
    // Show budget alert popup once per session if there are alerts
    if (alertBudgets.length > 0) {
      const checkBudgetAlert = async () => {
        const today = new Date().toDateString();
        const lastShown = await AsyncStorage.getItem(`budget_alert_${today}`);
        if (!lastShown) {
           setTimeout(() => setShowBudgetAlert(true), 2000); // Show shortly after briefing
        }
      };
      checkBudgetAlert();
    }
  }, [alertBudgets]);

  useEffect(() => {
    // Show budget alert popup once per session if there are alerts
    if (alertBudgets.length > 0) {
      const checkBudgetAlert = async () => {
        const today = new Date().toDateString();
        const lastShown = await AsyncStorage.getItem(`budget_alert_${today}`);
        if (!lastShown) {
           setTimeout(() => setShowBudgetAlert(true), 2000); // Show shortly after briefing
        }
      };
      checkBudgetAlert();
    }
  }, [alertBudgets]);

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
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 42, height: 42, borderRadius: 21 }} />
            ) : (
              <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Balance Card ───────────────────────── */}
        <BalanceCard
          balance={summary?.balance ?? 0}
          otherPersonsTotal={summary?.otherPersonsTotal ?? 0}
          income={summary?.monthly?.income ?? 0}
          expense={summary?.monthly?.expense ?? 0}
          incomeCount={summary?.monthly?.incomeCount ?? 0}
          expenseCount={summary?.monthly?.expenseCount ?? 0}
          month={formatMonth(now)}
        />

        <InsightSection />

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
        
        {/* ── Accounts List ──────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Accounts {summary?.accounts?.length > 0 ? `(${summary.accounts.length})` : ''}</Text>
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
              onPress={() => navigation.navigate('AccountDetail', { accountId: acc._id })}
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Wealth (4)</Text>
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

        {/* ── Quick Actions ──────────────────────── */}
        <View style={styles.quickActions}>
          {[
            { label: 'Debts', icon: 'people', color: COLORS.expense, screen: 'Debts' },
            { label: 'Investment', icon: 'trending-up', color: COLORS.income, screen: 'Investments' },
            { label: 'Goals', icon: 'trophy', color: '#6C63FF', screen: 'Goals' },
            { label: 'Categories', icon: 'grid', color: '#FFB020', screen: 'Categories' },
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

      {/* Expected Income Reminder Modal */}
      <Modal visible={incomeReminderVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Income Reminder</Text>
              <TouchableOpacity onPress={async () => {
                const today = new Date().toDateString();
                const cacheKey = `income_prompt_${user._id}_${currentReminderIncome?._id}_${today}`;
                await AsyncStorage.setItem(cacheKey, 'dismissed');
                setIncomeReminderVisible(false);
              }}>
                <Ionicons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ fontSize: FONT_SIZES.base, color: colors.textSecondary, lineHeight: 22 }}>
                Today is your expected <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{currentReminderIncome?.incomeType === 'Other' ? currentReminderIncome?.customIncomeType : currentReminderIncome?.incomeType}</Text> date. 
                Your expected income is <Text style={{ fontWeight: 'bold', color: COLORS.income }}>₹{currentReminderIncome?.amount?.toLocaleString()}</Text>. 
                Please confirm or adjust the amount received to add it to your transactions.
              </Text>
            </View>
            <Input
              label="Amount Received (₹)"
              value={reminderAmount}
              onChangeText={setReminderAmount}
              keyboardType="numeric"
              icon="cash-outline"
            />
            <Button
              title="Confirm & Add Income"
              onPress={async () => {
                const amountVal = parseFloat(reminderAmount);
                if (isNaN(amountVal) || amountVal <= 0) {
                  return Alert.alert('Invalid', 'Please enter a valid amount.');
                }
                try {
                  const incomeName = currentReminderIncome?.incomeType === 'Other' ? currentReminderIncome?.customIncomeType : currentReminderIncome?.incomeType;
                  let targetCat = categories.find(c => c.type === 'income' && c.name.toLowerCase() === incomeName.toLowerCase());
                  if (!targetCat) {
                     targetCat = categories.find(c => c.type === 'income');
                  }
                  
                  await addTransaction({
                    type: 'income',
                    amount: amountVal,
                    title: `${incomeName} Received`,
                    description: 'Automatically logged from expected income reminder',
                    category: targetCat?._id,
                    account: currentReminderIncome?.accountId,
                    date: new Date().toISOString()
                  });
                  
                  const today = new Date().toDateString();
                  const cacheKey = `income_prompt_${user._id}_${currentReminderIncome?._id}_${today}`;
                  await AsyncStorage.setItem(cacheKey, 'completed');
                  
                  setIncomeReminderVisible(false);
                  Alert.alert('✅ Success', 'Income added to your account!');
                  load(); // Refresh summary dashboard
                } catch (err) {
                  Alert.alert('Error', err.message || 'Failed to add income.');
                }
              }}
            />
          </View>
        </View>
      </Modal>

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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting: { fontSize: FONT_SIZES.sm, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: FONT_SIZES['3xl'], fontWeight: '800', letterSpacing: -0.5 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative',
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
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
});
