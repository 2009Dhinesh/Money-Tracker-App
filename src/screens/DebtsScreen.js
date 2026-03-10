import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  StatusBar, Alert, TextInput, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { useContacts } from '../hooks/useContacts';
import { useAccounts } from '../hooks/useAccounts';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: COLORS.warning, bg: COLORS.warningLight, icon: 'time-outline' },
  partial: { label: 'Partial', color: '#2F80ED', bg: '#EBF3FF', icon: 'pie-chart-outline' },
  completed: { label: 'Completed', color: COLORS.income, bg: COLORS.incomeLight, icon: 'checkmark-circle' },
};

const RELATIONS = [
  { label: 'Friend', value: 'friend', icon: '🤝' },
  { label: 'Family', value: 'family', icon: '👨‍👩‍👧' },
  { label: 'Relative', value: 'relative', icon: '👥' },
  { label: 'Colleague', value: 'colleague', icon: '💼' },
  { label: 'Other', value: 'other', icon: '👤' },
];

const CONTACT_ICONS = ['👤', '👨', '👩', '🧑', '👦', '👧', '👨‍💼', '👩‍💼', '🧔', '👳', '👲', '🤝', '💼', '👥', '🏠', '❤️'];

const UPI_APPS = [
  { label: 'GPay', value: 'gpay', icon: '💚' },
  { label: 'PhonePe', value: 'phonepe', icon: '💜' },
  { label: 'Paytm', value: 'paytm', icon: '💙' },
  { label: 'Other', value: 'other', icon: '📱' },
];

export default function DebtsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { debts, summary, loading, fetchDebts, fetchSummary, recordRepayment, removeDebt } = useDebts();
  const { contacts, fetchContacts, addContact, editContact, removeContact } = useContacts();
  const { accounts, fetchAccounts } = useAccounts();
  const { openDrawer } = useAppDrawer();

  const [activeTab, setActiveTab] = useState('given');
  const [statusFilter, setStatusFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // Filter Modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterModalType, setFilterModalType] = useState('status'); // 'status' | 'contact'

  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRelation, setCRelation] = useState('friend');
  const [cNote, setCNote] = useState('');
  const [cIcon, setCIcon] = useState('👤');

  // Filter Search
  const [filterSearch, setFilterSearch] = useState('');

  // Repayment Modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayDebt, setRepayDebt] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('cash');
  const [repayBank, setRepayBank] = useState(null);
  const [repayTransferMode, setRepayTransferMode] = useState('');
  const [repayUpi, setRepayUpi] = useState('');
  const [repayNote, setRepayNote] = useState('');

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchDebts({ type: activeTab, status: statusFilter || undefined, contact: contactFilter || undefined }),
      fetchSummary(),
      fetchContacts(),
      fetchAccounts(),
    ]);
  }, [activeTab, statusFilter, contactFilter]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  // Re-fetch when filters change while screen is focused
  useEffect(() => {
    if (!refreshing) loadAll();
  }, [statusFilter, contactFilter]);

  const onRefresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const filteredDebts = (debts || []).filter(d => d.type === activeTab);

  const givenData = summary?.given || { total: 0, recovered: 0, pending: 0, count: 0 };
  const borrowedData = summary?.borrowed || { total: 0, repaid: 0, owing: 0, count: 0 };

  // ── Contact Modal Open / Reset ──
  const openAddContact = () => {
    setEditingContactId(null);
    setCName(''); setCPhone(''); setCRelation('friend'); setCNote(''); setCIcon('👤');
    setShowContactModal(true);
  };

  const openEditContact = (c) => {
    setEditingContactId(c._id);
    setCName(c.name); setCPhone(c.phone || ''); setCRelation(c.relation || 'friend'); setCNote(c.note || ''); setCIcon(c.icon || '👤');
    setShowContactModal(true);
  };

  if (loading && !refreshing && debts.length === 0) return <LoadingSpinner message="Loading debts..." />;

  // ── Contact Modal Save ──
  const handleSaveContact = async () => {
    if (!cName.trim()) return Alert.alert('Error', 'Name is required');
    try {
      const data = { name: cName.trim(), phone: cPhone.trim(), relation: cRelation, note: cNote.trim(), icon: cIcon };
      if (editingContactId) {
        await editContact(editingContactId, data);
        Alert.alert('✅', 'Contact updated');
      } else {
        await addContact(data);
        Alert.alert('✅', 'Contact added');
      }
      setShowContactModal(false);
      setEditingContactId(null);
      setCName(''); setCPhone(''); setCRelation('friend'); setCNote(''); setCIcon('👤');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDeleteContact = (id, name) => {
    Alert.alert('Delete Contact', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await removeContact(id); } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  // ── Repayment Modal ──
  const openRepayModal = (debt) => {
    setRepayDebt(debt);
    setRepayAmount('');
    setRepayMethod('cash');
    setRepayBank(null);
    setRepayTransferMode('');
    setRepayUpi('');
    setRepayNote('');
    setShowRepayModal(true);
  };

  const handleRepayment = async () => {
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Enter valid amount');
    if (amt > repayDebt.remainingAmount) return Alert.alert('Error', `Max ₹${repayDebt.remainingAmount}`);
    try {
      await recordRepayment(repayDebt._id, {
        amount: amt,
        paymentMethod: repayMethod,
        bankAccount: repayMethod === 'bank' ? repayBank : undefined,
        transferMode: repayTransferMode,
        upiApp: repayUpi,
        note: repayNote.trim(),
      });
      setShowRepayModal(false);
      await loadAll();
      Alert.alert('✅', 'Repayment recorded');
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Record', 'This will reverse all account impacts. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await removeDebt(id); await loadAll(); }},
    ]);
  };

  const isOverdue = (debt) => debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'completed';

  // ── Render ──
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.backBtn}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lending & Borrowing</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity onPress={() => setShowContacts(!showContacts)} style={[styles.iconBtn, { backgroundColor: showContacts ? COLORS.primary : colors.surfaceAlt }]}>
            <Ionicons name="people-outline" size={18} color={showContacts ? '#fff' : COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddDebt', { contacts, accounts })} style={[styles.iconBtn, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Tab Toggle */}
        <View style={[styles.tabRow, { backgroundColor: colors.surfaceAlt }]}>
          {['given', 'borrowed'].map(t => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && { backgroundColor: t === 'given' ? COLORS.expense : COLORS.income }]} onPress={() => { setActiveTab(t); setStatusFilter(''); setContactFilter(''); }}>
              <Ionicons name={t === 'given' ? 'arrow-up-circle' : 'arrow-down-circle'} size={16} color={activeTab === t ? '#fff' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === t ? '#fff' : colors.textSecondary }]}>
                {t === 'given' ? 'Money Given' : 'Money Borrowed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
              {activeTab === 'given' ? 'Total Given' : 'Total Borrowed'}
            </Text>
            <Text style={[styles.summaryAmount, { color: activeTab === 'given' ? COLORS.expense : COLORS.income }]}>
              ₹{(activeTab === 'given' ? givenData.total : borrowedData.total).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
              {activeTab === 'given' ? 'Recovered' : 'Repaid'}
            </Text>
            <Text style={[styles.summaryAmount, { color: COLORS.income }]}>
              ₹{(activeTab === 'given' ? givenData.recovered : borrowedData.repaid).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Outstanding</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.warning }]}>
              ₹{(activeTab === 'given' ? givenData.pending : borrowedData.owing).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterDropdownBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
            onPress={() => { setFilterModalType('status'); setFilterModalVisible(true); }}
          >
            <Text style={[styles.filterDropdownText, { color: colors.textPrimary }]} numberOfLines={1}>
              Status: <Text style={{ color: statusFilter === '' ? colors.textSecondary : COLORS.primary }}>
                {statusFilter === '' ? 'All' : STATUS_CONFIG[statusFilter]?.label}
              </Text>
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {contacts.length > 0 && (
            <TouchableOpacity 
              style={[styles.filterDropdownBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} 
              onPress={() => { setFilterModalType('contact'); setFilterModalVisible(true); }}
            >
              <Text style={[styles.filterDropdownText, { color: colors.textPrimary }]} numberOfLines={1}>
                People: <Text style={{ color: contactFilter === '' ? colors.textSecondary : COLORS.primary }}>
                  {contactFilter === '' ? 'All' : contacts.find(c => c._id === contactFilter)?.name || 'All'}
                </Text>
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Overdue Alert */}
        {summary?.overdueDebts?.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : COLORS.expenseLight }]}>
            <Ionicons name="warning" size={18} color={COLORS.expense} />
            <Text style={{ color: COLORS.expense, fontWeight: '600', fontSize: FONT_SIZES.sm, flex: 1, marginLeft: SPACING.sm }}>
              {summary.overdueDebts.length} overdue payment{summary.overdueDebts.length > 1 ? 's' : ''}!
            </Text>
          </View>
        )}

        {/* Debt List */}
        {filteredDebts.length === 0 ? (
          <EmptyState
            icon={activeTab === 'given' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
            title="No records yet"
            subtitle={`Tap + to add ${activeTab === 'given' ? 'money given' : 'money borrowed'}`}
          >
            <Button 
              title={activeTab === 'given' ? "+ Set First Record" : "+ Set First Record"} 
              onPress={() => navigation.navigate('AddDebt', { contacts, accounts })}
            />
          </EmptyState>
        ) : (
          filteredDebts.map(debt => {
            const sc = STATUS_CONFIG[debt.status];
            const overdue = isOverdue(debt);
            const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;

            return (
              <TouchableOpacity key={debt._id} style={[styles.debtCard, { backgroundColor: colors.surface, borderColor: overdue ? COLORS.expense : colors.border }, SHADOWS.sm, overdue && { borderWidth: 1.5 }]}
                onPress={() => navigation.navigate('DebtDetail', { debtId: debt._id })}
                onLongPress={() => handleDelete(debt._id)}>

                {/* Top Row */}
                <View style={styles.debtTop}>
                  <View style={styles.debtPerson}>
                    <View style={[styles.personIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                      <Text style={{ fontSize: 20 }}>{debt.contact?.icon || '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.personName, { color: colors.textPrimary }]}>{debt.contact?.name || 'Unknown'}</Text>
                      <Text style={[styles.personRelation, { color: colors.textTertiary }]}>
                        {debt.contact?.relation} {debt.date ? `· ${new Date(debt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.debtAmount, { color: activeTab === 'given' ? COLORS.expense : COLORS.income }]}>
                      ₹{debt.totalAmount.toLocaleString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? `${sc.color}22` : sc.bg }]}>
                      <Ionicons name={sc.icon} size={10} color={sc.color} />
                      <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Progress */}
                {debt.status !== 'pending' && (
                  <View style={{ marginTop: SPACING.sm }}>
                    <View style={[styles.progressBg, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: sc.color }]} />
                    </View>
                    <View style={styles.progressInfo}>
                      <Text style={[styles.progressText, { color: colors.textTertiary }]}>Paid: ₹{debt.paidAmount.toLocaleString()}</Text>
                      <Text style={[styles.progressText, { color: COLORS.warning }]}>Left: ₹{debt.remainingAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {/* Overdue Badge */}
                {overdue && (
                  <View style={[styles.overdueBadge, { backgroundColor: `${COLORS.expense}15` }]}>
                    <Ionicons name="alert-circle" size={12} color={COLORS.expense} />
                    <Text style={{ color: COLORS.expense, fontSize: FONT_SIZES.xs, fontWeight: '600', marginLeft: 4 }}>
                      Overdue since {new Date(debt.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                )}

                {/* Note */}
                {debt.note ? <Text style={[styles.debtNote, { color: colors.textTertiary }]} numberOfLines={1}>📝 {debt.note}</Text> : null}

                {/* Actions */}
                {debt.status !== 'completed' && (
                  <TouchableOpacity style={[styles.repayBtn, { backgroundColor: `${COLORS.income}15` }]} onPress={() => openRepayModal(debt)}>
                    <Ionicons name="cash-outline" size={14} color={COLORS.income} />
                    <Text style={{ color: COLORS.income, fontWeight: '700', fontSize: FONT_SIZES.sm, marginLeft: 6 }}>
                      {activeTab === 'given' ? 'Record Return' : 'Record Payment'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Contact List Section */}
        {showContacts && (
        <View style={{ marginTop: SPACING['2xl'] }}>
          <View style={styles.contactSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>👥 Contacts ({contacts.length})</Text>
            <TouchableOpacity onPress={openAddContact} style={[styles.addContactBtn, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="person-add" size={14} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Add</Text>
            </TouchableOpacity>
          </View>

          {contacts.length === 0 ? (
            <TouchableOpacity onPress={openAddContact} style={[styles.emptyContactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyContactIcon, { backgroundColor: `${COLORS.primary}10` }]}>
                <Ionicons name="person-add-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={[styles.emptyContactTitle, { color: colors.textSecondary }]}>No contacts yet</Text>
              <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, textAlign: 'center' }}>Tap here to add your first contact</Text>
            </TouchableOpacity>
          ) : (
            contacts.map(c => {
              const relInfo = RELATIONS.find(r => r.value === c.relation);
              return (
                <View key={c._id} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
                  <View style={[styles.contactAvatar, { backgroundColor: `${COLORS.primary}12` }]}>
                    <Text style={{ fontSize: 24 }}>{c.icon || '👤'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={[styles.contactName, { color: colors.textPrimary }]}>{c.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: SPACING.sm }}>
                      <View style={[styles.relationTag, { backgroundColor: `${COLORS.primary}10` }]}>
                        <Text style={{ fontSize: 10 }}>{relInfo?.icon || '👤'}</Text>
                        <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.xs, fontWeight: '600' }}>{relInfo?.label || c.relation}</Text>
                      </View>
                      {c.phone ? <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs }}>📞 {c.phone}</Text> : null}
                    </View>
                    {c.note ? <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.xs, marginTop: 3 }} numberOfLines={1}>📝 {c.note}</Text> : null}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity onPress={() => openEditContact(c)} style={[styles.contactActionBtn, { backgroundColor: `${COLORS.primary}12` }]}>
                      <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(c._id, c.name)} style={[styles.contactActionBtn, { backgroundColor: `${COLORS.expense}12` }]}>
                      <Ionicons name="trash-outline" size={15} color={COLORS.expense} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>

      {/* ── Add/Edit Contact Modal ── */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingContactId ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={() => { setShowContactModal(false); setEditingContactId(null); }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Icon Picker */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Choose Icon</Text>
            <View style={styles.iconPickerGrid}>
              {CONTACT_ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconPickerBtn, { backgroundColor: cIcon === ic ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: cIcon === ic ? COLORS.primary : colors.border }]} onPress={() => setCIcon(ic)}>
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} placeholder="Name *" placeholderTextColor={colors.textTertiary} value={cName} onChangeText={setCName} />
            <TextInput style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} placeholder="Phone (optional)" placeholderTextColor={colors.textTertiary} value={cPhone} onChangeText={setCPhone} keyboardType="phone-pad" />
            <TextInput style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} placeholder="Note (optional)" placeholderTextColor={colors.textTertiary} value={cNote} onChangeText={setCNote} />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Relation</Text>
            <View style={styles.chipGrid}>
              {RELATIONS.map(r => (
                <TouchableOpacity key={r.value} style={[styles.relChip, { backgroundColor: cRelation === r.value ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: cRelation === r.value ? COLORS.primary : colors.border }]} onPress={() => setCRelation(r.value)}>
                  <Text style={{ fontSize: 14 }}>{r.icon}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: cRelation === r.value ? COLORS.primary : colors.textSecondary }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={handleSaveContact}>
              <Ionicons name={editingContactId ? 'checkmark-circle' : 'person-add'} size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base, marginLeft: SPACING.sm }}>{editingContactId ? 'Update Contact' : 'Save Contact'}</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Repayment Modal ── */}
      <Modal visible={showRepayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {repayDebt?.type === 'given' ? 'Record Return' : 'Record Payment'}
              </Text>
              <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {repayDebt && (
              <View style={[styles.repayInfo, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm }}>
                  {repayDebt.contact?.name} · Remaining: <Text style={{ color: COLORS.warning, fontWeight: '700' }}>₹{repayDebt.remainingAmount.toLocaleString()}</Text>
                </Text>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt, fontSize: 24, fontWeight: '800' }]} placeholder="0" placeholderTextColor={colors.textTertiary} value={repayAmount} onChangeText={setRepayAmount} keyboardType="decimal-pad" />

            {repayDebt && (
              <TouchableOpacity onPress={() => setRepayAmount(repayDebt.remainingAmount.toString())} style={{ marginBottom: SPACING.md }}>
                <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.sm }}>Pay Full ₹{repayDebt.remainingAmount.toLocaleString()}</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <View style={styles.chipGrid}>
              {['cash', 'bank'].map(m => (
                <TouchableOpacity key={m} style={[styles.relChip, { backgroundColor: repayMethod === m ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: repayMethod === m ? COLORS.primary : colors.border }]} onPress={() => { setRepayMethod(m); if (m === 'cash') { setRepayBank(null); setRepayTransferMode(''); setRepayUpi(''); } }}>
                  <Text style={{ fontSize: 14 }}>{m === 'cash' ? '💵' : '🏦'}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: repayMethod === m ? COLORS.primary : colors.textSecondary }}>{m === 'cash' ? 'Cash' : 'Bank'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {repayMethod === 'bank' && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                  {accounts.map(acc => {
                    const logo = acc.bankLogo || BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                    return (
                      <TouchableOpacity key={acc._id} style={[styles.accChip, { backgroundColor: repayBank === acc._id ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: repayBank === acc._id ? COLORS.primary : colors.border }]} onPress={() => setRepayBank(acc._id)}>
                        {logo ? <Image source={{ uri: logo }} style={{ width: 18, height: 18 }} resizeMode="contain" /> : <Text style={{ fontSize: 14 }}>{acc.icon}</Text>}
                        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: repayBank === acc._id ? COLORS.primary : colors.textSecondary }}>{acc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Transfer Mode</Text>
                <View style={styles.chipGrid}>
                  {['upi', 'account_transfer'].map(m => (
                    <TouchableOpacity key={m} style={[styles.relChip, { backgroundColor: repayTransferMode === m ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: repayTransferMode === m ? COLORS.primary : colors.border }]} onPress={() => setRepayTransferMode(m)}>
                      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: repayTransferMode === m ? COLORS.primary : colors.textSecondary }}>{m === 'upi' ? 'UPI' : 'Transfer'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {repayTransferMode === 'upi' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>UPI App</Text>
                    <View style={styles.chipGrid}>
                      {UPI_APPS.map(a => (
                        <TouchableOpacity key={a.value} style={[styles.relChip, { backgroundColor: repayUpi === a.value ? `${COLORS.primary}22` : colors.surfaceAlt, borderColor: repayUpi === a.value ? COLORS.primary : colors.border }]} onPress={() => setRepayUpi(a.value)}>
                          <Text style={{ fontSize: 14 }}>{a.icon}</Text>
                          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: repayUpi === a.value ? COLORS.primary : colors.textSecondary }}>{a.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            <TextInput style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} placeholder="Note (optional)" placeholderTextColor={colors.textTertiary} value={repayNote} onChangeText={setRepayNote} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.income }]} onPress={handleRepayment}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.base }}>Record Payment</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.surface, paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {filterModalType === 'status' ? 'Select Status' : 'Select Contact'}
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {filterModalType === 'status' ? (
                ['', 'pending', 'partial', 'completed'].map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.sheetOption, statusFilter === s && { backgroundColor: `${COLORS.primary}15` }, { borderBottomColor: colors.border }]}
                    onPress={() => { setStatusFilter(s); setFilterModalVisible(false); }}
                  >
                    <Text style={[styles.sheetOptionText, { color: statusFilter === s ? COLORS.primary : colors.textPrimary }]}>
                      {s === '' ? 'All Statuses' : STATUS_CONFIG[s]?.label}
                    </Text>
                    {statusFilter === s && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))
              ) : (
                <>
                  <View style={[styles.modalSearchContainer, { borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
                    <TextInput 
                      style={[styles.modalSearchInput, { color: colors.textPrimary }]} 
                      placeholder="Search people..." 
                      placeholderTextColor={colors.textTertiary} 
                      value={filterSearch} 
                      onChangeText={setFilterSearch} 
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.sheetOption, contactFilter === '' && { backgroundColor: `${COLORS.primary}15` }, { borderBottomColor: colors.border }]}
                    onPress={() => { setContactFilter(''); setFilterModalVisible(false); setFilterSearch(''); }}
                  >
                    <Text style={[styles.sheetOptionText, { color: contactFilter === '' ? COLORS.primary : colors.textPrimary }]}>All Contacts</Text>
                    {contactFilter === '' && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                  {contacts.filter(c => c.name.toLowerCase().includes(filterSearch.toLowerCase())).map(c => (
                    <TouchableOpacity 
                      key={c._id} 
                      style={[styles.sheetOption, contactFilter === c._id && { backgroundColor: `${COLORS.primary}15` }, { borderBottomColor: colors.border }]}
                      onPress={() => { setContactFilter(c._id); setFilterModalVisible(false); setFilterSearch(''); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                        <Text style={[styles.sheetOptionText, { color: contactFilter === c._id ? COLORS.primary : colors.textPrimary }]}>{c.name}</Text>
                      </View>
                      {contactFilter === c._id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
  tabRow: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.xs, marginBottom: SPACING.xl },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  tabText: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  summaryCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1 },
  summaryLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: FONT_SIZES.md, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  filterDropdownBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 12, borderRadius: RADIUS.lg, borderWidth: 1 },
  filterDropdownText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderRadius: RADIUS.md, marginBottom: 4 },
  sheetOptionText: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xl },
  debtCard: { borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.md, borderWidth: 1 },
  debtTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  debtPerson: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: SPACING.sm },
  personIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  personName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  personRelation: { fontSize: FONT_SIZES.xs, marginTop: 2 },
  debtAmount: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  progressBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
  overdueBadge: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xs, borderRadius: RADIUS.sm, marginTop: SPACING.sm },
  debtNote: { fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
  repayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', marginBottom: SPACING.md },
  contactSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  contactAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  relationTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  contactActions: { flexDirection: 'column', gap: SPACING.xs },
  contactActionBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyContactCard: { alignItems: 'center', padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  emptyContactIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  emptyContactTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', marginBottom: 4 },
  iconPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  iconPickerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: SPACING['3xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, marginBottom: SPACING.md, fontSize: FONT_SIZES.base },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  relChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm },
  repayInfo: { padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg, marginTop: SPACING.md },
  modalSearchContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md, marginHorizontal: SPACING.sm },
  modalSearchInput: { flex: 1, fontSize: FONT_SIZES.sm, paddingVertical: 8 },
});
