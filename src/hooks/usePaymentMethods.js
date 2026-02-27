import { useState, useCallback } from 'react';
import paymentMethodApi from '../api/paymentMethodApi';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentMethods = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentMethodApi.getAll(params);
      setPaymentMethods(res.methods);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPaymentMethod = useCallback(async (data) => {
    const res = await paymentMethodApi.create(data);
    return res.method;
  }, []);

  const editPaymentMethod = useCallback(async (id, data) => {
    const res = await paymentMethodApi.update(id, data);
    return res.method;
  }, []);

  const removePaymentMethod = useCallback(async (id) => {
    await paymentMethodApi.delete(id);
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    editPaymentMethod,
    removePaymentMethod,
  };
};

export default usePaymentMethods;
