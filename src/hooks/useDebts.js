import { useState, useCallback } from 'react';
import debtApi from '../api/debtApi';
import { syncDebtsWithNotifications } from '../utils/notificationService';

export const useDebts = () => {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebts = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await debtApi.getDebts(params);
      setDebts(res.debts);
      // Sync notifications with due dates
      syncDebtsWithNotifications(res.debts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await debtApi.getSummary();
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addDebt = useCallback(async (data) => {
    const res = await debtApi.createDebt(data);
    await fetchDebts();
    return res.debt;
  }, [fetchDebts]);

  const recordRepayment = useCallback(async (id, data) => {
    const res = await debtApi.addRepayment(id, data);
    await fetchDebts();
    return res.debt;
  }, [fetchDebts]);

  const removeDebt = useCallback(async (id) => {
    await debtApi.deleteDebt(id);
    await fetchDebts();
  }, [fetchDebts]);

  return {
    debts,
    summary,
    loading,
    error,
    fetchDebts,
    fetchSummary,
    addDebt,
    recordRepayment,
    removeDebt,
  };
};

export default useDebts;
