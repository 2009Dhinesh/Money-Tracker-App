import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  StatusBar, Alert, TextInput, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useMetals } from '../hooks/useMetals';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

const GOLD_COLOR = '#FFB020';
const SILVER_COLOR = '#8E8E93';

const METAL_TYPES = [
  { label: 'Gold', value: 'gold', icon: '🪙', color: GOLD_COLOR },
  { label: 'Silver', value: 'silver', icon: '🥈', color: SILVER_COLOR },
];

const ASSET_TYPES_GOLD = [
  { label: 'Jewellery', value: 'jewellery', icon: '💍' },
  { label: 'Coin', value: 'coin', icon: '🪙' },
  { label: 'Bar', value: 'bar', icon: '📊' },
  { label: 'Biscuit', value: 'biscuit', icon: '🧈' },
  { label: 'Digital', value: 'digital', icon: '📱' },
  { label: 'Other', value: 'other', icon: '✨' },
];

const ASSET_TYPES_SILVER = [
  { label: 'Jewellery', value: 'jewellery', icon: '💎' },
  { label: 'Coin', value: 'coin', icon: '🥈' },
  { label: 'Bar', value: 'bar', icon: '📊' },
  { label: 'Utensil', value: 'utensil', icon: '🍽️' },
  { label: 'Idol', value: 'idol', icon: '🕉️' },
  { label: 'Other', value: 'other', icon: '✨' },
];

const PURITIES_GOLD = ['24K', '22K', '18K', '14K'];
const PURITIES_SILVER = ['999', '925'];

const formatUpdateTime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return isToday ? `Today ${time}` : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${time}`;
};

export default function MetalsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { assets, summary, prices, dailyChange, history, loading, fetchAssets, fetchHistory, addAsset, updateAsset, removeAsset, calculate } = useMetals();
  const { openDrawer } = useAppDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [historyRange, setHistoryRange] = useState(7);

  // Add/Edit form
  const [mMetal, setMMetal] = useState('gold');
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState('jewellery');
  const [mWeight, setMWeight] = useState('');
  const [mPurity, setMPurity] = useState('22K');
  const [mPrice, setMPrice] = useState('');
  const [mSource, setMSource] = useState('');
  const [mNote, setMNote] = useState('');

  // Calculator
  const [calcAmount, setCalcAmount] = useState('');
  const [calcResult, setCalcResult] = useState(null);

  useFocusEffect(useCallback(() => {
    fetchAssets();
    fetchHistory(historyRange);
  }, [historyRange]));

  const onRefresh = async () => { setRefreshing(true); await fetchAssets(); await fetchHistory(historyRange); setRefreshing(false); };

  const resetForm = () => {
    setEditingId(null); setMMetal('gold'); setMName(''); setMType('jewellery');
    setMWeight(''); setMPurity('22K'); setMPrice(''); setMSource(''); setMNote('');
  };

  const openAddModal = (metal) => {
    resetForm();
    if (metal) { setMMetal(metal); setMPurity(metal === 'gold' ? '22K' : '999'); }
    setShowAddModal(true);
  };

  const openEditModal = (asset) => {
    setEditingId(asset._id);
    setMMetal(asset.metalType);
    setMName(asset.name);
    setMType(asset.type);
    setMWeight(asset.weightGrams.toString());
    setMPurity(asset.purity || (asset.metalType === 'gold' ? '22K' : '999'));
    setMPrice(asset.purchasePrice.toString());
    setMSource(asset.source || '');
    setMNote(asset.note || '');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!mWeight || parseFloat(mWeight) <= 0) return Alert.alert('Error', 'Enter valid weight');
    if (!mPrice || parseFloat(mPrice) <= 0) return Alert.alert('Error', 'Enter purchase price');
    try {
      const data = {
        metalType: mMetal, name: mName.trim() || (mMetal === 'gold' ? 'Gold' : 'Silver'),
        type: mType, weightGrams: parseFloat(mWeight), purity: mPurity,
        purchasePrice: parseFloat(mPrice), source: mSource.trim(), note: mNote.trim(),
      };
      if (editingId) {
        await updateAsset(editingId, data);
        Alert.alert('✅', 'Asset updated!');
      } else {
        await addAsset(data);
        Alert.alert('✅', `${mMetal === 'gold' ? 'Gold' : 'Silver'} asset added!`);
      }
      setShowAddModal(false); resetForm();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleCalc = async () => {
    if (!calcAmount || parseFloat(calcAmount) <= 0) return;
    try { setCalcResult(await calculate(calcAmount)); } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAsset(id) },
    ]);
  };

  const goldPrice = prices?.gold?.price22k || prices?.gold?.price24k || 0;
  const silverPrice = prices?.silver?.price999 || 0;
  const updatedAt = prices?.updatedAt;
  const priceSource = prices?.source || 'none';
  const isLive = priceSource && !priceSource.includes('fallback') && priceSource !== 'none' && priceSource !== 'offline-cache';
  const hasNoKey = priceSource === 'none' || (goldPrice === 0 && silverPrice === 0);

  const goldChange = dailyChange?.gold || { change: 0, changePercent: '0.0', direction: 'none' };
  const silverChange = dailyChange?.silver || { change: 0, changePercent: '0.0', direction: 'none' };

  const getChangeColor = (dir) => dir === 'up' ? '#00C896' : dir === 'down' ? '#FF4757' : '#8E8E93';
  const getChangeIcon = (dir) => dir === 'up' ? 'trending-up' : dir === 'down' ? 'trending-down' : 'remove';
  const getChangeArrow = (dir) => dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';

  const filteredAssets = filterType ? assets.filter(a => a.metalType === filterType) : assets;
  const currentAssetTypes = mMetal === 'gold' ? ASSET_TYPES_GOLD : ASSET_TYPES_SILVER;
  const currentPurities = mMetal === 'gold' ? PURITIES_GOLD : PURITIES_SILVER;
  const accentColor = mMetal === 'gold' ? GOLD_COLOR : SILVER_COLOR;

  const goldTrend = history?.gold || [];
  const silverTrend = history?.silver || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.backBtn}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>⚜️ Precious Metals</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity onPress={() => setShowCalcModal(true)} style={[styles.iconBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="calculator-outline" size={18} color={GOLD_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openAddModal()} style={[styles.iconBtn, { backgroundColor: GOLD_COLOR }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD_COLOR} />}>

        {hasNoKey && (
          <View style={[styles.apiWarning, { backgroundColor: isDark ? '#3A2A15' : '#FFF3E0' }]}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={{ color: '#FF9800', fontWeight: '700', fontSize: FONT_SIZES.sm }}>No API Key Configured</Text>
              <Text style={{ color: isDark ? '#FFB74D' : '#E65100', fontSize: 10, marginTop: 2 }}>
                Add a FREE API key in server/.env to get live rates.{"\n"}
                → metals.dev (recommended) | goldapi.io | metals-api.com
              </Text>
            </View>
          </View>
        )}

        <View style={styles.priceRow}>
          <View style={[styles.priceCard, { backgroundColor: isDark ? '#2A2520' : '#FFF8E7' }]}>
            <View style={styles.priceCardTop}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
              <View style={[styles.liveBadge, { backgroundColor: isLive ? '#00C89620' : priceSource === 'emergency-fallback' ? '#FF475720' : '#FF980020' }]}>
                <View style={[styles.liveDotSmall, { backgroundColor: isLive ? '#00C896' : priceSource === 'emergency-fallback' ? '#FF4757' : '#FF9800' }]} />
                <Text style={{ fontSize: 7, color: isLive ? '#00C896' : priceSource === 'emergency-fallback' ? '#FF4757' : '#FF9800', fontWeight: '800', letterSpacing: 0.5 }}>
                  {isLive ? 'LIVE' : priceSource === 'emergency-fallback' ? 'SAFETY' : 'CACHED'}
                </Text>
              </View>
            </View>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>Gold (22K)</Text>
            <Text style={[styles.priceValue, { color: GOLD_COLOR }]}>{goldPrice > 0 ? `₹${goldPrice.toLocaleString('en-IN')}` : '—'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 9 }}>per gram</Text>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: `${GOLD_COLOR}15`, borderRadius: 4 }}>
                <Text style={{ color: GOLD_COLOR, fontSize: 7, fontWeight: '800' }}>ORIGINAL RATE</Text>
              </View>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 8, fontWeight: '700', marginBottom: 6 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <View style={[styles.changeBadge, { backgroundColor: `${getChangeColor(goldChange.direction)}12` }]}>
              <Ionicons name={getChangeIcon(goldChange.direction)} size={10} color={getChangeColor(goldChange.direction)} />
              <Text style={[styles.changeText, { color: getChangeColor(goldChange.direction) }]}>
                {goldChange.change >= 0 ? '+' : ''}₹{goldChange.change} {getChangeArrow(goldChange.direction)}
              </Text>
            </View>
            <Text style={{ color: getChangeColor(goldChange.direction), fontSize: 9, fontWeight: '600', marginTop: 1 }}>
              {goldChange.changePercent > 0 ? '+' : ''}{goldChange.changePercent}%
            </Text>
            {goldTrend.length > 1 && (
              <View style={styles.miniTrendRow}>
                {(() => {
                  const rates = goldTrend.map(h => h.rate);
                  const min = Math.min(...rates);
                  const max = Math.max(...rates);
                  const range = max - min || 1;
                  return rates.slice(-7).map((r, i) => (
                    <View key={i} style={[styles.miniBar, {
                      height: Math.max(((r - min) / range) * 20 + 4, 4),
                      backgroundColor: i === rates.slice(-7).length - 1 ? GOLD_COLOR : `${GOLD_COLOR}50`,
                    }]} />
                  ));
                })()}
              </View>
            )}
          </View>

          <View style={[styles.priceCard, { backgroundColor: isDark ? '#222226' : '#F4F4F8' }]}>
            <View style={styles.priceCardTop}>
              <Text style={{ fontSize: 20 }}>🥈</Text>
              <View style={[styles.liveBadge, { backgroundColor: isLive ? '#00C89620' : '#FF980020' }]}>
                <View style={[styles.liveDotSmall, { backgroundColor: isLive ? '#00C896' : '#FF9800' }]} />
                <Text style={{ fontSize: 7, color: isLive ? '#00C896' : '#FF9800', fontWeight: '800', letterSpacing: 0.5 }}>{isLive ? 'LIVE' : 'OFFLINE'}</Text>
              </View>
            </View>
            <Text style={[styles.priceLabel, { color: colors.textTertiary }]}>Silver (999)</Text>
            <Text style={[styles.priceValue, { color: SILVER_COLOR }]}>{silverPrice > 0 ? `₹${silverPrice.toLocaleString('en-IN')}` : '—'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 9 }}>per gram</Text>
              <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: `${SILVER_COLOR}15`, borderRadius: 4 }}>
                <Text style={{ color: SILVER_COLOR, fontSize: 7, fontWeight: '800' }}>ORIGINAL RATE</Text>
              </View>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 8, fontWeight: '700', marginBottom: 6 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <View style={[styles.changeBadge, { backgroundColor: `${getChangeColor(silverChange.direction)}12` }]}>
              <Ionicons name={getChangeIcon(silverChange.direction)} size={10} color={getChangeColor(silverChange.direction)} />
              <Text style={[styles.changeText, { color: getChangeColor(silverChange.direction) }]}>
                {silverChange.change >= 0 ? '+' : ''}₹{silverChange.change} {getChangeArrow(silverChange.direction)}
              </Text>
            </View>
            <Text style={{ color: getChangeColor(silverChange.direction), fontSize: 9, fontWeight: '600', marginTop: 1 }}>
              {silverChange.changePercent > 0 ? '+' : ''}{silverChange.changePercent}%
            </Text>
            {silverTrend.length > 1 && (
              <View style={styles.miniTrendRow}>
                {(() => {
                  const rates = silverTrend.map(h => h.rate);
                  const min = Math.min(...rates);
                  const max = Math.max(...rates);
                  const range = max - min || 1;
                  return rates.slice(-7).map((r, i) => (
                    <View key={i} style={[styles.miniBar, {
                      height: Math.max(((r - min) / range) * 20 + 4, 4),
                      backgroundColor: i === rates.slice(-7).length - 1 ? SILVER_COLOR : `${SILVER_COLOR}50`,
                    }]} />
                  ));
                })()}
              </View>
            )}
          </View>
        </View>

        {updatedAt && (
          <View style={{ alignItems: 'center', marginTop: -SPACING.sm, marginBottom: SPACING.md }}>
            <Text style={{ color: colors.textTertiary, fontSize: 9, textAlign: 'center' }}>
              🔄 Updated: {formatUpdateTime(updatedAt)}
            </Text>
            <View style={[styles.sourceBadge, { backgroundColor: isLive ? '#00C89612' : priceSource === 'emergency-fallback' ? '#FF475712' : '#FF980012' }]}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isLive ? '#00C896' : priceSource === 'emergency-fallback' ? '#FF4757' : '#FF9800' }} />
              <Text style={{ color: isLive ? '#00C896' : priceSource === 'emergency-fallback' ? '#FF4757' : '#FF9800', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>
                {priceSource.replace(/-/g, ' ')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={{ fontSize: 16 }}>🪙</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Gold</Text>
            <Text style={[styles.summaryWeight, { color: GOLD_COLOR }]}>{summary?.gold?.totalWeight || 0}g</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>₹{(summary?.gold?.totalCurrentValue || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={{ fontSize: 16 }}>🥈</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Silver</Text>
            <Text style={[styles.summaryWeight, { color: SILVER_COLOR }]}>{summary?.silver?.totalWeight || 0}g</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>₹{(summary?.silver?.totalCurrentValue || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={{ fontSize: 16 }}>💰</Text>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Invested</Text>
            <Text style={[styles.summaryWeight, { color: colors.textPrimary }]}>₹{(summary?.combined?.totalInvested || 0).toLocaleString()}</Text>
            {summary?.combined?.totalProfitLoss != null && (
              <Text style={{ color: summary.combined.totalProfitLoss >= 0 ? COLORS.income : COLORS.expense, fontSize: 10, fontWeight: '700' }}>
                {summary.combined.totalProfitLoss >= 0 ? '+' : ''}₹{summary.combined.totalProfitLoss.toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {/* ── Trend Graph Section ────────────────── */}
        <View style={[styles.trendSection, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
          <View style={styles.trendHeader}>
            <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>Precious Metal Trends</Text>
            <View style={[styles.rangeToggle, { backgroundColor: colors.surfaceAlt }]}>
              {[
                { label: 'Weekly', value: 7 },
                { label: 'Monthly', value: 30 },
              ].map(r => (
                <TouchableOpacity 
                  key={r.value} 
                  style={[styles.rangeBtn, historyRange === r.value && { backgroundColor: GOLD_COLOR }]}
                  onPress={() => setHistoryRange(r.value)}
                >
                  <Text style={[styles.rangeBtnText, { color: historyRange === r.value ? '#fff' : colors.textSecondary }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {goldTrend.length > 1 || silverTrend.length > 1 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: (historyRange === 7 ? goldTrend : goldTrend.filter((_, i) => i % 5 === 0))
                    .map(h => h.date.split('-').slice(1).reverse().join('/')),
                  datasets: [
                    {
                      // Normalize to starting point (Percentage trend)
                      data: goldTrend.length > 0 ? (() => {
                        const start = goldTrend[0].rate22k || goldTrend[0].rate || 1;
                        return goldTrend.map(h => ((h.rate22k || h.rate) / start) * 100);
                      })() : [100],
                      color: (opacity = 1) => `rgba(255, 176, 32, ${opacity})`,
                      strokeWidth: 2,
                    },
                    {
                      // Normalize to starting point
                      data: silverTrend.length > 0 ? (() => {
                        const start = silverTrend[0].rate999 || silverTrend[0].rate || 1;
                        return silverTrend.map(h => ((h.rate999 || h.rate) / start) * 100);
                      })() : [100],
                      color: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
                      strokeWidth: 2,
                    }
                  ],
                  legend: ['Gold (22K)', 'Silver (999)']
                }}
                width={Dimensions.get('window').width - SPACING.xl * 4}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => colors.textPrimary,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '4', strokeWidth: '2', stroke: GOLD_COLOR },
                  propsForLabels: { fontSize: 10 },
                  formatYLabel: (y) => `${(parseFloat(y) - 100).toFixed(1)}%`,
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
              <View style={styles.chartFooter}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: GOLD_COLOR }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Gold trend (₹/g)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: SILVER_COLOR }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Silver trend (₹/g)</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noTrendContainer}>
              <Ionicons name="stats-chart-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>Collecting market data points...</Text>
            </View>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { label: 'All', value: '', icon: '⚜️' },
            { label: 'Gold', value: 'gold', icon: '🪙' },
            { label: 'Silver', value: 'silver', icon: '🥈' },
          ].map(f => (
            <TouchableOpacity key={f.value}
              style={[styles.filterChip, {
                backgroundColor: filterType === f.value ? (f.value === 'gold' ? `${GOLD_COLOR}22` : f.value === 'silver' ? `${SILVER_COLOR}22` : `${COLORS.primary}15`) : colors.surfaceAlt,
                borderColor: filterType === f.value ? (f.value === 'gold' ? GOLD_COLOR : f.value === 'silver' ? SILVER_COLOR : COLORS.primary) : colors.border,
              }]}
              onPress={() => setFilterType(f.value)}>
              <Text style={{ fontSize: 12 }}>{f.icon}</Text>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: filterType === f.value ? colors.textPrimary : colors.textSecondary }}>
                {f.label} ({f.value === '' ? assets.length : assets.filter(a => a.metalType === f.value).length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>⚜️</Text>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No holdings yet</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, textAlign: 'center' }}>
              Tap + to add gold or silver
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl }}>
              <TouchableOpacity style={[styles.addQuickBtn, { backgroundColor: `${GOLD_COLOR}15`, borderColor: GOLD_COLOR }]} onPress={() => openAddModal('gold')}>
                <Text style={{ fontSize: 20 }}>🪙</Text>
                <Text style={{ color: GOLD_COLOR, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Add Gold</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addQuickBtn, { backgroundColor: `${SILVER_COLOR}15`, borderColor: SILVER_COLOR }]} onPress={() => openAddModal('silver')}>
                <Text style={{ fontSize: 20 }}>🥈</Text>
                <Text style={{ color: SILVER_COLOR, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Add Silver</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          filteredAssets.map(asset => {
            const isGold = asset.metalType === 'gold';
            const badgeColor = isGold ? GOLD_COLOR : SILVER_COLOR;
            const pl = asset.profitLoss || 0;
            const plColor = pl >= 0 ? COLORS.income : COLORS.expense;
            const typeList = isGold ? ASSET_TYPES_GOLD : ASSET_TYPES_SILVER;
            const typeInfo = typeList.find(t => t.value === asset.type);

            return (
              <TouchableOpacity key={asset._id} style={[styles.assetCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
                onPress={() => openEditModal(asset)} onLongPress={() => handleDelete(asset._id, asset.name)}>

                <View style={styles.assetTop}>
                  <View style={styles.assetLeft}>
                    <View style={[styles.assetIcon, { backgroundColor: `${badgeColor}12` }]}>
                      <Text style={{ fontSize: 22 }}>{isGold ? '🪙' : '🥈'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                        <Text style={[styles.assetName, { color: colors.textPrimary }]}>{asset.name}</Text>
                        <View style={[styles.metalBadge, { backgroundColor: `${badgeColor}20` }]}>
                          <Text style={{ color: badgeColor, fontSize: 9, fontWeight: '800' }}>{isGold ? 'GOLD' : 'SILVER'}</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>
                        {asset.purity} · {typeInfo?.icon || ''} {asset.type} {asset.source ? `· ${asset.source}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.assetWeight, { color: badgeColor }]}>{asset.weightGrams}g</Text>
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
                    <Text style={{ color: badgeColor, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>₹{asset.currentValue.toLocaleString()}</Text>
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

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingId ? 'Edit Asset' : 'Add Metal Asset'}
                </Text>
                <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Metal Type</Text>
              <View style={styles.chipGrid}>
                {METAL_TYPES.map(mt => (
                  <TouchableOpacity key={mt.value}
                    style={[styles.metalSelector, {
                      backgroundColor: mMetal === mt.value ? `${mt.color}22` : colors.surfaceAlt,
                      borderColor: mMetal === mt.value ? mt.color : colors.border,
                    }]}
                    onPress={() => {
                      setMMetal(mt.value);
                      setMPurity(mt.value === 'gold' ? '22K' : '999');
                      setMType('jewellery');
                    }}>
                    <Text style={{ fontSize: 24 }}>{mt.icon}</Text>
                    <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: mMetal === mt.value ? mt.color : colors.textSecondary }}>{mt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                placeholder={`Name (e.g., ${mMetal === 'gold' ? 'Wedding Chain' : 'Silver Anklet'})`} placeholderTextColor={colors.textTertiary}
                value={mName} onChangeText={setMName} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.chipGrid}>
                {currentAssetTypes.map(t => (
                  <TouchableOpacity key={t.value}
                    style={[styles.chip, { backgroundColor: mType === t.value ? `${accentColor}22` : colors.surfaceAlt, borderColor: mType === t.value ? accentColor : colors.border }]}
                    onPress={() => setMType(t.value)}>
                    <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: mType === t.value ? accentColor : colors.textSecondary }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Weight (grams) *</Text>
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 22, fontWeight: '800' }]}
                placeholder="e.g., 10" placeholderTextColor={colors.textTertiary}
                value={mWeight} onChangeText={setMWeight} keyboardType="decimal-pad" />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purity</Text>
              <View style={styles.chipGrid}>
                {currentPurities.map(p => (
                  <TouchableOpacity key={p}
                    style={[styles.chip, { backgroundColor: mPurity === p ? `${accentColor}22` : colors.surfaceAlt, borderColor: mPurity === p ? accentColor : colors.border }]}
                    onPress={() => setMPurity(p)}>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: mPurity === p ? accentColor : colors.textSecondary }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purchase Price (₹) *</Text>
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 22, fontWeight: '800' }]}
                placeholder="Total cost" placeholderTextColor={colors.textTertiary}
                value={mPrice} onChangeText={setMPrice} keyboardType="decimal-pad" />
              {mWeight && mPrice && (
                <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md }}>
                  = ₹{(parseFloat(mPrice) / parseFloat(mWeight)).toFixed(0)}/gram
                </Text>
              )}
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                placeholder={mMetal === 'gold' ? 'Source (e.g., Tanishq, Joyalukkas)' : 'Source (e.g., Local jeweller)'} placeholderTextColor={colors.textTertiary}
                value={mSource} onChangeText={setMSource} />
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                placeholder="Note (optional)" placeholderTextColor={colors.textTertiary}
                value={mNote} onChangeText={setMNote} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave}>
                <Ionicons name={editingId ? 'checkmark-circle' : 'diamond'} size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>
                  {editingId ? 'Update Asset' : `Save ${mMetal === 'gold' ? 'Gold' : 'Silver'} Asset`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCalcModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>🧮 Smart Calculator</Text>
              <TouchableOpacity onPress={() => { setShowCalcModal(false); setCalcResult(null); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount (₹)</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 26, fontWeight: '800' }]}
              placeholder="Enter amount" placeholderTextColor={colors.textTertiary}
              value={calcAmount} onChangeText={(v) => { setCalcAmount(v); setCalcResult(null); }} keyboardType="decimal-pad" />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: GOLD_COLOR }]} onPress={handleCalc}>
              <Ionicons name="calculator" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>Calculate</Text>
            </TouchableOpacity>
            {calcResult && (
              <View style={styles.calcResultBox}>
                <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, textAlign: 'center', marginBottom: SPACING.md }}>
                  For ₹{parseFloat(calcAmount).toLocaleString()} you can buy:
                </Text>
                <View style={styles.calcRow}>
                  <View style={[styles.calcCard, { backgroundColor: isDark ? '#2A2520' : '#FFF8E7' }]}>
                    <Text style={{ fontSize: 28 }}>🪙</Text>
                    <Text style={styles.calcGrams}>{calcResult.gold?.grams || 0}g</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 10 }}>Gold ({calcResult.gold?.purity})</Text>
                    <Text style={{ color: GOLD_COLOR, fontSize: 10, fontWeight: '600' }}>
                      ₹{(calcResult.gold?.pricePerGram || 0).toLocaleString()}/g
                    </Text>
                  </View>
                  <View style={[styles.calcCard, { backgroundColor: isDark ? '#222226' : '#F4F4F8' }]}>
                    <Text style={{ fontSize: 28 }}>🥈</Text>
                    <Text style={[styles.calcGrams, { color: SILVER_COLOR }]}>{calcResult.silver?.grams || 0}g</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 10 }}>Silver ({calcResult.silver?.purity})</Text>
                    <Text style={{ color: SILVER_COLOR, fontSize: 10, fontWeight: '600' }}>
                      ₹{(calcResult.silver?.pricePerGram || 0).toLocaleString()}/g
                    </Text>
                  </View>
                </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.xl },
  apiWarning: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 3 },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  priceCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  priceCardTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: SPACING.xs },
  priceLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 2 },
  priceValue: { fontSize: FONT_SIZES.xl, fontWeight: '900' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  liveDotSmall: { width: 5, height: 5, borderRadius: 3 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  changeText: { fontSize: 10, fontWeight: '800' },
  miniTrendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 8, height: 24 },
  miniBar: { width: 5, borderRadius: 2.5, minHeight: 6 },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryCard: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  summaryWeight: { fontSize: FONT_SIZES.base, fontWeight: '800', marginTop: 2 },
  trendSection: { borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  trendTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  rangeToggle: { flexDirection: 'row', borderRadius: RADIUS.full, padding: 2, gap: 2 },
  rangeBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  rangeBtnText: { fontSize: 10, fontWeight: '700' },
  chartContainer: { alignItems: 'center' },
  chartFooter: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600' },
  noTrendContainer: { height: 180, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  filterChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  assetCard: { borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.md, borderWidth: 1 },
  assetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  assetLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: SPACING.sm },
  assetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  assetName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  metalBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.full },
  assetWeight: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  plBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  assetMeta: { flexDirection: 'row', marginTop: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, marginVertical: 4 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: SPACING.md, marginBottom: 4 },
  addQuickBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: SPACING['3xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.md, fontSize: FONT_SIZES.base },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  metalSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 2 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg, marginTop: SPACING.md },
  calcResultBox: { marginTop: SPACING.xl },
  calcRow: { flexDirection: 'row', gap: SPACING.md },
  calcCard: { flex: 1, alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg },
  calcGrams: { fontSize: 28, fontWeight: '900', color: GOLD_COLOR, marginVertical: SPACING.xs },
});
