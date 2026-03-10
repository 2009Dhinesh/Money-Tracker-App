import { useState, useCallback } from 'react';
import goalApi from '../api/goalApi';

export const useGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await goalApi.getGoals();
      setGoals(res.goals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addGoal = async (data) => {
    try {
      const res = await goalApi.createGoal(data);
      setGoals(prev => [res.goal, ...prev]);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateGoal = async (id, data) => {
    try {
      const res = await goalApi.updateGoal(id, data);
      setGoals(prev => prev.map(g => g._id === id ? res.goal : g));
      return res.goal;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalApi.deleteGoal(id);
      setGoals(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addFunds = async (id, amount, accountId, paymentMethodId) => {
    try {
      const res = await goalApi.addFunds(id, amount, accountId, paymentMethodId);
      setGoals(prev => prev.map(g => g._id === id ? res.goal : g));
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const withdrawFunds = async (id, amount, accountId, paymentMethodId) => {
    try {
      const res = await goalApi.withdrawFunds(id, amount, accountId, paymentMethodId);
      setGoals(prev => prev.map(g => g._id === id ? res.goal : g));
      return res.goal;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    addFunds,
    withdrawFunds,
  };
};

export default useGoals;
