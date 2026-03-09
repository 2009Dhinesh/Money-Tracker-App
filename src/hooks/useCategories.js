import { useState, useCallback } from 'react';
import categoryApi from '../api/categoryApi';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryApi.getAll(params);
      setCategories(res.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (data) => {
    const res = await categoryApi.create(data);
    return res.category;
  }, []);

  const editCategory = useCallback(async (id, data) => {
    const res = await categoryApi.update(id, data);
    return res.category;
  }, []);

  const removeCategory = useCallback(async (id) => {
    await categoryApi.delete(id);
  }, []);

  const expenseCategories = (categories || []).filter((c) => c.type === 'expense');
  const incomeCategories = (categories || []).filter((c) => c.type === 'income');

  return {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    error,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
  };
};

export default useCategories;
