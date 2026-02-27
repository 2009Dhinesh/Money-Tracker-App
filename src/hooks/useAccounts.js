import { useState, useCallback } from 'react';
import accountApi from '../api/accountApi';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountApi.getAccounts();
      setAccounts(res.accounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (data) => {
    const res = await accountApi.createAccount(data);
    await fetchAccounts(); // Refresh list
    return res.account;
  }, [fetchAccounts]);

  const editAccount = useCallback(async (id, data) => {
    const res = await accountApi.updateAccount(id, data);
    await fetchAccounts(); // Refresh list
    return res.account;
  }, [fetchAccounts]);

  const removeAccount = useCallback(async (id) => {
    await accountApi.deleteAccount(id);
    await fetchAccounts(); // Refresh list
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    editAccount,
    removeAccount,
  };
};

export default useAccounts;
