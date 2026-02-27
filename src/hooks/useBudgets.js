import { useState, useCallback } from 'react';
import budgetApi from '../api/budgetApi';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetApi.getAll(params);
      setBudgets(res.budgets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addBudget = useCallback(async (data) => {
    const res = await budgetApi.create(data);
    const newBudget = {
      ...res.budget,
      spent: 0,
      remaining: res.budget.amount,
      percentage: 0,
      isOverBudget: false,
      isNearLimit: false,
    };
    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  }, []);

  const editBudget = useCallback(async (id, data) => {
    const res = await budgetApi.update(id, data);
    setBudgets((prev) => prev.map((b) => {
      if (b._id === id) {
        const spent = b.spent || 0;
        const percentage = res.budget.amount > 0 ? (spent / res.budget.amount) * 100 : 0;
        const threshold = res.budget.alertThreshold || 80;
        return {
          ...res.budget,
          spent,
          remaining: Math.max(0, res.budget.amount - spent),
          percentage: Math.min(percentage, 100),
          isOverBudget: spent >= res.budget.amount,
          isNearLimit: percentage >= threshold && spent < res.budget.amount,
        };
      }
      return b;
    }));
    return res.budget;
  }, []);

  const removeBudget = useCallback(async (id) => {
    await budgetApi.delete(id);
    setBudgets((prev) => prev.filter((b) => b._id !== id));
  }, []);

  const alertBudgets = budgets.filter((b) => b.isNearLimit || b.isOverBudget);

  return {
    budgets,
    alertBudgets,
    loading,
    error,
    fetchBudgets,
    addBudget,
    editBudget,
    removeBudget,
  };
};

export default useBudgets;
