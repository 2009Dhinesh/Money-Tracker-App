import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useAccounts } from '../hooks/useAccounts';
import { useAlert } from '../context/AlertContext';

import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

const ICONS = ['🍽️', '🚗', '🛍️', '🎬', '🏥', '⚡', '📚', '🏠', '💄', '📈', '✈️', '💸', '💼', '💻', '🏢', '📊', '🏘️', '🎁', '💵', '🍕', '🍺', '☕', '🍎', '🚌', '🚆', '🚲', '⛽', '🛒', '👕', '📱', '🎮', '🎸', '⚽', '🎨', '💊', '🦷', '💡', '📶', '🧼', '🧹', '🪴', '🔨', '💍', '🧸', '💰', '💳', '🔥', '❄️'];

const THEME_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#F8B500', 
  '#6C63FF', '#FF8B94', '#98DDCA', '#D4A5A5', '#85C1E9',
  '#27AE60', '#2ECC71', '#16A085', '#1ABC9C', '#3498DB',
  '#9B59B6', '#E74C3C', '#E67E22', '#F1C40F', '#34495E'
];

const PAY_TYPES = [
  { label: 'Cash', value: 'cash', icon: '💵' },
  { label: 'Bank', value: 'bank', icon: '🏦' },
  { label: 'Card', value: 'card', icon: '💳' },
  { label: 'UPI', value: 'upi', icon: '📱' },
];

export default function CategoriesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { categories, loading: loadingCat, fetchCategories, addCategory, editCategory, removeCategory } = useCategories();
  const { paymentMethods, loading: loadingPay, fetchPaymentMethods, addPaymentMethod, editPaymentMethod, removePaymentMethod } = usePaymentMethods();
  const { accounts, fetchAccounts } = useAccounts();

  const { alert: showAlert } = useAlert();
  
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income' | 'payment'
  
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', icon: '💰', color: '#6C63FF' });
  const [payForm, setPayForm] = useState({ name: '', type: 'bank', linkedAccountId: null, icon: '💳', color: '#6C63FF' });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
    fetchAccounts();
  }, []);

  const dataList = activeTab === 'payment' ? (paymentMethods || []) : (categories || []).filter(c => c.type === activeTab);
  const isLoading = loadingCat || loadingPay;

  const openCategoryModal = (category = null, defaultType = 'expense') => {
    setSelectionModalVisible(false);
    if (category) {
      setEditingItem(category);
      setCatForm({ name: category.name, type: category.type, icon: category.icon, color: category.color });
    } else {
      setEditingItem(null);
      setCatForm({ name: '', type: defaultType, icon: '💰', color: '#6C63FF' });
    }
    setErrors({});
    setCatModalVisible(true);
  };

  const openPaymentModal = (method = null) => {
    setSelectionModalVisible(false);
    if (method) {
      setEditingItem(method);
      setPayForm({ 
        name: method.name, 
        type: method.type || 'bank', 
        linkedAccountId: method.linkedAccountId || null,
        icon: method.icon, 
        color: method.color 
      });
    } else {
      setEditingItem(null);
      setPayForm({ name: '', type: 'bank', linkedAccountId: null, icon: '💳', color: '#6C63FF' });
    }
    setErrors({});
    setPayModalVisible(true);
  };

  const closeModals = () => {
    setCatModalVisible(false);
    setPayModalVisible(false);
    setEditingItem(null);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) return setErrors({ name: 'Name is required' });
    setSaving(true);
    try {
      if (editingItem) await editCategory(editingItem._id, catForm);
      else await addCategory(catForm);
      fetchCategories();
      setActiveTab(catForm.type);
      closeModals();
    } catch (err) {
      showAlert('Error', err.message, [], 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    if (!payForm.name.trim()) return setErrors({ name: 'Name is required' });
    setSaving(true);
    try {
      if (editingItem) await editPaymentMethod(editingItem._id, payForm);
      else await addPaymentMethod(payForm);
      fetchPaymentMethods();
      setActiveTab('payment');
      closeModals();
    } catch (err) {
      showAlert('Error', err.message, [], 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, isDefault, isPayment) => {
    if (isDefault) {
      showAlert('System Item', 'Defaults cannot be deleted.', [], 'warning');
      return;
    }
    showAlert(
      'Delete', 
      `Are you sure you want to delete this ${isPayment ? 'payment method' : 'category'}?`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (isPayment) {
                await removePaymentMethod(id);
                fetchPaymentMethods();
              } else {
                await removeCategory(id);
                fetchCategories();
              }
            } catch (err) {
              showAlert('Error', err.message, [], 'error');
            }
          } 
        },
      ],
      'warning'
    );
  };

  const renderItem = useCallback(({ item }) => {
    const isPayment = activeTab === 'payment';
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => isPayment ? openPaymentModal(item) : openCategoryModal(item)}
        onLongPress={() => handleDelete(item._id, item.isDefault, isPayment)}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.itemLabel, { color: colors.textTertiary }]}>
            {isPayment ? (item.type ? item.type.toUpperCase() : 'Custom') : (item.isDefault ? 'Default' : 'Custom')}
          </Text>
        </View>
        {!item.isDefault && (
          <TouchableOpacity onPress={() => handleDelete(item._id, false, isPayment)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      </TouchableOpacity>
    );
  }, [colors, activeTab]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Data</Text>
        <TouchableOpacity onPress={() => setSelectionModalVisible(true)} style={styles.headerRight}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        {['expense', 'income', 'payment'].map(t => (
          <TouchableOpacity 
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tab, 
              activeTab === t && { borderBottomColor: COLORS.primary, borderBottomWidth: 3 }
            ]}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === t ? COLORS.primary : colors.textSecondary }
            ]}>
              {t === 'payment' ? 'Payments' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading..." />
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState 
              icon="grid-outline"
              title="No items found" 
              subtitle="Tap the + button to add one"
            >
              <Button title="+ Add Category" onPress={() => setSelectionModalVisible(true)} />
            </EmptyState>
          }
        />
      )}

      {/* Option Selection Modal */}
      <Modal visible={selectionModalVisible} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectionModalVisible(false)}
        >
          <View style={[styles.selectionSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary, marginBottom: SPACING.lg }]}>Create New</Text>
            
            <TouchableOpacity style={[styles.optionBtn, { backgroundColor: colors.background }]} onPress={() => openCategoryModal(null, 'expense')}>
              <View style={[styles.optionIcon, { backgroundColor: `${COLORS.expense}15` }]}><Ionicons name="trending-down" size={24} color={COLORS.expense} /></View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Expense Category</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionBtn, { backgroundColor: colors.background }]} onPress={() => openCategoryModal(null, 'income')}>
              <View style={[styles.optionIcon, { backgroundColor: `${COLORS.income}15` }]}><Ionicons name="trending-up" size={24} color={COLORS.income} /></View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Income Category</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionBtn, { backgroundColor: colors.background }]} onPress={() => openPaymentModal(null)}>
              <View style={[styles.optionIcon, { backgroundColor: `${COLORS.primary}15` }]}><Ionicons name="card" size={24} color={COLORS.primary} /></View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Payment Method</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Modal */}
      <Modal visible={catModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingItem ? 'Edit Category' : 'New Category'}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.typeToggle}>
              {[
                { label: 'Expense', value: 'expense', icon: 'trending-down' },
                { label: 'Income', value: 'income', icon: 'trending-up' }
              ].map(t => (
                <TouchableOpacity 
                  key={t.value}
                  onPress={() => setCatForm(f => ({ ...f, type: t.value }))}
                  style={[
                    styles.typeBtn, 
                    { backgroundColor: colors.surfaceAlt },
                    catForm.type === t.value && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary, borderWidth: 1 }
                  ]}
                >
                  <Ionicons name={t.icon} size={18} color={catForm.type === t.value ? COLORS.primary : colors.textSecondary} />
                  <Text style={[styles.typeBtnText, { color: catForm.type === t.value ? COLORS.primary : colors.textSecondary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input 
              label="Name"
              value={catForm.name}
              onChangeText={v => setCatForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Groceries"
              error={errors.name}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsScroll}>
              {ICONS.map(i => (
                <TouchableOpacity key={i} onPress={() => setCatForm(f => ({ ...f, icon: i }))}
                  style={[styles.iconChip, catForm.icon === i && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary }]}
                >
                  <Text style={{ fontSize: 24 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorGrid}>
              {THEME_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setCatForm(f => ({ ...f, color: c }))}
                  style={[styles.colorChip, { backgroundColor: c }, catForm.color === c && styles.activeColor]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeModals} variant="outline" style={{ flex: 1 }} />
              <Button title="Save" onPress={handleSaveCategory} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal visible={payModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingItem ? 'Edit Payment Method' : 'New Payment Method'}
            </Text>

            <Input 
              label="Name"
              value={payForm.name}
              onChangeText={v => setPayForm(f => ({ ...f, name: v }))}
              placeholder="e.g. HDFC Credit Card"
              error={errors.name}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.typeToggle}>
              {PAY_TYPES.map(t => (
                <TouchableOpacity 
                  key={t.value}
                  onPress={() => setPayForm(f => ({ ...f, type: t.value }))}
                  style={[
                    styles.typeBtn, 
                    { backgroundColor: colors.surfaceAlt },
                    payForm.type === t.value && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary, borderWidth: 1 }
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                  <Text style={[styles.typeBtnText, { color: payForm.type === t.value ? COLORS.primary : colors.textSecondary, fontSize: 11 }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Linked Account (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <TouchableOpacity
                style={[
                  styles.accChip,
                  { backgroundColor: colors.surfaceAlt },
                  !payForm.linkedAccountId && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary, borderWidth: 1 }
                ]}
                onPress={() => setPayForm(f => ({ ...f, linkedAccountId: null }))}
              >
                <Text style={{ color: !payForm.linkedAccountId ? COLORS.primary : colors.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>None</Text>
              </TouchableOpacity>
              {accounts.map(acc => (
                <TouchableOpacity
                  key={acc._id}
                  style={[
                    styles.accChip,
                    { backgroundColor: colors.surfaceAlt },
                    payForm.linkedAccountId === acc._id && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary, borderWidth: 1 }
                  ]}
                  onPress={() => setPayForm(f => ({ ...f, linkedAccountId: acc._id }))}
                >
                  <Text style={{ color: payForm.linkedAccountId === acc._id ? COLORS.primary : colors.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsScroll}>
              {ICONS.map(i => (
                <TouchableOpacity key={i} onPress={() => setPayForm(f => ({ ...f, icon: i }))}
                  style={[styles.iconChip, payForm.icon === i && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary }]}
                >
                  <Text style={{ fontSize: 24 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorGrid}>
              {THEME_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setPayForm(f => ({ ...f, color: c }))}
                  style={[styles.colorChip, { backgroundColor: c }, payForm.color === c && styles.activeColor]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeModals} variant="outline" style={{ flex: 1 }} />
              <Button title="Save" onPress={handleSavePayment} loading={saving} style={{ flex: 1 }} />
            </View>
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
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  tabText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  iconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  itemLabel: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: 2 },
  deleteBtn: { padding: SPACING.sm, marginRight: SPACING.xs },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, paddingBottom: 40 },
  selectionSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, paddingBottom: 50 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.md },
  
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  optionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  optionText: { fontSize: FONT_SIZES.md, fontWeight: '700' },

  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.xs },
  iconsScroll: { marginBottom: SPACING.md },
  iconChip: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'transparent', marginRight: SPACING.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  colorChip: { width: 34, height: 34, borderRadius: 17 },
  activeColor: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: SPACING.md },
  typeToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, gap: 4, borderWidth: 1, borderColor: 'transparent' },
  typeBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  accChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginRight: SPACING.sm, borderWidth: 1, borderColor: 'transparent' },
});
