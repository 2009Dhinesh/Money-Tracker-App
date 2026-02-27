import { useState, useCallback } from 'react';
import landApi from '../api/landApi';

export const useLand = () => {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await landApi.getAssets();
      setAssets(res.assets);
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAsset = useCallback(async (data) => {
    const res = await landApi.addAsset(data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const updateAsset = useCallback(async (id, data) => {
    const res = await landApi.updateAsset(id, data);
    await fetchAssets();
    return res.asset;
  }, [fetchAssets]);

  const removeAsset = useCallback(async (id) => {
    await landApi.deleteAsset(id);
    await fetchAssets();
  }, [fetchAssets]);

  return { assets, summary, loading, error, fetchAssets, addAsset, updateAsset, removeAsset };
};

export default useLand;
