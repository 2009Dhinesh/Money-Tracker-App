import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Alert, TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { useContacts } from '../hooks/useContacts';
import { useAccounts } from '../hooks/useAccounts';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import NumericKeyboard from '../components/NumericKeyboard';

const UPI_APPS = [
  { label: 'GPay', value: 'gpay', icon: '💚' },
  { label: 'PhonePe', value: 'phonepe', icon: '💜' },
  { label: 'Paytm', value: 'paytm', icon: '💙' },
  { label: 'Other', value: 'other', icon: '📱' },
];

export default function AddDebtScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { addDebt } = useDebts();
  const { contacts, fetchContacts } = useContacts();
  const { accounts, fetchAccounts } = useAccounts();

  const [type, setType] = useState('given');
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankAccount, setBankAccount] = useState(null);
  const [transferMode, setTransferMode] = useState('');
  const [upiApp, setUpiApp] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showKeyboard, setShowKeyboard] = useState(false);

  useEffect(() => { fetchContacts(); fetchAccounts(); }, []);

  const validate = () => {
    const e = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter valid amount';
    if (!selectedContact) e.contact = 'Select a person';
    if (!date) e.date = 'Date is required';
    if (paymentMethod === 'bank' && !bankAccount) e.bank = 'Select an account';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await addDebt({
        type,
        totalAmount: parseFloat(amount),
        contact: selectedContact,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        note: note.trim(),
        paymentMethod,
        bankAccount: paymentMethod === 'bank' ? bankAccount : undefined,
        transferMode: paymentMethod === 'bank' ? transferMode : undefined,
        upiApp: transferMode === 'upi' ? upiApp : undefined,
      });
      Alert.alert('✅', `${type === 'given' ? 'Lending' : 'Borrowing'} recorded`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Record</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Type Toggle */}
        <View style={[styles.typeRow, { backgroundColor: colors.surfaceAlt }]}>
          {['given', 'borrowed'].map(t => (
            <TouchableOpacity key={t} style={[styles.typeBtn, type === t && { backgroundColor: t === 'given' ? COLORS.expense : COLORS.income }]} onPress={() => setType(t)}>
              <Ionicons name={t === 'given' ? 'arrow-up' : 'arrow-down'} size={16} color={type === t ? '#fff' : colors.textSecondary} />
              <Text style={[styles.typeText, { color: type === t ? '#fff' : colors.textSecondary }]}>
                {t === 'given' ? 'Money Given' : 'Money Borrowed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <TouchableOpacity
          style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: errors.amount ? COLORS.expense : colors.border }]}
          onPress={() => setShowKeyboard(true)}
        >
          <Text style={[styles.currSign, { color: type === 'given' ? COLORS.expense : COLORS.income }]}>₹</Text>
          <Text 
            style={[
              styles.amountInput, 
              { color: amount ? (type === 'given' ? COLORS.expense : COLORS.income) : colors.textTertiary }
            ]}
          >
            {amount || '0.00'}
          </Text>
        </TouchableOpacity>
        {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

        {/* Contact Picker */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {type === 'given' ? 'Given to' : 'Borrowed from'}
        </Text>
        {errors.contact && <Text style={styles.error}>{errors.contact}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.xl }}>
          {contacts.map(c => (
            <TouchableOpacity key={c._id} style={[styles.contactChip, { backgroundColor: selectedContact === c._id ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: selectedContact === c._id ? COLORS.primary : colors.border }]} onPress={() => setSelectedContact(c._id)}>
              <Text style={{ fontSize: 16 }}>{c.icon}</Text>
              <Text style={{ fontWeight: '600', fontSize: FONT_SIZES.sm, color: selectedContact === c._id ? COLORS.primary : colors.textSecondary }}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dates */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date (optional)</Text>
        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

        {/* Payment Method */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Source</Text>
        <View style={styles.chipRow}>
          {['cash', 'bank'].map(m => (
            <TouchableOpacity key={m} style={[styles.methodChip, { backgroundColor: paymentMethod === m ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: paymentMethod === m ? COLORS.primary : colors.border }]} onPress={() => { setPaymentMethod(m); if (m === 'cash') { setBankAccount(null); setTransferMode(''); setUpiApp(''); } }}>
              <Text style={{ fontSize: 16 }}>{m === 'cash' ? '💵' : '🏦'}</Text>
              <Text style={{ fontWeight: '600', color: paymentMethod === m ? COLORS.primary : colors.textSecondary }}>{m === 'cash' ? 'Cash' : 'Bank Account'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.bank && <Text style={styles.error}>{errors.bank}</Text>}

        {paymentMethod === 'bank' && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Select Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {accounts.map(acc => {
                const logo = acc.bankLogo || BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                return (
                  <TouchableOpacity key={acc._id} style={[styles.contactChip, { backgroundColor: bankAccount === acc._id ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: bankAccount === acc._id ? COLORS.primary : colors.border }]} onPress={() => setBankAccount(acc._id)}>
                    {logo ? <Image source={{ uri: logo }} style={{ width: 20, height: 20 }} resizeMode="contain" /> : <Text style={{ fontSize: 16 }}>{acc.icon}</Text>}
                    <Text style={{ fontWeight: '600', fontSize: FONT_SIZES.sm, color: bankAccount === acc._id ? COLORS.primary : colors.textSecondary }}>{acc.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Transfer Mode</Text>
            <View style={styles.chipRow}>
              {['upi', 'account_transfer'].map(m => (
                <TouchableOpacity key={m} style={[styles.methodChip, { backgroundColor: transferMode === m ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: transferMode === m ? COLORS.primary : colors.border }]} onPress={() => setTransferMode(m)}>
                  <Text style={{ fontWeight: '600', color: transferMode === m ? COLORS.primary : colors.textSecondary }}>{m === 'upi' ? '📲 UPI' : '🔄 Account Transfer'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {transferMode === 'upi' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>UPI App</Text>
                <View style={styles.chipRow}>
                  {UPI_APPS.map(a => (
                    <TouchableOpacity key={a.value} style={[styles.methodChip, { backgroundColor: upiApp === a.value ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: upiApp === a.value ? COLORS.primary : colors.border }]} onPress={() => setUpiApp(a.value)}>
                      <Text>{a.icon}</Text>
                      <Text style={{ fontWeight: '600', color: upiApp === a.value ? COLORS.primary : colors.textSecondary }}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Note */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Note (optional)</Text>
        <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, minHeight: 60 }]} value={note} onChangeText={setNote} placeholder="Add details..." placeholderTextColor={colors.textTertiary} multiline />

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: type === 'given' ? COLORS.expense : COLORS.income }]} onPress={handleSave} disabled={saving}>
          <Ionicons name={type === 'given' ? 'arrow-up-circle' : 'arrow-down-circle'} size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : type === 'given' ? 'Record Lending' : 'Record Borrowing'}</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingTop: 56, paddingBottom: SPACING.base, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SPACING.xl },
  typeRow: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.xs, marginBottom: SPACING.xl },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  typeText: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  amountCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.xl, borderWidth: 1.5, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, marginBottom: SPACING.sm },
  currSign: { fontSize: 36, fontWeight: '800', marginRight: SPACING.xs },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', paddingVertical: SPACING.xs },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm, letterSpacing: 0.3 },
  error: { color: COLORS.expense, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.xl, fontSize: FONT_SIZES.base },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  methodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.full, borderWidth: 1.5 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg, marginTop: SPACING.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base },
});
