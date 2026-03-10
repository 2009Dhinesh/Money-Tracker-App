import { useState, useCallback } from 'react';
import transactionApi from '../api/transactionApi';
import { sendInstantNotification } from '../utils/notificationService';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionApi.getAll(params);
      setTransactions(prev => params.page > 1 ? [...prev, ...res.transactions] : res.transactions);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionApi.getSummary(params);
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionApi.getReport(params);
      setReport(res.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (data) => {
    const res = await transactionApi.create(data);
    
    // Trigger Push Notification for Important Events
    if (data.type === 'expense' && data.amount > 10000) {
      sendInstantNotification(
        'Large Expense Recorded! 📉',
        `You just spent ₹${data.amount.toLocaleString()} on ${data.title || 'something'}.`
      );
    } else if (data.type === 'income' && data.amount > 5000) {
      sendInstantNotification(
        'Income Received! 💰',
        `₹${data.amount.toLocaleString()} was added to your account.`
      );
    }

    return res; // Return full data object (axios interceptor already returns res.data)
  }, []);

  const editTransaction = useCallback(async (id, data) => {
    const res = await transactionApi.update(id, data);
    return res.transaction;
  }, []);

  const removeTransaction = useCallback(async (id) => {
    await transactionApi.delete(id);
  }, []);

  return {
    transactions,
    summary,
    report,
    loading,
    error,
    pagination,
    fetchTransactions,
    fetchSummary,
    fetchReport,
    addTransaction,
    editTransaction,
    removeTransaction,
  };
};

export default useTransactions;
