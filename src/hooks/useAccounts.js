import { useState, useCallback } from 'react';
import accountApi from '../api/accountApi';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountApi.getAccounts();
      setAccounts(res.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountApi.getArchivedAccounts();
      setArchivedAccounts(res.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (data) => {
    const res = await accountApi.createAccount(data);
    await fetchAccounts();
    return res.account;
  }, [fetchAccounts]);

  const editAccount = useCallback(async (id, data) => {
    const res = await accountApi.updateAccount(id, data);
    await fetchAccounts();
    await fetchArchivedAccounts();
    return res.account;
  }, [fetchAccounts, fetchArchivedAccounts]);

  const archiveAccount = useCallback(async (id) => {
    await accountApi.archiveAccount(id);
    await fetchAccounts();
    await fetchArchivedAccounts();
  }, [fetchAccounts, fetchArchivedAccounts]);

  const unarchiveAccount = useCallback(async (id) => {
    await accountApi.unarchiveAccount(id);
    await fetchAccounts();
    await fetchArchivedAccounts();
  }, [fetchAccounts, fetchArchivedAccounts]);

  const removeAccount = useCallback(async (id) => {
    try {
      await accountApi.deleteAccount(id);
      await fetchAccounts();
      await fetchArchivedAccounts();
    } catch (err) {
      throw err;
    }
  }, [fetchAccounts, fetchArchivedAccounts]);

  return {
    accounts,
    archivedAccounts,
    loading,
    error,
    fetchAccounts,
    fetchArchivedAccounts,
    addAccount,
    editAccount,
    archiveAccount,
    unarchiveAccount,
    removeAccount,
  };
};

export default useAccounts;
