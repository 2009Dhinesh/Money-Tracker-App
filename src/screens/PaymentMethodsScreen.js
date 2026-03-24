import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useAlert } from '../context/AlertContext';

import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

const ICONS = ['💵', '💳', '📱', '🏦', '✍️', '✨', '🌍', '🪙', '📦', '🎁', '🛒', '🛍️', '💰', '💸', '🤑'];

const COLORS_LIST = [
  '#27AE60', '#3498DB', '#2980B9', '#6C63FF', '#16A085', 
  '#95A5A6', '#BDC3C7', '#E67E22', '#F1C40F', '#8E44AD'
];

export default function PaymentMethodsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { paymentMethods, loading, fetchPaymentMethods, addPaymentMethod, editPaymentMethod, removePaymentMethod } = usePaymentMethods();

  const { alert: showAlert } = useAlert();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    icon: '💳',
    color: '#6C63FF'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const openModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setForm({
        name: method.name,
        icon: method.icon,
        color: method.color
      });
    } else {
      setEditingMethod(null);
      setForm({
        name: '',
        icon: '💳',
        color: '#6C63FF'
      });
    }
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMethod(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingMethod) {
        await editPaymentMethod(editingMethod._id, form);
        showAlert('Success', 'Payment method updated', [], 'success');
      } else {
        await addPaymentMethod(form);
        showAlert('Success', 'Payment method added', [], 'success');
      }
      fetchPaymentMethods();
      closeModal();
    } catch (err) {
      showAlert('Error', err.message || 'Action failed', [], 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, isDefault) => {
    if (isDefault) {
      showAlert('System Method', 'Default payment methods cannot be deleted.', [], 'warning');
      return;
    }

    showAlert('Delete Method', 'Delete this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await removePaymentMethod(id);
            fetchPaymentMethods();
          } catch (err) {
            showAlert('Error', err.message, [], 'error');
          }
        } 
      },
    ], 'warning');
  };

  const renderMethod = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => openModal(item)}
      onLongPress={() => handleDelete(item._id, item.isDefault)}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.methodName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.methodLabel, { color: colors.textTertiary }]}>
          {item.isDefault ? 'Default' : 'Custom'}
        </Text>
      </View>
      {!item.isDefault ? (
        <TouchableOpacity onPress={() => handleDelete(item._id, false)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
        </TouchableOpacity>
      ) : (
        <View style={styles.deleteBtn} />
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );

  if (loading && paymentMethods.length === 0) return <LoadingSpinner message="Loading payment methods..." />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIconWrap}>
          <Ionicons name="arrow-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Payment Methods</Text>
        <TouchableOpacity onPress={() => openModal()} style={styles.headerRight}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={paymentMethods}
        keyExtractor={item => item._id}
        renderItem={renderMethod}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="No payment methods"
            subtitle="Add your first payment method like Cash or Bank"
          >
            <Button title="+ Set First Method" onPress={() => openModal()} />
          </EmptyState>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingMethod ? 'Edit Method' : 'New Payment Method'}
            </Text>

            <Input 
              label="Method Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Google Pay"
              error={errors.name}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsScroll}>
              {ICONS.map(i => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => setForm(f => ({ ...f, icon: i }))}
                  style={[styles.iconChip, form.icon === i && { backgroundColor: `${COLORS.primary}20`, borderColor: COLORS.primary }]}
                >
                  <Text style={{ fontSize: 24 }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Color</Text>
            <View style={styles.colorGrid}>
              {COLORS_LIST.map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => setForm(f => ({ ...f, color: c }))}
                  style={[styles.colorChip, { backgroundColor: c }, form.color === c && styles.activeColor]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
              <Button title="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
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
  title: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
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
  list: { padding: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  iconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  methodName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  methodLabel: { fontSize: FONT_SIZES.xs, fontWeight: '500', marginTop: 2 },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', marginBottom: SPACING.xl },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', marginBottom: SPACING.sm, marginTop: SPACING.md },
  iconsScroll: { marginBottom: SPACING.md },
  iconChip: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'transparent', marginRight: SPACING.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  colorChip: { width: 34, height: 34, borderRadius: 17 },
  activeColor: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.base },
});
