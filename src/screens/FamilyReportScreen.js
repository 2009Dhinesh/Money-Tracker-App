import React, { useState, useEffect, useCallback } from 'react'; // Trigger re-save 1
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Dimensions, RefreshControl, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import familyApi from '../api/familyApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FamilyReportScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useAlert();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      const res = await familyApi.getFamilyReport();
      if (res.success) {
        setReport(res.report);
      }
    } catch (err) {
      console.error('Fetch family report error:', err);
      showAlert('Error', 'Failed to load family report data.', [], 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  if (loading && !refreshing) return <LoadingSpinner message="Generating report..." />;

  const pieData = report?.categoryBreakdown?.map(item => ({
    name: item.category.name,
    amount: item.total,
    color: item.category.color || COLORS.primary,
    legendFontColor: colors.textSecondary,
    legendFontSize: 10,
  })) || [];

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Family Insights</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Net Flow Summary */}
        <LinearGradient
          colors={isDark ? ['#1e1e2e', '#161625'] : ['#6C63FF', '#4B45CC']}
          style={[styles.summaryCard, SHADOWS.md]}
        >
          <Text style={styles.summaryLabel}>Total Family Balance</Text>
          <Text style={styles.summaryValue}>₹{report?.totalBalance?.toFixed(2)}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={16} color={COLORS.income} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.itemLabel}>Monthly Income</Text>
                <Text style={styles.itemValue}>+₹{report?.income?.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-down" size={16} color="#FF6B6B" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.itemLabel}>Monthly Expense</Text>
                <Text style={styles.itemValue}>-₹{report?.expense?.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Category Spending Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SPENDING BY CATEGORY</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={SCREEN_WIDTH - SPACING.xl * 4}
                height={200}
                chartConfig={chartConfig}
                accessor={"amount"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={48} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, marginTop: SPACING.md }}>No spending data for this month.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Member Contributions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SPENDING BY MEMBER</Text>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
            {report?.memberContributions?.length > 0 ? (
              report.memberContributions.map(item => {
                const isMe = item.user?._id?.toString() === user?._id?.toString();
                return (
                  <View key={item.user._id} style={styles.statRowContainer}>
                    <View style={styles.statRow}>
                      <View style={[styles.memberAvatar, { backgroundColor: isMe ? COLORS.income : `${COLORS.primary}15` }]}>
                        <Text style={[styles.avatarText, { color: isMe ? '#fff' : COLORS.primary }]}>{item.user.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: SPACING.md }}>
                        <View style={styles.labelRow}>
                          <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                            {item.user.name} {isMe && <Text style={{ color: COLORS.income, fontSize: 10 }}>(YOU)</Text>}
                          </Text>
                          <Text style={[styles.memberAmount, { color: colors.textPrimary }]}>₹{item.total.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${(item.total / (report.expense || 1)) * 100}%`,
                                backgroundColor: isMe ? COLORS.income : COLORS.primary 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                    
                    {/* Account Breakdown */}
                    {item.accountsBreakdown?.length > 0 && (
                      <View style={styles.breakdownContainer}>
                        {item.accountsBreakdown.map((acc, idx) => (
                          <View key={idx} style={styles.breakdownRow}>
                            <View style={styles.breakdownDot} />
                            <Text style={[styles.breakdownName, { color: colors.textSecondary }]}>{acc.name}</Text>
                            <Text style={[styles.breakdownAmount, { color: colors.textSecondary }]}>₹{acc.total.toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: colors.textTertiary, padding: SPACING.lg }}>No member contributions tracked.</Text>
            )}
          </View>
        </View>

        {/* Shared Accounts Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="apps-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Tracking {report?.sharedAccountCount} shared accounts across the family.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  headerIcon: { padding: 4 },
  scroll: { padding: SPACING.xl },
  summaryCard: {
    padding: SPACING.xl, borderRadius: RADIUS.xl, marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: SPACING.xs },
  summaryRow: { 
    flexDirection: 'row', width: '100%', justifyContent: 'space-around', 
    marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: SPACING.lg
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center' },
  itemLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  itemValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 10, fontWeight: '800', marginBottom: SPACING.md, letterSpacing: 1 },
  chartCard: { padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  statsCard: { padding: SPACING.md, borderRadius: RADIUS.lg },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  memberName: { fontSize: 13, fontWeight: '700' },
  memberAmount: { fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, width: '100%' },
  progressBarFill: { height: 6, borderRadius: 3 },
  statRowContainer: { marginBottom: SPACING.lg },
  breakdownContainer: {
    marginLeft: 36 + SPACING.md,
    marginTop: 8,
    paddingLeft: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginRight: 8,
  },
  breakdownName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  breakdownAmount: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyChart: { padding: SPACING.xl, alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  infoText: { fontSize: 11, fontWeight: '600' }
});
