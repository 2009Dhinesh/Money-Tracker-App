import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, Dimensions,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../hooks/useGoals';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrencyShort } from '../utils/formatters';
import { useAccounts } from '../hooks/useAccounts';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { BANK_LIST } from '../constants/banks';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

export default function GoalsScreen() {
  const { colors, isDark } = useTheme();
  const { goals, loading, fetchGoals, addGoal, addFunds, withdrawFunds, deleteGoal } = useGoals();
  const { openDrawer } = useAppDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fundingModalVisible, setFundingModalVisible] = useState(false);
  const [fundMode, setFundMode] = useState('add'); // 'add' or 'withdraw'
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // New Goal Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('saving');
  
  const { accounts, fetchAccounts } = useAccounts();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  
  // Add Fund State
  const [fundAmount, setFundAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    fetchGoals();
    fetchAccounts();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) setSelectedAccount(accounts[0]._id);
    if (!selectedPaymentMethod && paymentMethods.length > 0) setSelectedPaymentMethod(paymentMethods[0]._id);
  }, [accounts, paymentMethods]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    await fetchAccounts();
    await fetchPaymentMethods();
    setRefreshing(false);
  }, []);

  const handleCreateGoal = async () => {
    if (!title || !targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await addGoal({ title, targetAmount: parseFloat(targetAmount), category });
      setModalVisible(false);
      setTitle('');
      setTargetAmount('');
      setCategory('saving');
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const handleFundAction = async () => {
    if (!fundAmount || !selectedGoal || !selectedAccount || !selectedPaymentMethod) {
      Alert.alert('Error', 'Please select account and payment method');
      return;
    }

    const amount = parseFloat(fundAmount);
    
    if (fundMode === 'add') {
      const selectedAccDetails = accounts.find(a => a._id === selectedAccount);
      if (selectedAccDetails && amount > selectedAccDetails.balance) {
        Alert.alert(
          'Insufficient Balance', 
          `The selected account does not have enough funds. Available balance is ₹${selectedAccDetails.balance.toLocaleString()}.`
        );
        return;
      }
    } else {
      if (amount > selectedGoal.currentAmount) {
        Alert.alert('Error', `Cannot withdraw more than current goal amount (₹${selectedGoal.currentAmount.toLocaleString()})`);
        return;
      }
    }

    try {
      if (fundMode === 'add') {
        await addFunds(selectedGoal._id, amount, selectedAccount, selectedPaymentMethod);
      } else {
        await withdrawFunds(selectedGoal._id, amount, selectedAccount, selectedPaymentMethod);
      }
      setFundingModalVisible(false);
      setFundAmount('');
      setSelectedGoal(null);
      fetchAccounts(); // Sync account balances instantly
      
      if (fundMode === 'withdraw') {
        setTimeout(() => {
          Alert.alert('Don\'t give up!', 'Don\'t give up on your savings journey! Next time you will do it.');
        }, 500);
      }
    } catch (error) {
      Alert.alert('Error', error.message || `Failed to ${fundMode} funds`);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) }
      ]
    );
  };

  if (loading && !refreshing) return <LoadingSpinner message="Loading goals..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerRight}>
          <Ionicons name="add" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

        {goals.length > 0 ? (
          goals.map((goal) => (
            <View key={goal._id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
              <View style={styles.goalHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${goal.color || COLORS.primary}15` }]}>
                  <Text style={styles.goalIcon}>{goal.icon || '🎯'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
                  <Text style={[styles.goalTarget, { color: colors.textTertiary }]}>
                    Target: ₹{goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(goal._id)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
                </TouchableOpacity>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.surfaceAlt }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${goal.progress}%`,
                        backgroundColor: goal.progress >= 100 ? COLORS.income : (goal.color || COLORS.primary)
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressStats}>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>{goal.progress}% Completed</Text>
                  <Text style={[styles.remainingText, { color: goal.progress >= 100 ? COLORS.income : COLORS.primary }]}>
                    {goal.progress >= 100 ? 'Goal Achieved! ✨' : `₹${(goal.targetAmount - goal.currentAmount).toLocaleString()} left`}
                  </Text>
                </View>
              </View>

              <View style={styles.goalFooter}>
                <Text style={[styles.currentAmount, { color: colors.textPrimary }]}>
                  ₹{goal.currentAmount.toLocaleString()} <Text style={{ fontSize: 12, color: colors.textTertiary }}>saved</Text>
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    style={[styles.actionBtnIcon, { backgroundColor: `${COLORS.expense}15` }]}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setFundMode('withdraw');
                      setFundingModalVisible(true);
                    }}
                  >
                    <Ionicons name="arrow-down" size={16} color={COLORS.expense} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setFundMode('add');
                      setFundingModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Add Funds</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="No Goals Yet"
            subtitle="Start saving for your dreams by adding a new goal!"
          >
            <Button title="+ Set First Goal" onPress={() => setModalVisible(true)} />
          </EmptyState>
        )}
      </ScrollView>

      {/* FAB to add goal */}

      {/* Add Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Saving Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="What are you saving for?"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Target Amount (₹)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: COLORS.primary }]} onPress={handleCreateGoal}>
              <Text style={styles.submitButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Withdraw Funds Modal */}
      <Modal visible={fundingModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: 30 }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, textAlign: 'center' }]}>
              {fundMode === 'add' ? 'Add Funds to ' : 'Withdraw from '}
              {selectedGoal?.title}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border, marginTop: 20 }]}
              placeholder="Enter Amount (₹)"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
            />

            {/* Account Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {fundMode === 'add' ? 'From Account' : 'To Account'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc._id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    selectedAccount === acc._id && {
                      backgroundColor: `${COLORS.primary}22`,
                      borderColor: COLORS.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedAccount(acc._id)}
                >
                  <View style={[styles.accMiniIcon, { backgroundColor: `${acc.color}15` }]}>
                    {(() => {
                      const logoFromList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                      const displayLogo = acc.bankLogo || logoFromList;
                      if (displayLogo) {
                        return <Image source={{ uri: displayLogo }} style={styles.miniLogo} resizeMode="contain" />;
                      }
                      return <Text style={styles.chipIcon}>{acc.icon}</Text>;
                    })()}
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: selectedAccount === acc._id ? COLORS.primary : colors.textSecondary },
                      ]}
                    >
                      {acc.name}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 10, fontWeight: '600', marginTop: 2 },
                        { color: selectedAccount === acc._id ? COLORS.primary : colors.textTertiary },
                      ]}
                    >
                      {formatCurrencyShort(acc.balance || 0)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Payment Method Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 10 }]}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {paymentMethods.map((pm) => (
                <TouchableOpacity
                  key={pm._id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    selectedPaymentMethod === pm._id && {
                      backgroundColor: `${COLORS.primary}22`,
                      borderColor: COLORS.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedPaymentMethod(pm._id)}
                >
                  <Text style={styles.chipIcon}>{pm.icon}</Text>
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: selectedPaymentMethod === pm._id ? COLORS.primary : colors.textSecondary },
                    ]}
                  >
                    {pm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFundingModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: fundMode === 'add' ? COLORS.primary : COLORS.expense }]} 
                onPress={handleFundAction}
              >
                <Text style={styles.confirmBtnText}>{fundMode === 'add' ? 'Confirm Addition' : 'Confirm Withdrawal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // scroll: { padding: SPACING.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    position: 'relative',
    marginBottom: SPACING.base,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
  subtitle: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: -2 },
  headerRight: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
  goalCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalIcon: { fontSize: 24 },
  goalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  goalTarget: { fontSize: 12, fontWeight: '500' },
  progressContainer: { marginBottom: SPACING.lg },
  progressBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 6 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, fontWeight: '600' },
  remainingText: { fontSize: 11, fontWeight: '700' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  currentAmount: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionBtnIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 30, right: 30,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.lg,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  input: { height: 56, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  submitButton: { height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontWeight: '700' },
  confirmBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.xs, marginTop: 10, alignSelf: 'flex-start' },
  horizontalScroll: { flexDirection: 'row', marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', maxWidth: 90 },
  accMiniIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  miniLogo: { width: 18, height: 18 },
});
