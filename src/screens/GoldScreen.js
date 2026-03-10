import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  StatusBar, Alert, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useGold } from '../hooks/useGold';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const GOLD_TYPES = [
  { label: 'Jewellery', value: 'jewellery', icon: '💍' },
  { label: 'Coin', value: 'coin', icon: '🪙' },
  { label: 'Bar', value: 'bar', icon: '📊' },
  { label: 'Digital', value: 'digital', icon: '📱' },
  { label: 'Other', value: 'other', icon: '✨' },
];

const PURITIES = ['24K', '22K', '18K', '14K'];

export default function GoldScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { assets, summary, livePrice, loading, fetchAssets, addAsset, removeAsset, calculate } = useGold();
  const { openDrawer } = useAppDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Add form
  const [gName, setGName] = useState('');
  const [gType, setGType] = useState('jewellery');
  const [gWeight, setGWeight] = useState('');
  const [gPurity, setGPurity] = useState('22K');
  const [gPrice, setGPrice] = useState('');
  const [gSource, setGSource] = useState('');
  const [gNote, setGNote] = useState('');

  // Calculator
  const [calcAmount, setCalcAmount] = useState('');
  const [calcPurity, setCalcPurity] = useState('22K');
  const [calcResult, setCalcResult] = useState(null);

  useFocusEffect(useCallback(() => { fetchAssets(); }, []));
  const onRefresh = async () => { setRefreshing(true); await fetchAssets(); setRefreshing(false); };

  const resetForm = () => {
    setGName(''); setGType('jewellery'); setGWeight(''); setGPurity('22K');
    setGPrice(''); setGSource(''); setGNote('');
  };

  const handleAdd = async () => {
    if (!gWeight || parseFloat(gWeight) <= 0) return Alert.alert('Error', 'Enter valid weight');
    if (!gPrice || parseFloat(gPrice) <= 0) return Alert.alert('Error', 'Enter purchase price');
    try {
      await addAsset({
        name: gName.trim() || 'Gold',
        type: gType,
        weightGrams: parseFloat(gWeight),
        purity: gPurity,
        purchasePrice: parseFloat(gPrice),
        source: gSource.trim(),
        note: gNote.trim(),
      });
      setShowAddModal(false);
      resetForm();
      Alert.alert('✅', 'Gold asset added!');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleCalc = async () => {
    if (!calcAmount || parseFloat(calcAmount) <= 0) return;
    try {
      const res = await calculate(calcAmount, calcPurity);
      setCalcResult(res);
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAsset(id) },
    ]);
  };

  if (loading && !refreshing && assets.length === 0) return <LoadingSpinner message="Loading gold assets..." />;

  const pricePerGram = livePrice?.price || 7200;
  const profitColor = (summary?.totalProfitLoss || 0) >= 0 ? COLORS.income : COLORS.expense;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gold Assets</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowCalcModal(true)} style={styles.headerActionBtn}>
            <Ionicons name="calculator-outline" size={24} color="#FFB020" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerActionBtn}>
            <Ionicons name="add" size={28} color="#FFB020" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB020" />}>

        {/* Live Price Banner */}
        <View style={[styles.priceBanner, { backgroundColor: isDark ? '#2A2520' : '#FFF8E7' }]}>
          <View style={styles.priceLeft}>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>Live Gold Rate (22K)</Text>
            <Text style={styles.priceValue}>₹{pricePerGram.toLocaleString()}<Text style={styles.priceUnit}>/gram</Text></Text>
          </View>
          
          <View style={styles.statusBadge}>
            <View style={[
              styles.liveDot, 
              { 
                backgroundColor: livePrice?.source === 'emergency-fallback' ? '#FF4757' : 
                               livePrice?.source === 'fallback' || livePrice?.source === 'database' ? '#FF9800' : 
                               '#00C896' 
              }
            ]}>
              <View style={styles.liveDotInner} />
            </View>
            <Text style={[styles.statusText, { color: colors.textTertiary }]}>
              {livePrice?.source === 'fallback' || livePrice?.source === 'database' ? 'Cached' : 
               livePrice?.source === 'emergency-fallback' ? 'Safety' : 'Live'}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FFB02015' }]}>
              <Text style={{ fontSize: 18 }}>⚖️</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Total Gold</Text>
            <Text style={[styles.summaryAmount, { color: '#FFB020' }]}>{summary?.totalWeight || 0}g</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Text style={{ fontSize: 18 }}>💰</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Invested</Text>
            <Text style={[styles.summaryAmount, { color: colors.textPrimary }]}>₹{(summary?.totalInvested || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${COLORS.income}15` }]}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Current Value</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.income }]}>₹{(summary?.totalCurrentValue || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${profitColor}15` }]}>
              <Text style={{ fontSize: 18 }}>{(summary?.totalProfitLoss || 0) >= 0 ? '🟢' : '🔴'}</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Profit/Loss</Text>
            <Text style={[styles.summaryAmount, { color: profitColor }]}>
              {(summary?.totalProfitLoss || 0) >= 0 ? '+' : ''}₹{(summary?.totalProfitLoss || 0).toLocaleString()}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: profitColor, fontWeight: '600' }}>
              {summary?.profitLossPercent || 0}%
            </Text>
          </View>
        </View>

        {/* Holdings List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Holdings ({summary?.count || 0})
        </Text>

        {assets.length === 0 ? (
          <EmptyState
            icon="diamond-outline"
            title="No gold holdings yet"
            subtitle="Tap + to add your first gold asset"
          >
            <Button title="+ Set First Gold" onPress={() => setShowAddModal(true)} />
          </EmptyState>
        ) : (
          assets.map(asset => {
            const pl = asset.profitLoss || 0;
            const plColor = pl >= 0 ? COLORS.income : COLORS.expense;
            const typeInfo = GOLD_TYPES.find(t => t.value === asset.type);
            return (
              <TouchableOpacity key={asset._id} style={[styles.assetCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
                onLongPress={() => handleDelete(asset._id, asset.name)}>
                <View style={styles.assetTop}>
                  <View style={styles.assetLeft}>
                    <View style={[styles.assetIcon, { backgroundColor: '#FFB02012' }]}>
                      <Text style={{ fontSize: 22 }}>{typeInfo?.icon || '🪙'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assetName, { color: colors.textPrimary }]}>{asset.name}</Text>
                      <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>
                        {asset.purity} · {asset.type} {asset.source ? `· ${asset.source}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.assetWeight, { color: '#FFB020' }]}>{asset.weightGrams}g</Text>
                    <View style={[styles.plBadge, { backgroundColor: `${plColor}15` }]}>
                      <Ionicons name={pl >= 0 ? 'trending-up' : 'trending-down'} size={10} color={plColor} />
                      <Text style={{ color: plColor, fontSize: 9, fontWeight: '700' }}>{asset.profitLossPercent}%</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.assetMeta, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Bought</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>₹{asset.purchasePrice.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Now</Text>
                    <Text style={{ color: COLORS.income, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>₹{asset.currentValue.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>P/L</Text>
                    <Text style={{ color: plColor, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>{pl >= 0 ? '+' : ''}₹{pl.toLocaleString()}</Text>
                  </View>
                </View>

                {asset.purchaseDate && (
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm }}>
                    📅 {new Date(asset.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* Add Gold Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Gold Asset</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Name (e.g., Wedding Chain)" placeholderTextColor={colors.textTertiary}
              value={gName} onChangeText={setGName} />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.chipGrid}>
              {GOLD_TYPES.map(t => (
                <TouchableOpacity key={t.value}
                  style={[styles.chip, { backgroundColor: gType === t.value ? '#FFB02022' : colors.surfaceAlt, borderColor: gType === t.value ? '#FFB020' : colors.border }]}
                  onPress={() => setGType(t.value)}>
                  <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: gType === t.value ? '#FFB020' : colors.textSecondary }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Weight (grams) *</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 22, fontWeight: '800' }]}
              placeholder="e.g., 10" placeholderTextColor={colors.textTertiary}
              value={gWeight} onChangeText={setGWeight} keyboardType="decimal-pad" />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purity</Text>
            <View style={styles.chipGrid}>
              {PURITIES.map(p => (
                <TouchableOpacity key={p}
                  style={[styles.chip, { backgroundColor: gPurity === p ? '#FFB02022' : colors.surfaceAlt, borderColor: gPurity === p ? '#FFB020' : colors.border }]}
                  onPress={() => setGPurity(p)}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: gPurity === p ? '#FFB020' : colors.textSecondary }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purchase Price (₹) *</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 22, fontWeight: '800' }]}
              placeholder="Total cost" placeholderTextColor={colors.textTertiary}
              value={gPrice} onChangeText={setGPrice} keyboardType="decimal-pad" />

            {gWeight && gPrice && (
              <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md }}>
                = ₹{(parseFloat(gPrice) / parseFloat(gWeight)).toFixed(0)}/gram
              </Text>
            )}

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Source (e.g., Tanishq, Local)" placeholderTextColor={colors.textTertiary}
              value={gSource} onChangeText={setGSource} />

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Note (optional)" placeholderTextColor={colors.textTertiary}
              value={gNote} onChangeText={setGNote} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FFB020' }]} onPress={handleAdd}>
              <Ionicons name="diamond" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>Save Gold Asset</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Calculator Modal */}
      <Modal visible={showCalcModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🧮 Gold Calculator</Text>
              <TouchableOpacity onPress={() => { setShowCalcModal(false); setCalcResult(null); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount (₹)</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 26, fontWeight: '800' }]}
              placeholder="Enter amount" placeholderTextColor={colors.textTertiary}
              value={calcAmount} onChangeText={(v) => { setCalcAmount(v); setCalcResult(null); }} keyboardType="decimal-pad" />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purity</Text>
            <View style={styles.chipGrid}>
              {PURITIES.map(p => (
                <TouchableOpacity key={p}
                  style={[styles.chip, { backgroundColor: calcPurity === p ? '#FFB02022' : colors.surfaceAlt, borderColor: calcPurity === p ? '#FFB020' : colors.border }]}
                  onPress={() => { setCalcPurity(p); setCalcResult(null); }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: calcPurity === p ? '#FFB020' : colors.textSecondary }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FFB020' }]} onPress={handleCalc}>
              <Ionicons name="calculator" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>Calculate</Text>
            </TouchableOpacity>

            {calcResult && (
              <View style={[styles.calcResult, { backgroundColor: isDark ? '#2A2520' : '#FFF8E7' }]}>
                <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm }}>For ₹{parseFloat(calcAmount).toLocaleString()} at {calcPurity}:</Text>
                <Text style={styles.calcGrams}>{calcResult.grams}g</Text>
                <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm }}>
                  Rate: ₹{calcResult.pricePerGram.toLocaleString()}/gram
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerRight: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.base,
    flexDirection: 'row', 
    gap: SPACING.sm,
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 2,
  },
  scroll: { padding: SPACING.xl },

  priceBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, borderRadius: RADIUS.lg, marginBottom: SPACING.xl },
  priceLeft: { flex: 1 },
  priceLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 2 },
  priceValue: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: '#FFB020' },
  priceUnit: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  summaryCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
  summaryLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 2 },
  summaryAmount: { fontSize: FONT_SIZES.md, fontWeight: '800' },

  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: SPACING.xl, marginBottom: SPACING.md },

  assetCard: { borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.md, borderWidth: 1 },
  assetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  assetLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: SPACING.sm },
  assetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  assetName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  assetWeight: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  plBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  assetMeta: { flexDirection: 'row', marginTop: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, marginVertical: 4 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: SPACING.md, marginBottom: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: SPACING['3xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.md, fontSize: FONT_SIZES.base },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg, marginTop: SPACING.md },
  calcResult: { alignItems: 'center', padding: SPACING.xl, borderRadius: RADIUS.lg, marginTop: SPACING.xl },
  calcGrams: { fontSize: 40, fontWeight: '900', color: '#FFB020', marginVertical: SPACING.sm },
});
