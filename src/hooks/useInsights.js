import { useState, useCallback } from 'react';
import insightsApi from '../api/insightsApi';

export const useInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await insightsApi.getInsights();
      setInsights(res.insights || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, error, fetchInsights };
};

export default useInsights;
