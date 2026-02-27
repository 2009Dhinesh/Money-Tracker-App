import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { COLORS, RADIUS, SPACING, FONT_SIZES, SHADOWS } from '../constants/theme';
import { BANK_LIST } from '../constants/banks';

const TransactionItem = memo(({ transaction, onPress, onLongPress, style }) => {
  const { colors } = useTheme();
  const isExpense = transaction.type === 'expense';
  const category = transaction.category;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        SHADOWS.sm,
        style,
      ]}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: category?.color ? `${category.color}20` : colors.surfaceAlt },
        ]}
      >
        <Text style={styles.icon}>{category?.icon || '💰'}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {transaction.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {category?.name || 'Uncategorized'}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatDate(transaction.date)}
          </Text>

          {transaction.account && (
            <>
              <Text style={[styles.dot, { color: colors.textTertiary }]}> · </Text>
              <View style={[styles.accMini, { backgroundColor: `${transaction.account.color}10` }]}>
                {(() => {
                  const logoFromList = BANK_LIST.find(b => b.name === transaction.account.bankName || b.name === transaction.account.name)?.logo;
                  const displayLogo = transaction.account.bankLogo || logoFromList;
                  if (displayLogo) {
                    return <Image source={{ uri: displayLogo }} style={styles.accLogo} resizeMode="contain" />;
                  }
                  return <Text style={styles.accEmoji}>{transaction.account.icon}</Text>;
                })()}
              </View>
              <Text style={[styles.accNameText, { color: colors.textTertiary }]} numberOfLines={1}>
                {transaction.account.name}
              </Text>
            </>
          )}

          {transaction.paymentMethod && (
            <>
              <Text style={[styles.dot, { color: colors.textTertiary }]}> · </Text>
              <Text style={styles.pmIcon}>{transaction.paymentMethod.icon}</Text>
            </>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountWrap}>
        <Text
          style={[
            styles.amount,
            { color: isExpense ? COLORS.expense : COLORS.income },
          ]}
        >
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
        </Text>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isExpense ? COLORS.expenseLight : COLORS.incomeLight,
            },
          ]}
        >
          <Ionicons
            name={isExpense ? 'arrow-down' : 'arrow-up'}
            size={10}
            color={isExpense ? COLORS.expense : COLORS.income}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  dot: {
    fontSize: FONT_SIZES.xs,
  },
  time: {
    fontSize: FONT_SIZES.xs,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  typeBadge: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  pmIcon: {
    fontSize: 12,
  },
  accMini: { width: 14, height: 14, borderRadius: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 4 },
  accLogo: { width: 12, height: 12 },
  accEmoji: { fontSize: 8 },
  accNameText: { fontSize: 10, fontWeight: '500' },
});

export default TransactionItem;
