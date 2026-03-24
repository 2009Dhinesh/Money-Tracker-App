import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInvestments } from '../hooks/useInvestments';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const TYPES = [
  { label: 'Stock', value: 'stock', icon: 'trending-up' },
  { label: 'Crypto', value: 'crypto', icon: 'logo-bitcoin' },
  { label: 'MF', value: 'mutual_fund', icon: 'stats-chart' },
  { label: 'Bond', value: 'bond', icon: 'document-text' },
];

export default function InvestmentsScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { investments, loading, fetchInvestments, addInvestment, removeInvestment, editInvestment } = useInvestments();

  const { alert: showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('stock');
  const [units, setUnits] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  useEffect(() => {
    if (route?.params?.editInvestment) {
      openFormModal(route.params.editInvestment);
      navigation.setParams({ editInvestment: undefined });
    }
  }, [route?.params?.editInvestment]);

  const openFormModal = (inv = null) => {
    if (inv) {
      setEditingId(inv._id);
      setName(inv.name);
      setSymbol(inv.symbol || '');
      setType(inv.type);
      setUnits(String(inv.units));
      setBuyPrice(String(inv.buyPrice));
      setCurrentPrice(inv.currentPrice ? String(inv.currentPrice) : '');
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInvestments();
    setRefreshing(false);
  }, [fetchInvestments]);

  const handleSave = async () => {
    if (!name || !units || !buyPrice) return showAlert('Error', 'Please fill all required fields', [], 'warning');
    
    try {
      const payload = {
        name,
        symbol,
        type,
        units: parseFloat(units),
        buyPrice: parseFloat(buyPrice),
        currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(buyPrice),
      };

      if (editingId) {
        await editInvestment(editingId, payload);
      } else {
        await addInvestment(payload);
      }
      setModalVisible(false);
      resetForm();
    } catch (err) {
      showAlert('Error', err.message, [], 'error');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSymbol('');
    setType('stock');
    setUnits('');
    setBuyPrice('');
    setCurrentPrice('');
  };

  const totalValue = investments.reduce((acc, inv) => acc + (inv.totalValue || 0), 0);
  const totalProfit = investments.reduce((acc, inv) => acc + (inv.profit || 0), 0);

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Investments</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={() => openFormModal(null)}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, SHADOWS.md]}>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Portfolio Value</Text>
          <Text style={[styles.summaryTotal, { color: '#fff' }]}>₹{totalValue.toLocaleString()}</Text>
          
          <View style={[styles.summaryProfitBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={totalProfit >= 0 ? 'caret-up' : 'caret-down'} size={14} color="#fff" />
            <Text style={[styles.summaryProfitText, { color: '#fff' }]}>
              {totalProfit >= 0 ? '+' : ''}₹{Math.abs(totalProfit).toLocaleString()} ({totalValue > 0 ? ((totalProfit / (totalValue - totalProfit || 1)) * 100).toFixed(2) : 0}%)
            </Text>
          </View>
        </View>
        {investments.length > 0 ? (
          investments.map((inv) => (
            <TouchableOpacity 
              key={inv._id} 
              style={[styles.invCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
              onPress={() => navigation.navigate('InvestmentDetail', { investment: inv })}
              onLongPress={() => {
                showAlert('Delete Investment', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeInvestment(inv._id) }
                ], 'warning');
              }}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typeIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name={TYPES.find(t => t.value === inv.type)?.icon || 'cube'} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invName, { color: colors.textPrimary }]}>{inv.name}</Text>
                  <Text style={[styles.invSymbol, { color: colors.textTertiary }]}>{inv.symbol || inv.type.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.invValue, { color: colors.textPrimary }]}>₹{inv.totalValue?.toLocaleString()}</Text>
                  <Text style={[styles.invUnits, { color: colors.textSecondary }]}>{inv.units} Units</Text>
                </View>
              </View>
              
              <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Avg. Buy</Text>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{inv.buyPrice.toLocaleString()}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Current</Text>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{(inv.currentPrice || inv.buyPrice).toLocaleString()}</Text>
                </View>
                <View style={[styles.metric, { alignItems: 'flex-end' }]}>
                  <Text style={styles.metricLabel}>Profit/Loss</Text>
                  <Text style={[styles.metricValue, { color: inv.profit >= 0 ? COLORS.income : COLORS.expense }]}>
                    {inv.profit >= 0 ? '+' : ''}{inv.profit?.toLocaleString()} ({inv.profitPercentage?.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState 
            icon="trending-up-outline" 
            title="No Investments Yet" 
            subtitle="Keep track of your stocks, crypto and more" 
          >
            <Button title="+ Set First Investment" onPress={() => openFormModal(null)} />
          </EmptyState>
        )}
      </ScrollView>


      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingId ? 'Edit Investment' : 'Add Investment'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeBtn,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      type === t.value && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    ]}
                    onPress={() => setType(t.value)}
                  >
                    <Ionicons name={t.icon} size={18} color={type === t.value ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.typeBtnText, { color: type === t.value ? '#fff' : colors.textSecondary }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Asset Name" value={name} onChangeText={setName} placeholder="e.g. Apple Inc or Bitcoin" />
              <Input label="Symbol (Optional)" value={symbol} onChangeText={setSymbol} placeholder="e.g. AAPL" autoCapitalize="characters" />
              
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Input label="Units" value={units} onChangeText={setUnits} keyboardType="numeric" style={{ flex: 1 }} />
                <Input label="Buy Price" value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" style={{ flex: 1 }} />
              </View>

              <Input label="Current Price (Optional)" value={currentPrice} onChangeText={setCurrentPrice} keyboardType="numeric" />

              <Button title={editingId ? 'Update Investment' : 'Save Investment'} onPress={handleSave} style={{ marginTop: SPACING.md }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS.primary}15` },
  
  summaryCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl, borderWidth: 1, alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.xs },
  summaryTotal: { fontSize: 36, fontWeight: '900', marginBottom: SPACING.md },
  summaryProfitBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, gap: 6 },
  summaryProfitText: { fontSize: FONT_SIZES.sm, fontWeight: '800' },

  scroll: { padding: SPACING.xl, paddingTop: SPACING.xl },
  invCard: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.base },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  invName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  invSymbol: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  invValue: { fontSize: FONT_SIZES.base, fontWeight: '800' },
  invUnits: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  cardBottom: { flexDirection: 'row', borderTopWidth: 1, paddingTop: SPACING.md },
  metric: { flex: 1 },
  metricLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  metricValue: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 40, right: SPACING.xl,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, gap: 4 },
  typeBtnText: { fontSize: 10, fontWeight: '700' },
});
