import { useState, useCallback } from 'react';
import investmentApi from '../api/investmentApi';

export const useInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await investmentApi.getAll();
      setInvestments(res.investments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addInvestment = useCallback(async (data) => {
    const res = await investmentApi.create(data);
    setInvestments(prev => [res.investment, ...prev]);
    return res.investment;
  }, []);

  const editInvestment = useCallback(async (id, data) => {
    const res = await investmentApi.update(id, data);
    setInvestments(prev => prev.map(inv => inv._id === id ? res.investment : inv));
    return res.investment;
  }, []);

  const removeInvestment = useCallback(async (id) => {
    await investmentApi.delete(id);
    setInvestments(prev => prev.filter(inv => inv._id !== id));
  }, []);

  return { investments, loading, error, fetchInvestments, addInvestment, editInvestment, removeInvestment };
};

export default useInvestments;
