import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import Button from '../components/Button';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAlert } from '../context/AlertContext';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { formatCurrency, getBudgetStatusColor } from '../utils/formatters';

export default function BudgetScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { budgets, alertBudgets, loading, fetchBudgets, addBudget, editBudget, removeBudget } = useBudgets();
  const { expenseCategories, fetchCategories } = useCategories();
  const { openDrawer } = useAppDrawer();

  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState({ 
    category: '', 
    amount: '', 
    alertThreshold: '80',
    periodType: 'monthly' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const { alert: showAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      fetchBudgets({ month, year });
      fetchCategories({ type: 'expense' });
    }, [month, year])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets({ month, year });
    setRefreshing(false);
  };

  const openModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setForm({
        category: budget.category._id,
        amount: budget.amount.toString(),
        alertThreshold: budget.alertThreshold.toString(),
        periodType: budget.periodType || 'monthly',
      });
    } else {
      setEditingBudget(null);
      setForm({ category: '', amount: '', alertThreshold: '80', periodType: 'monthly' });
    }
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBudget(null);
  };

  const validateForm = () => {
    const e = {};
    if (!form.category) e.category = 'Select a category';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const data = {
        category: form.category,
        amount: parseFloat(form.amount),
        alertThreshold: parseInt(form.alertThreshold) || 80,
        periodType: form.periodType,
        month,
        year,
      };
      if (editingBudget) {
        await editBudget(editingBudget._id, data);
      } else {
        await addBudget(data);
      }
      closeModal();
      fetchBudgets({ month, year });
    } catch (err) {
      showAlert('Error', err.message || 'Failed to save budget', [], 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Budget',
      'Are you sure you want to remove this budget limit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeBudget(id) },
      ],
      'warning'
    );
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading && !refreshing) return <LoadingSpinner message="Loading budgets..." />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Budgets</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{`${MONTH_NAMES[month - 1]} ${year}`}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => openModal()}
          >
            <Ionicons name="add" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Alert summary */}
        {alertBudgets.length > 0 && (
          <View style={[styles.alertSummary, { backgroundColor: isDark ? 'rgba(255,176,32,0.1)' : COLORS.warningLight, borderColor: COLORS.warning }]}>
            <Ionicons name="warning" size={20} color={COLORS.warning} />
            <Text style={[styles.alertSummaryText, { color: COLORS.warning }]}>
              {`${alertBudgets.length} budget${alertBudgets.length > 1 ? 's' : ''} need${alertBudgets.length === 1 ? 's' : ''} attention`}
              {alertBudgets.filter(b => b.isOverBudget).length > 0 && ` (${alertBudgets.filter(b => b.isOverBudget).length} over limit)`}
            </Text>
          </View>
        )}

        {/* Budget Cards */}
        {budgets.length === 0 ? (
          <EmptyState
            icon="pie-chart-outline"
            title="No budgets set"
            subtitle="Set monthly limits for each spending category to track your expenses"
          >
            <Button title="+ Set First Budget" onPress={() => openModal()} />
          </EmptyState>
        ) : (
          budgets.map((budget) => {
            const statusColor = getBudgetStatusColor(budget.percentage);
            return (
              <View
                key={budget._id}
                style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.catRow}>
                    <View>
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>
                        {budget.category?.name}
                      </Text>
                      <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                        Limit: {formatCurrency(budget.amount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openModal(budget)} style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(budget._id)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressBg, { backgroundColor: colors.surfaceAlt }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: COLORS.expense }]}>
                      {formatCurrency(budget.spent)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Spent</Text>
                  </View>
                  <View style={[styles.statBadge, { backgroundColor: `${statusColor}18` }]}>
                    <Text style={[styles.percentText, { color: statusColor }]}>
                      {Math.round(budget.percentage)}%
                    </Text>
                    {budget.isOverBudget && (
                      <Ionicons name="alert-circle" size={14} color={COLORS.expense} />
                    )}
                  </View>
                  <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.statValue, { color: COLORS.income }]}>
                      {formatCurrency(budget.remaining)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Remaining</Text>
                  </View>
                </View>

                {budget.isOverBudget && (
                  <View style={styles.overBudgetBanner}>
                    <Ionicons name="warning" size={13} color={COLORS.expense} />
                    <Text style={styles.overBudgetText}>
                      Over budget by {formatCurrency(budget.spent - budget.amount)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* ── Add/Edit Budget Modal ─────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingBudget ? 'Edit Budget' : 'Set Budget'}
            </Text>

            {/* Category Picker (Modal Style) */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity 
              style={[styles.pickerButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <View style={styles.pickerContent}>
                <Text style={[styles.pickerText, { color: form.category ? colors.textPrimary : colors.textTertiary }]}>
                  {form.category ? expenseCategories.find(c => c._id === form.category)?.name : 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
            {formErrors.category && <Text style={styles.fieldError}>{formErrors.category}</Text>}

            {/* Period Toggle */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Period Type</Text>
            <View style={styles.currencyRow}>
              {['monthly', 'weekly'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.catChip,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    form.periodType === p && { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, periodType: p }))}
                >
                  <Text style={[styles.catChipText, { color: form.periodType === p ? COLORS.primary : colors.textSecondary }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Budget Amount (₹)"
              value={form.amount}
              onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              icon="wallet-outline"
              error={formErrors.amount}
            />

            <Input
              label={`Alert at ${form.alertThreshold}% of budget`}
              value={form.alertThreshold}
              onChangeText={(v) => setForm((f) => ({ ...f, alertThreshold: v }))}
              placeholder="80"
              keyboardType="numeric"
              icon="notifications-outline"
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
              <Button title={editingBudget ? 'Update' : 'Save'} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, maxHeight: '70%' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.modalOption,
                    form.category === cat._id && { backgroundColor: `${COLORS.primary}15` }
                  ]}
                  onPress={() => {
                    setForm(f => ({ ...f, category: cat._id }));
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${cat.color}15` }]}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.textPrimary }]}>{cat.name}</Text>
                  {form.category === cat._id && (
                    <Ionicons name="checkmark-sharp" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button 
              title="Close" 
              variant="outline" 
              onPress={() => setCategoryModalVisible(false)}
              style={{ marginTop: SPACING.lg }}
            />
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
  },
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: -2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.xl },
  alertSummary: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.base,
  },
  alertSummaryText: { fontSize: FONT_SIZES.sm, fontWeight: '600', flex: 1 },
  budgetCard: {
    borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catIcon: { fontSize: 28 },
  catName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  budgetLimit: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { padding: SPACING.xs + 2 },
  progressBg: { height: 8, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.md },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: {},
  statValue: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  statLabel: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: 2 },
  statBadge: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  percentText: { fontSize: FONT_SIZES.sm, fontWeight: '800' },
  overBudgetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,107,107,0.2)',
  },
  overBudgetText: { fontSize: FONT_SIZES.xs, color: COLORS.expense, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.xl, paddingBottom: SPACING['3xl'],
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc',
    alignSelf: 'center', marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.xl, letterSpacing: -0.3 },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  fieldError: { color: COLORS.expense, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm,
  },
  catChipText: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  pickerButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  pickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
});
