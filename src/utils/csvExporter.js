import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Converts a list of transactions to CSV content
 */
const transactionsToCSV = (transactions) => {
  if (!transactions || transactions.length === 0) return '';
  
  const headers = ['Date', 'Title', 'Type', 'Amount', 'Category', 'Account', 'Description'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('en-IN'),
    t.title,
    t.type,
    t.amount,
    t.category?.name || 'Uncategorized',
    t.account?.name || 'N/A',
    t.description || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

/**
 * Converts wealth dashboard data to a CSV string
 * @param {Object} data - Wealth dashboard data
 */
export const generateWealthCSV = (data) => {
  if (!data) return '';

  const rows = [];
  
  // Header section
  rows.push(['SalaryCalc - Full Financial Report']);
  rows.push(['Generated on', new Date().toLocaleString()]);
  rows.push(['']);

  // Summary Section
  rows.push(['SUMMARY']);
  rows.push(['Net Worth', `₹${data.netWorth}`]);
  rows.push(['Total Assets', `₹${data.totalAssets}`]);
  rows.push(['Total Liabilities', `₹${data.totalLiabilities}`]);
  rows.push(['Net Savings', `₹${data.savings}`]);
  rows.push(['']);

  // Cash / Bank Section
  rows.push(['CASH & BANK ACCOUNTS']);
  rows.push(['Account Name', 'Bank', 'Balance']);
  if (data.cash.list && data.cash.list.length > 0) {
    data.cash.list.forEach(acc => {
      rows.push([acc.name, acc.bankName || 'N/A', `₹${acc.balance}`]);
    });
  }
  rows.push(['TOTAL CASH', '', `₹${data.cash.total}`]);
  rows.push(['']);

  // Metals Section
  rows.push(['PRECIOUS METALS']);
  rows.push(['Type', 'Asset Name', 'Weight', 'Invested', 'Current Value']);
  if (data.gold.list) {
    data.gold.list.forEach(item => {
      rows.push(['Gold (22K)', item.name, `${item.weight}g`, `₹${item.invested}`, `₹${item.value}`]);
    });
  }
  if (data.silver.list) {
    data.silver.list.forEach(item => {
      rows.push(['Silver', item.name, `${item.weight}g`, `₹${item.invested}`, `₹${item.value}`]);
    });
  }
  rows.push(['TOTAL METALS', '', '', `₹${data.metals.invested}`, `₹${data.metals.currentValue}`]);
  rows.push(['']);

  // Land Section
  rows.push(['PROPERTIES / LAND']);
  rows.push(['Property Name', 'Invested', 'Current Value', 'Appreciation']);
  if (data.land.list) {
    data.land.list.forEach(item => {
      rows.push([item.name, `₹${item.invested}`, `₹${item.value}`, `₹${item.value - item.invested}`]);
    });
  }
  rows.push(['TOTAL LAND', `₹${data.land.invested}`, `₹${data.land.currentValue}`, `₹${data.land.appreciation}`]);
  rows.push(['']);

  // Debts Section
  rows.push(['DEBTS & RECEIVABLES']);
  rows.push(['Category', 'Person Name', 'Amount', 'Reason/Info']);
  if (data.debts.lentList) {
    data.debts.lentList.forEach(d => {
      rows.push(['Lent (Receivable)', d.name, `₹${d.amount}`, d.info || '']);
    });
  }
  if (data.debts.owedList) {
    data.debts.owedList.forEach(d => {
      rows.push(['Borrowed (Owed)', d.name, `₹${d.amount}`, d.info || '']);
    });
  }
  rows.push(['NET DEBT STATUS', '', `₹${data.debts.net}`, '']);
  rows.push(['']);

  // Income/Expense Section
  rows.push(['INCOME & EXPENSES (LIFETIME)']);
  rows.push(['Total Income', `₹${data.income.total}`]);
  rows.push(['Total Expense', `₹${data.expense.total}`]);
  rows.push(['']);

  return rows
    .map(row => row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
    .join('\n');
};

/**
 * Generates CSV for transactions
 */
export const generateTransactionsCSV = (transactions, title = 'Transactions Report') => {
  const content = transactionsToCSV(transactions);
  return `"${title}"\n"Generated on","${new Date().toLocaleString()}"\n\n${content}`;
};

/**
 * Saves and shares the CSV file
 */
export const exportToExcel = async (csvContent, fileName = 'Financial_Report') => {
  try {
    const fullFileName = `${fileName}_${new Date().getTime()}.csv`;
    const fileUri = FileSystem.cacheDirectory + fullFileName;
    
    // Add UTF-8 BOM
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
      encoding: 'utf8',
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      if (Platform.OS === 'web') {
        // Fallback for web if needed, but this is Expo
        Alert.alert('Sharing Unavailable', 'File sharing is not supported on this platform');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Download Financial Report',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Export Failed', 'An error occurred while generating the file.');
  }
};
