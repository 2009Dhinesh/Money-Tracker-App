import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Alert, Image, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useBudgets } from '../hooks/useBudgets';
import { sendInstantNotification, scheduleReminderNotification } from '../utils/notificationService';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import NumericKeyboard from '../components/NumericKeyboard';

const FREQUENCIES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function AddTransactionScreen({ navigation, route }) {
  const { transaction: existingTxn, isEdit } = route.params || {};
  const { colors, isDark } = useTheme();
  const { addTransaction, editTransaction } = useTransactions();
  const { categories, fetchCategories, expenseCategories, incomeCategories } = useCategories();
  const { accounts, fetchAccounts } = useAccounts();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const { budgets, fetchBudgets } = useBudgets();

  const [type, setType] = useState(existingTxn?.type || route.params?.type || 'expense');
  const [amount, setAmount] = useState(existingTxn?.amount?.toString() || '');
  const [title, setTitle] = useState(existingTxn?.title || '');
  const [description, setDescription] = useState(existingTxn?.description || '');
  const [selectedCategory, setSelectedCategory] = useState(existingTxn?.category?._id || null);
  const [selectedAccount, setSelectedAccount] = useState(existingTxn?.account?._id || null);
  const [selectedToAccount, setSelectedToAccount] = useState(existingTxn?.toAccount?._id || null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(existingTxn?.paymentMethod?._id || null);
  const [selectedOtherPerson, setSelectedOtherPerson] = useState(existingTxn?.otherPersonId || null);
  const [isRecurring, setIsRecurring] = useState(existingTxn?.isRecurring || false);
  const [frequency, setFrequency] = useState(existingTxn?.frequency || 'monthly');
  const [date, setDate] = useState(
    existingTxn?.date ? new Date(existingTxn.date) : new Date()
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'account', 'toAccount', 'category', 'paymentMethod'

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      if (
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getDate() === now.getDate()
      ) {
        selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      } else {
        selectedDate.setHours(12, 0, 0);
      }
      setDate(selectedDate);
    }
  };

  useEffect(() => { 
    fetchCategories(); 
    fetchAccounts();
    fetchPaymentMethods();
    fetchBudgets();
  }, []);


  const filteredCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const validate = () => {
    const e = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    if (!title.trim()) e.title = 'Title is required';
    if (type !== 'transfer' && !selectedCategory) e.category = 'Please select a category';
    if (!selectedAccount) e.account = 'Please select an account';
    if (type === 'transfer' && !selectedToAccount) e.toAccount = 'Please select destination account';
    if (type === 'transfer' && selectedAccount === selectedToAccount) e.toAccount = 'Cannot transfer to the same account';
    if (!selectedPaymentMethod) e.paymentMethod = 'Please select a payment method';
    if (!date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const amountVal = parseFloat(amount);
    let willExceedBudget = false;
    let budgetWarningMsg = '';

    if (type === 'expense') {
      const budget = budgets.find(b => b.category?._id === selectedCategory);
      if (budget) {
        // If editing, subtract old amount from spent
        const oldAmount = isEdit && existingTxn?.amount ? parseFloat(existingTxn.amount) : 0;
        const newTotalSpent = budget.spent - oldAmount + amountVal;
        
        if (newTotalSpent > budget.amount) {
          willExceedBudget = true;
          budgetWarningMsg = `Adding this expense will exceed your monthly limit of ₹${budget.amount} for ${budget.category?.name}.\n\nDo you want to proceed?`;
        }
      }
    }

    const processTransaction = async () => {
      setLoading(true);
      try {
        const transferCategory = categories.find(c => c.name.toLowerCase() === 'transfer')?._id || categories[0]?._id;

        const data = {
          type,
          amount: amountVal,
          title: title.trim(),
          description: description.trim(),
          category: type === 'transfer' ? transferCategory : selectedCategory,
          account: selectedAccount,
          toAccount: type === 'transfer' ? selectedToAccount : undefined,
          paymentMethod: selectedPaymentMethod,
          isRecurring,
          frequency: isRecurring ? frequency : 'none',
          date: new Date(date).toISOString(),
          otherPersonId: selectedOtherPerson,
        };

        if (isEdit) {
          await editTransaction(existingTxn._id, data);
          Alert.alert('✅ Success', 'Transaction updated successfully');
        } else {
          const txn = await addTransaction(data);
          
          if (willExceedBudget) {
            const budget = budgets.find(b => b.category?._id === selectedCategory);
            sendInstantNotification(
              '⚠️ Budget Exceeded!', 
              `You've just exceeded your ${budget.category?.name} budget limit of ₹${budget.amount}.`
            );
          }

          if (isRecurring) {
            const nextDate = new Date(date);
            if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            if (frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

            await scheduleReminderNotification(
              `🔔 Bill Reminder: ${title}`,
              `Your recurring ${type} for ${title} (₹${amountVal}) is due soon.`,
              nextDate
            );
          }

          Alert.alert('✅ Success', 'Transaction added successfully');
        }
        navigation.goBack();
      } catch (err) {
        Alert.alert('Error', err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (willExceedBudget) {
      Alert.alert(
        'Limit Exceeded Warning ⚠️',
        budgetWarningMsg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', style: 'destructive', onPress: processTransaction }
        ]
      );
    } else {
      processTransaction();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* ── Header ─────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEdit ? 'Edit Transaction' : 'Add Transaction'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Type Toggle ────────────────────────── */}
        <View style={[styles.typeToggle, { backgroundColor: colors.surfaceAlt }]}>
          {['expense', 'income', 'transfer'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                type === t && {
                  backgroundColor: t === 'expense' ? COLORS.expense : t === 'income' ? COLORS.income : COLORS.primary,
                  ...SHADOWS.sm,
                },
              ]}
              onPress={() => { 
                setType(t); 
                setSelectedCategory(t === 'transfer' ? null : selectedCategory); 
                if (t === 'transfer') setSelectedOtherPerson(null);
              }}
            >
              <Ionicons
                name={t === 'expense' ? 'arrow-up' : t === 'income' ? 'arrow-down' : 'swap-horizontal'}
                size={16}
                color={type === t ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.typeBtnText, { color: type === t ? '#fff' : colors.textSecondary }]}>{t === 'expense' ? 'Expense' : t === 'income' ? 'Income' : 'Transfer'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Amount ─────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.amountCard,
            { backgroundColor: colors.surface, borderColor: errors.amount ? COLORS.expense : colors.border }
          ]}
          onPress={() => setShowKeyboard(true)}
        >
          <Text style={[styles.currencySymbol, { color: type === 'expense' ? COLORS.expense : COLORS.income }]}>₹</Text>
          <Text 
            style={[
              { flex: 1, fontSize: 36, fontWeight: '800' },
              { color: amount ? (type === 'expense' ? COLORS.expense : COLORS.income) : colors.textTertiary }
            ]}
          >
            {amount || '0.00'}
          </Text>
        </TouchableOpacity>
        {errors.amount && <Text style={[styles.fieldError, { marginBottom: SPACING.lg }]}>{errors.amount}</Text>}

        {/* ── Details ─────────────────────────────── */}
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dinner with friends"
          icon="pencil-outline"
          error={errors.title}
        />

        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a note..."
          icon="document-text-outline"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Input
            label="Date"
            value={format(new Date(date), 'dd MMM yyyy')}
            placeholder="Select date"
            icon="calendar-outline"
            error={errors.date}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* ── Account Picker ────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{type === 'transfer' ? 'From Account' : 'Account'}</Text>
        <TouchableOpacity 
          style={[styles.selectionInput, { backgroundColor: colors.surfaceAlt, borderColor: errors.account ? COLORS.expense : colors.border }]} 
          onPress={() => setActiveModal('account')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {(() => {
              const acc = accounts.find(a => a._id === selectedAccount);
              if (!acc) return <Text style={{ color: colors.textTertiary }}>Select Account...</Text>;
              const displayLogo = acc.bankLogo || BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
              return (
                <>
                  <View style={[styles.selectionIconBg, { backgroundColor: `${acc.color}15` }]}>
                    {displayLogo ? <Image source={{ uri: displayLogo }} style={styles.selectionLogo} resizeMode="contain" /> : <Text style={styles.selectionIcon}>{acc.icon}</Text>}
                  </View>
                  <Text style={[styles.selectionText, { color: colors.textPrimary }]}>{acc.name}</Text>
                </>
              );
            })()}
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {errors.account && <Text style={styles.fieldError}>{errors.account}</Text>}

        {/* ── Other Person Picker (If account has other persons) ── */}
        {(() => {
          const acc = accounts.find(a => a._id === selectedAccount);
          if (acc && acc.otherPersons && acc.otherPersons.length > 0 && (type === 'income' || type === 'expense')) {
            return (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Link to Third Party (Optional)</Text>
                <TouchableOpacity 
                  style={[styles.selectionInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
                  onPress={() => setActiveModal('person')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    {(() => {
                      const person = acc.otherPersons.find(p => p._id === selectedOtherPerson);
                      if (!person) return <Text style={{ color: colors.textTertiary }}>Select Person...</Text>;
                      return (
                        <>
                          <View style={[styles.selectionIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                          </View>
                          <Text style={[styles.selectionText, { color: colors.textPrimary }]}>{person.name}</Text>
                        </>
                      );
                    })()}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            );
          }
          return null;
        })()}

        {/* ── To Account Picker (Transfer only) ── */}
        {type === 'transfer' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>To Account</Text>
            <TouchableOpacity 
              style={[styles.selectionInput, { backgroundColor: colors.surfaceAlt, borderColor: errors.toAccount ? COLORS.expense : colors.border }]} 
              onPress={() => setActiveModal('toAccount')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                {(() => {
                  const acc = accounts.find(a => a._id === selectedToAccount);
                  if (!acc) return <Text style={{ color: colors.textTertiary }}>Select Destination Account...</Text>;
                  const displayLogo = acc.bankLogo || BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                  return (
                    <>
                      <View style={[styles.selectionIconBg, { backgroundColor: `${acc.color}15` }]}>
                        {displayLogo ? <Image source={{ uri: displayLogo }} style={styles.selectionLogo} resizeMode="contain" /> : <Text style={styles.selectionIcon}>{acc.icon}</Text>}
                      </View>
                      <Text style={[styles.selectionText, { color: colors.textPrimary }]}>{acc.name}</Text>
                    </>
                  );
                })()}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.toAccount && <Text style={styles.fieldError}>{errors.toAccount}</Text>}
          </>
        )}

        {/* ── Category Picker ───────────────────── */}
        {type !== 'transfer' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity 
              style={[styles.selectionInput, { backgroundColor: colors.surfaceAlt, borderColor: errors.category ? COLORS.expense : colors.border }]} 
              onPress={() => setActiveModal('category')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                {(() => {
                  const cat = filteredCategories.find(c => c._id === selectedCategory);
                  if (!cat) return <Text style={{ color: colors.textTertiary }}>Select Category...</Text>;
                  return (
                    <>
                      <View style={[styles.selectionIconBg, { backgroundColor: `${cat.color}15` }]}>
                        <Text style={styles.selectionIcon}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.selectionText, { color: colors.textPrimary }]}>{cat.name}</Text>
                    </>
                  );
                })()}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.fieldError}>{errors.category}</Text>}
          </>
        )}

        {/* ── Recurring Section ─────────────────── */}
        <View style={[styles.recurringCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.recurringHeader}>
            <View style={styles.recurringTitle}>
              <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.recurringLabel, { color: colors.textPrimary }]}>Recurring Transaction</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsRecurring(!isRecurring)}
              style={[
                styles.switch, 
                { backgroundColor: isRecurring ? COLORS.primary : colors.border }
              ]}
            >
              <View style={[styles.switchKnob, isRecurring && styles.switchKnobActive]} />
            </TouchableOpacity>
          </View>
          
          {isRecurring && (
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.freqBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    frequency === freq.value && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                  ]}
                  onPress={() => setFrequency(freq.value)}
                >
                  <Text style={[styles.freqText, { color: frequency === freq.value ? '#fff' : colors.textSecondary }]}>{freq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Payment Method ────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Payment Method</Text>
        <TouchableOpacity 
          style={[styles.selectionInput, { backgroundColor: colors.surfaceAlt, borderColor: errors.paymentMethod ? COLORS.expense : colors.border }]} 
          onPress={() => setActiveModal('paymentMethod')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {(() => {
              const pm = paymentMethods.find(p => p._id === selectedPaymentMethod);
              if (!pm) return <Text style={{ color: colors.textTertiary }}>Select Payment Method...</Text>;
              return (
                <>
                  <View style={[styles.selectionIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                    <Text style={styles.selectionIcon}>{pm.icon}</Text>
                  </View>
                  <Text style={[styles.selectionText, { color: colors.textPrimary }]}>{pm.name}</Text>
                </>
              );
            })()}
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {errors.paymentMethod && <Text style={styles.fieldError}>{errors.paymentMethod}</Text>}

        {/* ── Save Button ───────────────────────── */}
        <Button
          title={loading ? 'Saving...' : isEdit ? 'Update Transaction' : 'Add Transaction'}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: SPACING.base }}
        />

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* ── Selection Modal ───────────────────── */}
      <Modal visible={!!activeModal} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {activeModal === 'account' ? 'Select Account' :
                 activeModal === 'toAccount' ? 'Select Destination Account' :
                  activeModal === 'category' ? 'Select Category' :
                  activeModal === 'person' ? 'Select Person' :
                  'Select Payment Method'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {activeModal === 'account' || activeModal === 'toAccount' ? (
                accounts.map(acc => {
                  const isSelected = (activeModal === 'account' ? selectedAccount : selectedToAccount) === acc._id;
                  const displayLogo = acc.bankLogo || BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                  return (
                    <TouchableOpacity 
                      key={acc._id} 
                      style={[styles.modalOption, isSelected && { backgroundColor: `${COLORS.primary}15` }]}
                      onPress={() => {
                        if (activeModal === 'account') setSelectedAccount(acc._id);
                        else setSelectedToAccount(acc._id);
                        setActiveModal(null);
                      }}
                    >
                      <View style={[styles.selectionIconBg, { backgroundColor: `${acc.color}15` }]}>
                        {displayLogo ? <Image source={{ uri: displayLogo }} style={styles.selectionLogo} resizeMode="contain" /> : <Text style={styles.selectionIcon}>{acc.icon}</Text>}
                      </View>
                      <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{acc.name}</Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })
              ) : activeModal === 'category' ? (
                filteredCategories.map(cat => {
                  const isSelected = selectedCategory === cat._id;
                  return (
                    <TouchableOpacity 
                      key={cat._id} 
                      style={[styles.modalOption, isSelected && { backgroundColor: `${cat.color}15` }]}
                      onPress={() => {
                        setSelectedCategory(cat._id);
                        setActiveModal(null);
                      }}
                    >
                      <View style={[styles.selectionIconBg, { backgroundColor: `${cat.color}15` }]}>
                        <Text style={styles.selectionIcon}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{cat.name}</Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={cat.color} />}
                    </TouchableOpacity>
                  );
                })
              ) : activeModal === 'paymentMethod' ? (
                paymentMethods.map(pm => {
                  const isSelected = selectedPaymentMethod === pm._id;
                  return (
                    <TouchableOpacity 
                      key={pm._id} 
                      style={[styles.modalOption, isSelected && { backgroundColor: `${COLORS.primary}15` }]}
                      onPress={() => {
                        setSelectedPaymentMethod(pm._id);
                        setActiveModal(null);
                      }}
                    >
                      <View style={[styles.selectionIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                        <Text style={styles.selectionIcon}>{pm.icon}</Text>
                      </View>
                      <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{pm.name}</Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })
              ) : activeModal === 'person' ? (
                (() => {
                  const acc = accounts.find(a => a._id === selectedAccount);
                  return (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalOption, !selectedOtherPerson && { backgroundColor: `${COLORS.primary}15` }]}
                        onPress={() => {
                          setSelectedOtherPerson(null);
                          setActiveModal(null);
                        }}
                      >
                        <View style={[styles.selectionIconBg, { backgroundColor: `${colors.border}15` }]}>
                          <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>None (General)</Text>
                        {!selectedOtherPerson && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                      </TouchableOpacity>
                      {acc?.otherPersons?.map(person => {
                        const isSelected = selectedOtherPerson === person._id;
                        return (
                          <TouchableOpacity 
                            key={person._id} 
                            style={[styles.modalOption, isSelected && { backgroundColor: `${COLORS.primary}15` }]}
                            onPress={() => {
                              setSelectedOtherPerson(person._id);
                              setActiveModal(null);
                            }}
                          >
                            <View style={[styles.selectionIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
                              <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{person.name}</Text>
                            {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  );
                })()
              ) : null}
              <View style={{ height: SPACING.xl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="calendar"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* ── Custom Numeric Keyboard ───────────── */}
      <NumericKeyboard 
        visible={showKeyboard}
        initialValue={amount}
        onClose={() => setShowKeyboard(false)}
        onConfirm={(val) => {
          setAmount(val);
          setErrors(prev => ({ ...prev, amount: null }));
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: SPACING.base,
    padding: 2,
  },
  scroll: { padding: SPACING.xl },
  typeToggle: {
    flexDirection: 'row', borderRadius: RADIUS.lg,
    padding: SPACING.xs, marginBottom: SPACING.xl,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, padding: SPACING.md, borderRadius: RADIUS.md,
  },
  typeBtnText: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.xl, borderWidth: 1,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  currencySymbol: { fontSize: 36, fontWeight: '800', marginRight: SPACING.xs },
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm, letterSpacing: 0.3 },
  fieldError: { color: COLORS.expense, fontSize: FONT_SIZES.xs, marginTop: -SPACING.xs, marginBottom: SPACING.sm },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, marginBottom: SPACING.xl,
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
  },
  catIcon: { fontSize: 16 },
  accMiniIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  miniLogo: { width: 18, height: 18 },
  catLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', maxWidth: 90 },
  horizontalScroll: { flexDirection: 'row', marginBottom: SPACING.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  recurringCard: {
    borderRadius: RADIUS.lg, borderWidth: 1,
    padding: SPACING.md, marginBottom: SPACING.xl,
  },
  recurringHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  recurringTitle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  recurringLabel: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  switch: {
    width: 44, height: 24, borderRadius: 12,
    padding: 2,
  },
  switchKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
  },
  switchKnobActive: { alignSelf: 'flex-end' },
  frequencyRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginTop: SPACING.md, borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: SPACING.md,
  },
  freqBtn: {
    flex: 1, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1,
  },
  freqText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  paymentChip: {
    flex: 1, alignItems: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md,
  },
  paymentLabel: { fontSize: 10, fontWeight: '600' },
  selectionInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.xl,
  },
  selectionIconBg: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  selectionIcon: { fontSize: 16 },
  selectionLogo: { width: 22, height: 22 },
  selectionText: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl, paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  modalOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, gap: SPACING.md,
  },
  modalOptionText: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: '600' },
});
