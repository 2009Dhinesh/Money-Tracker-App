import { useState, useCallback } from 'react';
import metalApi from '../api/metalApi';

export const useMetals = () => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [prices, setPrices] = useState(null);
  const [dailyChange, setDailyChange] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async (metalType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await metalApi.getAssets(metalType);
      setAssets(res.assets || []);
      setSummary(res.summary);
      setPrices(res.prices);
      if (res.dailyChange) setDailyChange(res.dailyChange);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await metalApi.getPrices();
      setPrices({ gold: res.gold, silver: res.silver, updatedAt: res.updatedAt, source: res.source });
      if (res.dailyChange) setDailyChange(res.dailyChange);
      return res;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchHistory = useCallback(async (days = 7, metalType) => {
    try {
      const res = await metalApi.getHistory(days, metalType);
      setHistory(res || { gold: [], silver: [] });
      return res;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addAsset = useCallback(async (data) => {
    const res = await metalApi.addAsset(data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const updateAsset = useCallback(async (id, data) => {
    const res = await metalApi.updateAsset(id, data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const removeAsset = useCallback(async (id) => {
    await metalApi.deleteAsset(id);
    await fetchAssets();
  }, [fetchAssets]);

  const calculate = useCallback(async (amount, metalType, purity) => {
    const res = await metalApi.calculate(amount, metalType, purity);
    return res;
  }, []);

  return {
    assets, summary, prices, dailyChange, history, loading, error,
    fetchAssets, fetchPrices, fetchHistory, addAsset, updateAsset, removeAsset, calculate,
  };
};

export default useMetals;
