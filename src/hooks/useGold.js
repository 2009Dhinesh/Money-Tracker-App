import { useState, useCallback } from 'react';
import goldApi from '../api/goldApi';

export const useGold = () => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await goldApi.getAssets();
      setAssets(res.assets);
      setSummary(res.summary);
      setLivePrice(res.livePrice);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await goldApi.getPrice();
      setLivePrice(res);
      return res;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addAsset = useCallback(async (data) => {
    const res = await goldApi.addAsset(data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const updateAsset = useCallback(async (id, data) => {
    const res = await goldApi.updateAsset(id, data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const removeAsset = useCallback(async (id) => {
    await goldApi.deleteAsset(id);
    await fetchAssets();
  }, [fetchAssets]);

  const calculate = useCallback(async (amount, purity) => {
    const res = await goldApi.calculate(amount, purity);
    return res;
  }, []);

  return { assets, summary, livePrice, loading, error, fetchAssets, fetchPrice, addAsset, updateAsset, removeAsset, calculate };
};

export default useGold;
