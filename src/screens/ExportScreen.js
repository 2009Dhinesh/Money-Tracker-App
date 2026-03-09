import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useAppDrawer } from '../context/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';
import wealthApi from '../api/wealthApi';
import transactionApi from '../api/transactionApi';
import { 
  generateWealthCSV, 
  generateTransactionsCSV, 
  exportToExcel 
} from '../utils/csvExporter';
import { startOfWeek, endOfWeek, format, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, addYears, addWeeks } from 'date-fns';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExportScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { openDrawer } = useAppDrawer();
  
  // States
  const [loading, setLoading] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [exportType, setExportType] = useState(null); // 'day', 'week', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewData, setPreviewData] = useState({ count: 0, loading: false });

  // Reset preview when modal opens or date changes
  useEffect(() => {
    if (showModal && exportType && exportType !== 'wealth') {
      fetchPreviewCount();
    }
  }, [showModal, selectedDate, exportType]);

  const fetchPreviewCount = async () => {
    try {
      setPreviewData(prev => ({ ...prev, loading: true }));
      const range = getRangeParams(exportType, selectedDate);
      const res = await transactionApi.getAll({ ...range, limit: 1 }); // Just to get total
      if (res.success) {
        setPreviewData({ count: res.pagination?.total || 0, loading: false });
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewData({ count: 0, loading: false });
    }
  };

  const getRangeParams = (type, date) => {
    let params = {};
    switch (type) {
      case 'day':
        params.startDate = format(date, 'yyyy-MM-dd');
        params.endDate = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        params.startDate = format(startOfWeek(date), 'yyyy-MM-dd');
        params.endDate = format(endOfWeek(date), 'yyyy-MM-dd');
        break;
      case 'month':
        params.startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        params.endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        break;
      case 'year':
        params.startDate = format(startOfYear(date), 'yyyy-MM-dd');
        params.endDate = format(endOfYear(date), 'yyyy-MM-dd');
        break;
    }
    return params;
  };

  const handleDownload = async () => {
    if (exportType === 'wealth') {
      await handleExportWealth();
      return;
    }

    try {
      setLoading(exportType);
      const params = getRangeParams(exportType, selectedDate);
      let title = 'Transactions';
      
      switch (exportType) {
        case 'day': title = `Transactions_${format(selectedDate, 'dd_MMM_yyyy')}`; break;
        case 'week': title = `Transactions_Week_${format(selectedDate, 'ww_yyyy')}`; break;
        case 'month': title = `Transactions_${format(selectedDate, 'MMM_yyyy')}`; break;
        case 'year': title = `Transactions_Year_${format(selectedDate, 'yyyy')}`; break;
      }

      const res = await transactionApi.getAll({ ...params, limit: 5000 });
      if (res.success) {
        const csv = generateTransactionsCSV(res.transactions, title.replace(/_/g, ' '));
        await exportToExcel(csv, title);
        setShowModal(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleExportWealth = async () => {
    try {
      setLoading('wealth');
      const res = await wealthApi.getDashboard();
      if (res.success) {
        const csv = generateWealthCSV(res.dashboard);
        await exportToExcel(csv, 'Full_Financial_Report');
        setShowModal(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(null);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const openExportModal = (type) => {
    setExportType(type);
    setSelectedDate(new Date());
    setShowModal(true);
  };

  const renderDateSelector = () => {
    const updateDate = (direction) => {
      let newDate = new Date(selectedDate);
      if (exportType === 'day') newDate.setDate(newDate.getDate() + direction);
      else if (exportType === 'week') newDate = addWeeks(newDate, direction);
      else if (exportType === 'month') newDate = addMonths(newDate, direction);
      else if (exportType === 'year') newDate = addYears(newDate, direction);
      setSelectedDate(newDate);
    };

    const label = exportType === 'day' ? format(selectedDate, 'dd MMM yyyy') :
                  exportType === 'week' ? `Week of ${format(startOfWeek(selectedDate), 'dd MMM')}` :
                  exportType === 'month' ? format(selectedDate, 'MMMM yyyy') :
                  format(selectedDate, 'yyyy');

    return (
      <View style={[styles.selector, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => updateDate(-1)}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onPress={() => setShowDatePicker(true)}
        >
          {exportType === 'day' && <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />}
          <Text style={[styles.selectorText, { color: colors.textPrimary, textAlign: 'center' }]}>
            {label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => updateDate(1)} disabled={selectedDate >= new Date().setHours(0,0,0,0)}>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedDate >= new Date().setHours(0,0,0,0) ? colors.textTertiary : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const ExportItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.sm]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}12` }]}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuIconWrap}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Export Data</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FINANCIAL REPORTS</Text>
        <ExportItem 
          icon="document-text" 
          title="Full Financial Report" 
          subtitle="All assets, bank balances, gold, and debts"
          onPress={() => openExportModal('wealth')}
        />

        <View style={{ height: 20 }} />
        
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TRANSACTION RECORDS</Text>
        <ExportItem 
          icon="today" 
          title="Daily Transactions" 
          subtitle="Download specific date record"
          onPress={() => openExportModal('day')}
        />
        <ExportItem 
          icon="calendar" 
          title="Weekly Record" 
          subtitle="Download any week's accounting"
          onPress={() => openExportModal('week')}
        />
        <ExportItem 
          icon="calendar-outline" 
          title="Monthly Records" 
          subtitle="Download by month selection"
          onPress={() => openExportModal('month')}
        />
        <ExportItem 
          icon="business" 
          title="Yearly Records" 
          subtitle="Download by year selection"
          onPress={() => openExportModal('year')}
        />
      </ScrollView>

      {/* Export Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {exportType === 'wealth' ? 'Full Report' : 'Select Period'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {exportType === 'wealth' ? (
                <Text style={[styles.previewInfo, { color: colors.textSecondary }]}>
                  This file will contain your entire financial snapshot including all accounts, gold, land, and current debt status.
                </Text>
              ) : (
                <>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>CHOOSE DATE / RANGE</Text>
                  {renderDateSelector()}
                  
                  <View style={[styles.previewCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    {previewData.loading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons 
                          name={previewData.count > 0 ? "checkmark-circle" : "alert-circle"} 
                          size={24} 
                          color={previewData.count > 0 ? COLORS.income : COLORS.expense} 
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>
                            {previewData.count > 0 ? `${previewData.count} Transactions` : 'No Records Found'}
                          </Text>
                          <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                            {previewData.count > 0 ? 'Data is ready for download' : 'Try selecting a different date'}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[
                  styles.downloadBtn, 
                  { backgroundColor: COLORS.primary },
                  (exportType !== 'wealth' && previewData.count === 0) && { opacity: 0.5 }
                ]}
                onPress={handleDownload}
                disabled={loading !== null || (exportType !== 'wealth' && previewData.count === 0)}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-download" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.downloadText}>Download File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    position: 'relative',
  },
  menuIconWrap: {
    position: 'absolute',
    left: SPACING.xl,
    bottom: 16,
    padding: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  scroll: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding: SPACING.xl,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  selectorText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewInfo: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  downloadBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadText: {
    color: '#fff',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
});
