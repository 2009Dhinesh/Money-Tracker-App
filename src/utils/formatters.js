import { format, isToday, isYesterday, parseISO, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount || 0);
};

/**
 * Format short currency (e.g. ₹1.2K, ₹3.5L)
 */
export const formatCurrencyShort = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount?.toFixed(0) || 0}`;
};

/**
 * Format as a full number with commas, no symbol, no decimals
 */
export const formatFullNumber = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Format transaction date with smart labels
 */
export const formatDate = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format time
 */
export const formatTime = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, 'hh:mm a');
  } catch {
    return '';
  }
};

/**
 * Format month-year label
 */
export const formatMonth = (date = new Date()) => format(date, 'MMMM yyyy');

/**
 * Get short month name
 */
export const getShortMonth = (monthNumber) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[monthNumber - 1] || '';
};

/**
 * Get percentage
 */
export const getPercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Get color for a budget percentage
 */
export const getBudgetStatusColor = (percentage) => {
  if (percentage >= 100) return '#FF6B6B';
  if (percentage >= 80) return '#FFB020';
  return '#00C896';
};

/**
 * Group transactions by date
 */
export const groupTransactionsByDate = (transactions) => {
  const groups = {};
  transactions.forEach((txn) => {
    const label = formatDate(txn.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(txn);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
