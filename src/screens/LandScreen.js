import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  StatusBar, Alert, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLand } from '../hooks/useLand';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

const PROPERTY_TYPES = [
  { label: 'Plot', value: 'plot', icon: '🏗️' },
  { label: 'Flat', value: 'flat', icon: '🏢' },
  { label: 'Residential', value: 'residential', icon: '🏠' },
  { label: 'Commercial', value: 'commercial', icon: '🏪' },
  { label: 'Agricultural', value: 'agricultural', icon: '🌾' },
  { label: 'Other', value: 'other', icon: '📍' },
];

const AREA_UNITS = [
  { label: 'Sq.ft', value: 'sqft' },
  { label: 'Sq.m', value: 'sqm' },
  { label: 'Acre', value: 'acre' },
  { label: 'Cent', value: 'cent' },
  { label: 'Ground', value: 'ground' },
];

export default function LandScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { assets, summary, loading, fetchAssets, addAsset, updateAsset, removeAsset } = useLand();
  const { openDrawer } = useAppDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [lName, setLName] = useState('');
  const [lType, setLType] = useState('plot');
  const [lLocation, setLLocation] = useState('');
  const [lArea, setLArea] = useState('');
  const [lAreaUnit, setLAreaUnit] = useState('sqft');
  const [lPrice, setLPrice] = useState('');
  const [lCurrentVal, setLCurrentVal] = useState('');
  const [lRegNo, setLRegNo] = useState('');
  const [lNote, setLNote] = useState('');

  useFocusEffect(useCallback(() => { fetchAssets(); }, []));
  const onRefresh = async () => { setRefreshing(true); await fetchAssets(); setRefreshing(false); };

  const resetForm = () => {
    setLName(''); setLType('plot'); setLLocation(''); setLArea(''); setLAreaUnit('sqft');
    setLPrice(''); setLCurrentVal(''); setLRegNo(''); setLNote('');
  };

  const handleAdd = async () => {
    if (!lName.trim()) return Alert.alert('Error', 'Property name required');
    if (!lPrice || parseFloat(lPrice) <= 0) return Alert.alert('Error', 'Enter purchase price');
    try {
      await addAsset({
        name: lName.trim(), type: lType, location: lLocation.trim(),
        area: lArea ? parseFloat(lArea) : 0, areaUnit: lAreaUnit,
        purchasePrice: parseFloat(lPrice), currentValue: lCurrentVal ? parseFloat(lCurrentVal) : parseFloat(lPrice),
        registrationNo: lRegNo.trim(), note: lNote.trim(),
      });
      setShowAddModal(false); resetForm();
      Alert.alert('✅', 'Property added!');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const openEditValue = (asset) => {
    setEditingId(asset._id);
    setLCurrentVal(asset.currentValue?.toString() || asset.purchasePrice?.toString() || '');
    setShowEditModal(true);
  };

  const handleUpdateValue = async () => {
    if (!lCurrentVal || parseFloat(lCurrentVal) <= 0) return Alert.alert('Error', 'Enter valid value');
    try {
      await updateAsset(editingId, { currentValue: parseFloat(lCurrentVal) });
      setShowEditModal(false); setEditingId(null);
      Alert.alert('✅', 'Value updated!');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeAsset(id) },
    ]);
  };

  const appColor = (summary?.totalAppreciation || 0) >= 0 ? COLORS.income : COLORS.expense;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>🏡 Properties</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerRight}>
          <Ionicons name="add" size={28} color="#00C896" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C896" />}>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#00C89615' }]}>
              <Text style={{ fontSize: 18 }}>🏠</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Properties</Text>
            <Text style={[styles.summaryAmount, { color: '#00C896' }]}>{summary?.count || 0}</Text>
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
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Market Value</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.income }]}>₹{(summary?.totalCurrentValue || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${appColor}15` }]}>
              <Text style={{ fontSize: 18 }}>{(summary?.totalAppreciation || 0) >= 0 ? '📊' : '📉'}</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Appreciation</Text>
            <Text style={[styles.summaryAmount, { color: appColor }]}>
              {(summary?.totalAppreciation || 0) >= 0 ? '+' : ''}₹{(summary?.totalAppreciation || 0).toLocaleString()}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: appColor, fontWeight: '600' }}>{summary?.appreciationPercent || 0}%</Text>
          </View>
        </View>

        {/* Property List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Your Properties ({summary?.count || 0})
        </Text>

        {assets.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="No properties yet"
            subtitle="Tap + to add your first property"
          >
            <Button 
              title="+ Set First Property" 
              onPress={() => setShowAddModal(true)}
            />
          </EmptyState>
        ) : (
          assets.map(asset => {
            const appreciation = asset.appreciation || 0;
            const aColor = appreciation >= 0 ? COLORS.income : COLORS.expense;
            const typeInfo = PROPERTY_TYPES.find(t => t.value === asset.type);
            return (
              <TouchableOpacity key={asset._id} style={[styles.assetCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
                onLongPress={() => handleDelete(asset._id, asset.name)}>

                <View style={styles.assetTop}>
                  <View style={styles.assetLeft}>
                    <View style={[styles.assetIcon, { backgroundColor: '#00C89612' }]}>
                      <Text style={{ fontSize: 22 }}>{typeInfo?.icon || '🏠'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assetName, { color: colors.textPrimary }]}>{asset.name}</Text>
                      <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>
                        {asset.type} {asset.location ? `· ${asset.location}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.plBadge, { backgroundColor: `${aColor}15` }]}>
                    <Ionicons name={appreciation >= 0 ? 'trending-up' : 'trending-down'} size={10} color={aColor} />
                    <Text style={{ color: aColor, fontSize: 9, fontWeight: '700' }}>{asset.appreciationPercent}%</Text>
                  </View>
                </View>

                {asset.area > 0 && (
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, marginTop: 4 }}>
                    📐 {asset.area} {asset.areaUnit} {asset.pricePerUnit ? `· ₹${asset.pricePerUnit.toLocaleString()}/${asset.areaUnit}` : ''}
                  </Text>
                )}

                <View style={[styles.assetMeta, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Bought</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>₹{asset.purchasePrice.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Current</Text>
                    <Text style={{ color: COLORS.income, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>₹{(asset.currentValue || asset.purchasePrice).toLocaleString()}</Text>
                  </View>
                  <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaItem}>
                    <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>Gain</Text>
                    <Text style={{ color: aColor, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>{appreciation >= 0 ? '+' : ''}₹{appreciation.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Update Value button */}
                <TouchableOpacity style={[styles.updateBtn, { backgroundColor: `${COLORS.primary}12` }]} onPress={() => openEditValue(asset)}>
                  <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
                  <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm, marginLeft: 6 }}>Update Market Value</Text>
                </TouchableOpacity>

                {asset.purchaseDate && (
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, marginTop: SPACING.xs }}>
                    📅 {new Date(asset.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {asset.note ? <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, marginTop: 3 }}>📝 {asset.note}</Text> : null}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* Add Property Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Property</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Property Name *" placeholderTextColor={colors.textTertiary}
              value={lName} onChangeText={setLName} />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.chipGrid}>
              {PROPERTY_TYPES.map(t => (
                <TouchableOpacity key={t.value}
                  style={[styles.chip, { backgroundColor: lType === t.value ? '#00C89622' : colors.surfaceAlt, borderColor: lType === t.value ? '#00C896' : colors.border }]}
                  onPress={() => setLType(t.value)}>
                  <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: lType === t.value ? '#00C896' : colors.textSecondary }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Location (e.g., Chennai, Madurai)" placeholderTextColor={colors.textTertiary}
              value={lLocation} onChangeText={setLLocation} />

            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, flex: 1, marginBottom: 0 }]}
                placeholder="Area" placeholderTextColor={colors.textTertiary}
                value={lArea} onChangeText={setLArea} keyboardType="decimal-pad" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {AREA_UNITS.map(u => (
                  <TouchableOpacity key={u.value}
                    style={[styles.chip, { backgroundColor: lAreaUnit === u.value ? '#00C89622' : colors.surfaceAlt, borderColor: lAreaUnit === u.value ? '#00C896' : colors.border, marginRight: 6 }]}
                    onPress={() => setLAreaUnit(u.value)}>
                    <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: lAreaUnit === u.value ? '#00C896' : colors.textSecondary }}>{u.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Purchase Price (₹) *</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 22, fontWeight: '800' }]}
              placeholder="Total cost" placeholderTextColor={colors.textTertiary}
              value={lPrice} onChangeText={setLPrice} keyboardType="decimal-pad" />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Market Value (₹)</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Leave blank = purchase price" placeholderTextColor={colors.textTertiary}
              value={lCurrentVal} onChangeText={setLCurrentVal} keyboardType="decimal-pad" />

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Registration No. (optional)" placeholderTextColor={colors.textTertiary}
              value={lRegNo} onChangeText={setLRegNo} />

            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              placeholder="Notes (optional)" placeholderTextColor={colors.textTertiary}
              value={lNote} onChangeText={setLNote} multiline />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#00C896' }]} onPress={handleAdd}>
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>Save Property</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Value Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Update Market Value</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Market Value (₹)</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 26, fontWeight: '800' }]}
              placeholder="Enter value" placeholderTextColor={colors.textTertiary}
              value={lCurrentVal} onChangeText={setLCurrentVal} keyboardType="decimal-pad" autoFocus />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#00C896' }]} onPress={handleUpdateValue}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>Update Value</Text>
            </TouchableOpacity>
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
    padding: 2,
  },
  scroll: { padding: SPACING.xl },

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
  plBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  assetMeta: { flexDirection: 'row', marginTop: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, marginVertical: 4 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginTop: SPACING.sm },

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
});
