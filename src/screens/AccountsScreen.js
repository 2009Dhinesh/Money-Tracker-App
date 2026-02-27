import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Modal, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import { useAppDrawer } from '../context/DrawerContext';

const ACCOUNT_TYPES = [
  { label: 'Cash', value: 'cash', icon: '💵' },
  { label: 'Bank', value: 'bank', icon: '🏦' },
  { label: 'Credit Card', value: 'credit_card', icon: '💳' },
  { label: 'E-Wallet', value: 'e_wallet', icon: '📱' },
  { label: 'Other', value: 'other', icon: '💰' },
];


const PRESET_COLORS = ['#27AE60', '#2F80ED', '#9B51E0', '#EB5757', '#F2994A', '#6C63FF'];

export default function AccountsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { accounts, fetchAccounts, addAccount, editAccount, removeAccount, loading } = useAccounts();
  const { openDrawer } = useAppDrawer();
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [bankName, setBankName] = useState('');
  const [bankLogo, setBankLogo] = useState(null);
  const [balance, setBalance] = useState('0');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('💵');

  const [showTypeInput, setShowTypeInput] = useState(false);
  const [customType, setCustomType] = useState('');
  
  const [showNewBankInput, setShowNewBankInput] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  useEffect(() => { fetchAccounts(); }, []);

  const resetForm = () => {
    setName('');
    setType('cash');
    setBankName('');
    setBankLogo(null);
    setBalance('0');
    setSelectedColor(PRESET_COLORS[0]);
    setSelectedIcon('💵');
    setIsEdit(false);
    setCurrentId(null);
    setShowTypeInput(false);
    setCustomType('');
    setShowNewBankInput(false);
    setNewBankName('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (acc) => {
    setName(acc.name);
    setType(acc.type);
    setBankName(acc.bankName || '');
    setBankLogo(acc.bankLogo || null);
    setBalance(acc.balance.toString());
    setSelectedColor(acc.color);
    setSelectedIcon(acc.icon);
    setIsEdit(true);
    setCurrentId(acc._id);
    setModalVisible(true);

    const isExistingType = ACCOUNT_TYPES.some(t => t.value === acc.type);
    if (!isExistingType) {
      setShowTypeInput(true);
      setCustomType(acc.type);
    }
    
    const isExistingBank = BANK_LIST.some(b => b.name === acc.bankName);
    if (acc.type === 'bank' && !isExistingBank && acc.bankName) {
      setShowNewBankInput(true);
      setNewBankName(acc.bankName);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    if (type === 'bank' && !showNewBankInput && !bankName) return Alert.alert('Error', 'Please select a bank');
    if (type === 'bank' && showNewBankInput && !newBankName.trim()) return Alert.alert('Error', 'Bank name is required');
    
    try {
      const finalType = showTypeInput ? customType.toLowerCase() : type;
      if (showTypeInput && !customType.trim()) return Alert.alert('Error', 'Custom type name is required');

      let resolvedBankName = type === 'bank' ? (showNewBankInput ? newBankName.trim() : bankName) : '';
      
      // Fallback: If bank type but no bank name selected, check if Account Name matches a bank
      if (type === 'bank' && !resolvedBankName && name.trim()) {
        const matchingBank = BANK_LIST.find(b => b.name.toLowerCase() === name.trim().toLowerCase());
        if (matchingBank) resolvedBankName = matchingBank.name;
      }

      let finalBankLogo = bankLogo;
      
      // If no logo is set but it's a known bank, pull the logo from BANK_LIST
      if (type === 'bank' && !finalBankLogo && resolvedBankName) {
        const knownBank = BANK_LIST.find(b => b.name === resolvedBankName);
        if (knownBank) finalBankLogo = knownBank.logo;
      }

      const data = {
        name: name.trim(),
        type: finalType,
        bankName: type === 'bank' ? resolvedBankName : undefined,
        bankLogo: type === 'bank' ? (finalBankLogo || '') : undefined,
        balance: parseFloat(balance),
        color: selectedColor,
        icon: selectedIcon,
      };

      if (isEdit) {
        await editAccount(currentId, data);
      } else {
        await addAccount(data);
      }
      setModalVisible(false);
      resetForm();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will only work if there are no transactions linked to this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeAccount(id) },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.backBtn}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Accounts</Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {accounts.map((acc) => (
          <View key={acc._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}>
            <View style={[styles.cardIcon, { backgroundColor: `${acc.color}18` }]}>
              {(() => {
                // Determine which logo to show: 
                // 1. Direct saved logo
                // 2. Lookup by bankName field
                // 3. Lookup by account name (fallback for old data)
                const logoFromBankList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                const displayLogo = acc.bankLogo || logoFromBankList;
                
                if (displayLogo) {
                  return (
                    <Image 
                      source={{ uri: displayLogo }} 
                      style={styles.logoImage} 
                      resizeMode="contain"
                    />
                  );
                }
                return <Text style={{ fontSize: 24 }}>{acc.icon}</Text>;
              })()}
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{acc.name}</Text>
              <Text style={[styles.type, { color: colors.textSecondary }]}>
                {acc.type.toUpperCase()}{acc.bankName ? ` • ${acc.bankName}` : ''}
              </Text>
            </View>
            <View style={styles.cardBalance}>
              <Text style={[styles.balanceNum, { color: colors.textPrimary }]}>₹{acc.balance.toLocaleString()}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleOpenEdit(acc)} style={styles.actionBtn}>
                  <Ionicons name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(acc._id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── Add/Edit Modal ───────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Account' : 'New Account'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Account Name"
                placeholder="e.g. My Savings"
                value={name}
                onChangeText={setName}
              />

              <Input
                label="Current Balance"
                keyboardType="numeric"
                value={balance}
                onChangeText={setBalance}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Account Type</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((at) => (
                  <TouchableOpacity
                    key={at.value}
                    style={[
                      styles.typeBtn,
                      { backgroundColor: colors.surfaceAlt },
                      type === at.value && !showTypeInput && { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary, borderWidth: 1 }
                    ]}
                    onPress={() => { 
                      setType(at.value); 
                      setSelectedIcon(at.icon); 
                      setShowTypeInput(false);
                      setBankLogo(null);
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{at.icon}</Text>
                    <Text style={[styles.typeLabel, { color: (type === at.value && !showTypeInput) ? COLORS.primary : colors.textSecondary }]}>{at.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { backgroundColor: colors.surfaceAlt },
                    !!showTypeInput && { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary, borderWidth: 1 }
                  ]}
                  onPress={() => {
                    setShowTypeInput(true);
                    setType('other');
                    setBankLogo(null);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={showTypeInput ? COLORS.primary : colors.textSecondary} />
                  <Text style={[styles.typeLabel, { color: showTypeInput ? COLORS.primary : colors.textSecondary }]}>Custom</Text>
                </TouchableOpacity>
              </View>

              {!!showTypeInput && (
                <View style={{ marginTop: SPACING.md }}>
                  <Input
                    label="Custom Type Name"
                    placeholder="e.g. Post Office"
                    value={customType}
                    onChangeText={setCustomType}
                  />
                  <Text style={[styles.label, { color: colors.textSecondary, marginTop: SPACING.xs }]}>Select Icon</Text>
                  <View style={styles.smallGrid}>
                    {['💰', '🏢', '🏗️', '💼', '🏡', '🛡️'].map(icon => (
                      <TouchableOpacity 
                        key={icon} 
                        style={[styles.smallBtn, selectedIcon === icon && styles.smallBtnActive]} 
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <Text style={{ fontSize: 20 }}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {type === 'bank' && !showTypeInput && (
                <View style={{ marginTop: SPACING.md }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Select Bank</Text>
                  <View style={styles.smallGrid}>
                    {BANK_LIST.map((bank) => (
                      <TouchableOpacity
                        key={bank.name}
                        style={[
                          styles.bankBtn,
                          { backgroundColor: colors.surfaceAlt },
                          bankName === bank.name && !showNewBankInput && { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary, borderWidth: 1 }
                        ]}
                        onPress={() => { 
                          setBankName(bank.name); 
                          setSelectedIcon(bank.icon); 
                          setBankLogo(bank.logo);
                          setShowNewBankInput(false);
                        }}
                      >
                        {!!bank.logo ? (
                          <Image 
                            source={{ uri: bank.logo }} 
                            style={styles.bankLogoSmall} 
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={{ fontSize: 18 }}>{bank.icon}</Text>
                        )}
                        <Text style={[styles.bankLabel, { color: bankName === bank.name && !showNewBankInput ? COLORS.primary : colors.textSecondary }]}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.bankBtn,
                        { backgroundColor: colors.surfaceAlt },
                        !!showNewBankInput && { backgroundColor: `${COLORS.primary}22`, borderColor: COLORS.primary, borderWidth: 1 }
                      ]}
                      onPress={() => setShowNewBankInput(true)}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={showNewBankInput ? COLORS.primary : colors.textSecondary} />
                      <Text style={[styles.bankLabel, { color: showNewBankInput ? COLORS.primary : colors.textSecondary }]}>New Bank</Text>
                    </TouchableOpacity>
                  </View>

                  {!!showNewBankInput && (
                    <View style={{ marginTop: SPACING.md }}>
                      <Input
                        label="New Bank Name"
                        placeholder="e.g. Federal Bank"
                        value={newBankName}
                        onChangeText={setNewBankName}
                      />
                      <Text style={[styles.label, { color: colors.textSecondary, marginTop: SPACING.xs }]}>Select Bank Icon</Text>
                      <View style={styles.smallGrid}>
                        {['🏢', '🏦', '🏛️', '🏗️', '🧱'].map(icon => (
                          <TouchableOpacity 
                            key={icon} 
                            style={[styles.smallBtn, selectedIcon === icon && styles.smallBtnActive]} 
                            onPress={() => setSelectedIcon(icon)}
                          >
                            <Text style={{ fontSize: 20 }}>{icon}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: SPACING.md }]}>Theme Color</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorActive]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>

              <Button
                title={isEdit ? 'Update Account' : 'Create Account'}
                onPress={handleSave}
                style={{ marginTop: SPACING.xl }}
              />
              <View style={{ height: SPACING['3xl'] }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  scroll: { padding: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: RADIUS.xl,
    borderWidth: 1, marginBottom: SPACING.base,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f8f9fa' },
  logoImage: { width: 32, height: 32 },
  cardInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  type: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  cardBalance: { alignItems: 'flex-end' },
  balanceNum: { fontSize: FONT_SIZES.md, fontWeight: '800' },
  actions: { flexDirection: 'row', marginTop: SPACING.xs },
  actionBtn: { padding: 4, marginLeft: 8 },
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '700', marginBottom: SPACING.sm },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeBtn: { width: '31%', padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', gap: 4 },
  typeLabel: { fontSize: 10, fontWeight: '700' },
  smallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  bankBtn: { width: '23%', padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center', gap: 4 },
  bankLogoSmall: { width: 32, height: 32, marginBottom: 4 },
  bankLabel: { fontSize: 9, fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: SPACING.md },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorActive: { borderWidth: 3, borderColor: '#fff' },
  smallBtn: { padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: '#f0f0f0' },
  smallBtnActive: { borderWidth: 2, borderColor: COLORS.primary },
});

