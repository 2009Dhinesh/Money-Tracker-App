import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Alert, TextInput, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { useContacts } from '../hooks/useContacts';
import { useAccounts } from '../hooks/useAccounts';
import Button from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import NumericKeyboard from '../components/NumericKeyboard';

const UPI_APPS = [
  { label: 'GPay', value: 'gpay', icon: '💚' },
  { label: 'PhonePe', value: 'phonepe', icon: '💜' },
  { label: 'Paytm', value: 'paytm', icon: '💙' },
  { label: 'Other', value: 'other', icon: '📱' },
];

const RELATIONS = [
  { label: 'Friend', value: 'friend', icon: '🤝' },
  { label: 'Family', value: 'family', icon: '👨‍👩‍👧' },
  { label: 'Relative', value: 'relative', icon: '👥' },
  { label: 'Colleague', value: 'colleague', icon: '💼' },
  { label: 'Other', value: 'other', icon: '👤' },
];

const CONTACT_ICONS = ['👤', '👨', '👩', '🧑', '👦', '👧', '👨‍💼', '👩‍💼', '🧔', '👳', '👲', '🤝', '💼', '👥', '🏠', '❤️'];

export default function AddDebtScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { addDebt } = useDebts();
  const { contacts, fetchContacts, addContact } = useContacts();
  const { accounts, fetchAccounts } = useAccounts();

  const [type, setType] = useState('given');
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [date, setDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(null);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankAccount, setBankAccount] = useState(null);
  const [transferMode, setTransferMode] = useState('');
  const [upiApp, setUpiApp] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // New Contact States
  const [showContactModal, setShowContactModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRelation, setCRelation] = useState('friend');
  const [cNote, setCNote] = useState('');
  const [cIcon, setCIcon] = useState('👤');

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

  const handleSaveContact = async () => {
    if (!cName.trim()) return Alert.alert('Error', 'Name is required');
    try {
      const data = { name: cName.trim(), phone: cPhone.trim(), relation: cRelation, note: cNote.trim(), icon: cIcon };
      const newContact = await addContact(data);
      if (newContact) setSelectedContact(newContact._id);
      setShowContactModal(false);
      setCName(''); setCPhone(''); setCRelation('friend'); setCNote(''); setCIcon('👤');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await addDebt({
        type,
        totalAmount: parseFloat(amount),
        contact: selectedContact,
        date: date.toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        note: note.trim(),
        paymentMethod,
        bankAccount: paymentMethod === 'bank' ? bankAccount : undefined,
        transferMode: paymentMethod === 'bank' ? transferMode : undefined,
        upiApp: transferMode === 'upi' ? upiApp : undefined,
      });

      if (res.budgetMessage) {
        sendInstantNotification('⚠️ Account Limit Alert!', res.budgetMessage.message);
        Alert.alert('Limit Alert ⚠️', res.budgetMessage.message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('✅', `${type === 'given' ? 'Lending' : 'Borrowing'} recorded`);
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Record</Text>
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
              { flex: 1, fontSize: 36, fontWeight: '800', paddingVertical: SPACING.xs },
              { color: amount ? (type === 'given' ? COLORS.expense : COLORS.income) : colors.textTertiary }
            ]}
          >
            {amount || '0.00'}
          </Text>
        </TouchableOpacity>
        {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

        {/* Contact Picker */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
            {type === 'given' ? 'Given to' : 'Borrowed from'}
          </Text>
          {contacts.length > 0 && (
            <TouchableOpacity onPress={() => setShowContactModal(true)}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Add New +</Text>
            </TouchableOpacity>
          )}
        </View>

        {errors.contact && <Text style={styles.error}>{errors.contact}</Text>}
        
        {contacts.length === 0 ? (
          <TouchableOpacity 
            style={[styles.emptyContactBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => setShowContactModal(true)}
          >
            <View style={[styles.plusIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="person-add" size={24} color={COLORS.primary} />
            </View>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', marginTop: SPACING.sm }}>+ Add Person</Text>
            <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>No people in your list yet</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.xl }}>
            {contacts.map(c => (
              <TouchableOpacity key={c._id} style={[styles.contactChip, { backgroundColor: selectedContact === c._id ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: selectedContact === c._id ? COLORS.primary : colors.border }]} onPress={() => setSelectedContact(c._id)}>
                <Text style={{ fontSize: 16 }}>{c.icon}</Text>
                <Text style={{ fontWeight: '600', fontSize: FONT_SIZES.sm, color: selectedContact === c._id ? COLORS.primary : colors.textSecondary }}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.contactChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderStyle: 'dotted' }]} 
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="add" size={16} color={colors.textSecondary} />
              <Text style={{ fontWeight: '600', fontSize: FONT_SIZES.sm, color: colors.textSecondary }}>Add New</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Dates */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
        <TouchableOpacity 
          style={[styles.dateInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>
            {format(date, 'PPP')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date (optional)</Text>
        <TouchableOpacity 
          style={[styles.dateInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
          onPress={() => setShowDueDatePicker(true)}
        >
          <Ionicons name="timer-outline" size={20} color={colors.textTertiary} />
          <Text style={{ color: dueDate ? colors.textPrimary : colors.textTertiary, fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>
            {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)} style={{ marginLeft: 'auto' }}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {showDueDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDueDatePicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        {/* Payment Method */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Source</Text>
        <View style={[styles.typeRow, { backgroundColor: colors.surfaceAlt }]}>
          {['cash', 'bank'].map(m => (
            <TouchableOpacity 
              key={m} 
              style={[
                styles.typeBtn, 
                paymentMethod === m && { backgroundColor: COLORS.primary }
              ]} 
              onPress={() => { 
                setPaymentMethod(m); 
                if (m === 'cash') { setBankAccount(null); setTransferMode(''); setUpiApp(''); } 
              }}
            >
              <Text style={{ fontSize: 16 }}>{m === 'cash' ? '💵' : '🏦'}</Text>
              <Text style={[styles.typeText, { color: paymentMethod === m ? '#fff' : colors.textSecondary }]}>
                {m === 'cash' ? 'Cash' : 'Bank Account'}
              </Text>
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
        <Button
          title={saving ? 'Saving...' : type === 'given' ? 'Record Lending' : 'Record Borrowing'}
          onPress={handleSave}
          loading={saving}
          variant={type === 'given' ? 'danger' : 'success'}
          icon={<Ionicons name={type === 'given' ? 'arrow-up-circle' : 'arrow-down-circle'} size={20} color="#fff" />}
          style={{ marginTop: SPACING.md }}
        />

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

      {/* ── Add Contact Modal ── */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Person</Text>
                <TouchableOpacity onPress={() => setShowContactModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Icon Picker */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Choose Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                <View style={styles.iconPickerGrid}>
                  {CONTACT_ICONS.map(ic => (
                    <TouchableOpacity key={ic} style={[styles.iconPickerBtn, { backgroundColor: cIcon === ic ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: cIcon === ic ? COLORS.primary : colors.border }]} onPress={() => setCIcon(ic)}>
                      <Text style={{ fontSize: 20 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput 
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} 
                placeholder="Name *" 
                placeholderTextColor={colors.textTertiary} 
                value={cName} 
                onChangeText={setCName} 
              />
              <TextInput 
                style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} 
                placeholder="Phone (optional)" 
                placeholderTextColor={colors.textTertiary} 
                value={cPhone} 
                onChangeText={setCPhone} 
                keyboardType="phone-pad" 
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Relation</Text>
              <View style={styles.chipGrid}>
                {RELATIONS.map(r => (
                  <TouchableOpacity key={r.value} style={[styles.relChip, { backgroundColor: cRelation === r.value ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: cRelation === r.value ? COLORS.primary : colors.border }]} onPress={() => setCRelation(r.value)}>
                    <Text style={{ fontSize: 14 }}>{r.icon}</Text>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: cRelation === r.value ? COLORS.primary : colors.textSecondary }}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button 
                title="Save Person"
                onPress={handleSaveContact}
                icon={<Ionicons name="person-add" size={18} color="#fff" />}
                style={{ marginTop: SPACING.md }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  typeRow: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.xs, marginBottom: SPACING.xl },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  typeText: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  amountCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.xl, borderWidth: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base, marginBottom: SPACING.sm },
  currSign: { fontSize: 36, fontWeight: '800', marginRight: SPACING.xs },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm, letterSpacing: 0.3 },
  error: { color: COLORS.expense, fontSize: FONT_SIZES.xs, marginBottom: SPACING.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.xl, fontSize: FONT_SIZES.base },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
  },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  emptyContactBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: SPACING.xl,
  },
  plusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.md, fontSize: FONT_SIZES.base },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  iconPickerGrid: { flexDirection: 'row', gap: SPACING.sm, paddingRight: SPACING.xl },
  iconPickerBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  relChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg, marginTop: SPACING.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base },
});
