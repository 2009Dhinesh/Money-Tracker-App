import { useState, useCallback } from 'react';
import contactApi from '../api/contactApi';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactApi.getContacts(params);
      setContacts(res.contacts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addContact = useCallback(async (data) => {
    const res = await contactApi.createContact(data);
    await fetchContacts();
    return res.contact;
  }, [fetchContacts]);

  const editContact = useCallback(async (id, data) => {
    const res = await contactApi.updateContact(id, data);
    await fetchContacts();
    return res.contact;
  }, [fetchContacts]);

  const removeContact = useCallback(async (id) => {
    await contactApi.deleteContact(id);
    await fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, error, fetchContacts, addContact, editContact, removeContact };
};

export default useContacts;
