import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar, ScrollView, Image, Dimensions, Platform,
  Modal, TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useAlert } from '../context/AlertContext';
import { useAppDrawer } from '../context/DrawerContext';
import TransactionItem from '../components/TransactionItem';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isToday, isYesterday } from 'date-fns';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const TYPES = [
  { label: 'All', value: '' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

export default function TransactionsScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { transactions, pagination, loading, fetchTransactions, removeTransaction } = useTransactions();
  const { accounts, fetchAccounts } = useAccounts();
  const { categories, fetchCategories } = useCategories();
  const { openDrawer } = useAppDrawer();
  const { alert: showAlert } = useAlert();

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(route.params?.account || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchDebounce, setSearchDebounce] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'type', 'account', 'category'

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const showPicker = () => {
    setShowDatePicker(true);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  const load = useCallback(async (p = 1) => {
    const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
    await fetchTransactions({
      type: activeType || undefined,
      account: selectedAccount || undefined,
      category: selectedCategory || undefined,
      search: searchDebounce || undefined,
      startDate,
      endDate,
      page: p,
      limit: 20,
    });
  }, [selectedDate, activeType, selectedAccount, selectedCategory, searchDebounce, fetchTransactions]);

  useFocusEffect(useCallback(() => { setPage(1); load(1); }, [load]));
  useEffect(() => { setPage(1); load(1); }, [selectedDate, activeType, selectedAccount, selectedCategory, searchDebounce]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < pagination.pages) {
      const nextPage = page + 1;
      setPage(nextPage);
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      fetchTransactions({ 
        type: activeType || undefined, 
        account: selectedAccount || undefined,
        category: selectedCategory || undefined,
        search: searchDebounce || undefined, 
        startDate,
        endDate,
        page: nextPage 
      });
    }
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Transaction', 
      'Are you sure you want to delete this transaction?', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTransaction(id);
            load(1);
          },
        },
      ],
      'warning'
    );
  };

  const renderItem = useCallback(({ item }) => (
    <TransactionItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      onLongPress={() => handleDelete(item._id)}
    />
  ), [navigation, handleDelete]);

  const sections = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const groups = {};
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      let title;
      
      if (isToday(date)) title = 'Today';
      else if (isYesterday(date)) title = 'Yesterday';
      else title = format(date, 'dd MMM yyyy');
      
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(txn);
    });
    
    return Object.keys(groups).map(title => ({
      title,
      data: groups[title]
    }));
  }, [transactions]);

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <View style={styles.sectionHeaderContainer}>
      <BlurView 
        intensity={Platform.OS === 'ios' ? 45 : 100} 
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.sectionHeader, 
          { 
            backgroundColor: isDark ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }
        ]}
      >
        <View style={styles.sectionHeaderInner}>
          <Text style={[styles.sectionHeaderText, { color: COLORS.primary }]}>{title}</Text>
          <View style={[styles.sectionHeaderDot, { backgroundColor: COLORS.primary }]} />
        </View>
      </BlurView>
    </View>
  ), [colors, isDark]);

  const headerComponent = useMemo(() => (
    <View>
      {/* Month Navigator */}
      <View style={[styles.dateNav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => setSelectedDate(d => subMonths(d, 1))} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={[styles.dateDisplay, { paddingVertical: 4, paddingHorizontal: 12 }]}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => {
            const next = addMonths(selectedDate, 1);
            if (next <= new Date() || isSameMonth(next, new Date())) setSelectedDate(next);
          }}
          disabled={isSameMonth(selectedDate, new Date())}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={isSameMonth(selectedDate, new Date()) ? colors.textTertiary : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Filters */}
      <View style={styles.filterRow}>
        {/* Type Select */}
        <TouchableOpacity 
          style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveModal('type')}
        >
          <Text style={[styles.selectLabel, { color: activeType ? COLORS.primary : colors.textSecondary }]} numberOfLines={1}>
            {activeType ? TYPES.find(t => t.value === activeType)?.label : 'All Types'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Account Select */}
        <TouchableOpacity 
          style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveModal('account')}
        >
          <Text style={[styles.selectLabel, { color: selectedAccount ? COLORS.primary : colors.textSecondary }]} numberOfLines={1}>
            {selectedAccount ? accounts.find(a => a._id === selectedAccount)?.name : 'All Accounts'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Category Select */}
        <TouchableOpacity 
          style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveModal('category')}
        >
          <Text style={[styles.selectLabel, { color: selectedCategory ? COLORS.primary : colors.textSecondary }]} numberOfLines={1}>
            {selectedCategory ? categories.find(c => c._id === selectedCategory)?.name : 'All Categories'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: SPACING.xs }}>
        <Text style={[styles.count, { color: colors.textTertiary }]}>{pagination.total} total</Text>
      </View>
    </View>
  ), [colors, selectedDate, search, activeType, selectedAccount, selectedCategory, accounts, categories, pagination.total]);


  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />

      {/* Page Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Transactions</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={headerComponent}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          loading && !refreshing ? (
            <LoadingSpinner message="Loading transactions..." />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No transactions found"
              subtitle={search ? 'Try a different search term' : 'Add your first transaction!'}
            >
              <Button title="+ Set First Transaction" onPress={() => navigation.navigate('AddTransaction')} />
            </EmptyState>
          )
        }
        ListFooterComponent={
          page < pagination.pages ? (
            <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.sm }}>
                Load more
              </Text>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Filter Selection Modal */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Select {activeModal === 'type' ? 'Type' : activeModal === 'account' ? 'Account' : 'Category'}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveModal(null)}>
                    <Ionicons name="close" size={24} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* All Option */}
                  <TouchableOpacity 
                    style={[styles.optionItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      if (activeModal === 'type') setActiveType('');
                      else if (activeModal === 'account') setSelectedAccount('');
                      else if (activeModal === 'category') setSelectedCategory('');
                      setActiveModal(null);
                    }}
                  >
                    <View style={styles.optionInfo}>
                      <View style={[styles.optionIconWrap, { backgroundColor: `${COLORS.primary}15` }]}>
                        <Ionicons name="apps-outline" size={18} color={COLORS.primary} />
                      </View>
                      <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>All {activeModal === 'type' ? 'Types' : activeModal === 'account' ? 'Accounts' : 'Categories'}</Text>
                    </View>
                    {(activeModal === 'type' ? !activeType : activeModal === 'account' ? !selectedAccount : !selectedCategory) && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.income} />
                    )}
                  </TouchableOpacity>

                  {/* Specific Options */}
                  {activeModal === 'type' && TYPES.filter(t => t.value !== '').map((t) => (
                    <TouchableOpacity 
                      key={t.value}
                      style={[styles.optionItem, { borderBottomColor: colors.border }]}
                      onPress={() => { setActiveType(t.value); setActiveModal(null); }}
                    >
                      <View style={styles.optionInfo}>
                        <View style={[styles.optionIconWrap, { backgroundColor: `${COLORS.primary}15` }]}>
                          <Ionicons 
                            name={t.value === 'expense' ? 'arrow-up-circle' : t.value === 'income' ? 'arrow-down-circle' : 'swap-horizontal'} 
                            size={18} color={COLORS.primary} 
                          />
                        </View>
                        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{t.label}</Text>
                      </View>
                      {activeType === t.value && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.income} />
                      )}
                    </TouchableOpacity>
                  ))}

                  {activeModal === 'account' && accounts.map((acc) => (
                    <TouchableOpacity 
                      key={acc._id}
                      style={[styles.optionItem, { borderBottomColor: colors.border }]}
                      onPress={() => { setSelectedAccount(acc._id); setActiveModal(null); }}
                    >
                      <View style={styles.optionInfo}>
                        <View style={[styles.optionIconWrap, { backgroundColor: `${acc.color}15` }]}>
                          {(() => {
                            const logoFromList = BANK_LIST.find(b => b.name === acc.bankName || b.name === acc.name)?.logo;
                            const displayLogo = acc.bankLogo || logoFromList;
                            if (displayLogo) {
                              return <Image source={{ uri: displayLogo }} style={styles.optionBankLogo} resizeMode="contain" />;
                            }
                            return <Text style={styles.optionIcon}>{acc.icon}</Text>;
                          })()}
                        </View>
                        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{acc.name}</Text>
                      </View>
                      {selectedAccount === acc._id && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.income} />
                      )}
                    </TouchableOpacity>
                  ))}

                  {activeModal === 'category' && categories.map((cat) => (
                    <TouchableOpacity 
                      key={cat._id}
                      style={[styles.optionItem, { borderBottomColor: colors.border }]}
                      onPress={() => { setSelectedCategory(cat._id); setActiveModal(null); }}
                    >
                      <View style={styles.optionInfo}>
                        <View style={[styles.optionIconWrap, { backgroundColor: `${cat.color}15` }]}>
                          <Text style={styles.optionIcon}>{cat.icon}</Text>
                        </View>
                        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{cat.name}</Text>
                      </View>
                      {selectedCategory === cat._id && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.income} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', // Center content
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
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZES.base, paddingVertical: 2 },
  filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  selectBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  selectLabel: { fontSize: 11, fontWeight: '700' },
  count: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
  list: { padding: SPACING.xl, paddingTop: SPACING.xs },
  loadMore: {
    alignItems: 'center', padding: SPACING.base,
    marginTop: SPACING.sm, marginBottom: SPACING.xl,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  navIcon: {
    padding: SPACING.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: { fontSize: 16 },
  optionBankLogo: { width: 20, height: 20 },
  sectionHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
    width: '100%',
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  sectionHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionHeaderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
});
