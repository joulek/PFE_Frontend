// hooks/useOutlookCalendar.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useOutlookCalendar = () => {
  const [events, setEvents] = useState([]);
  const [outlookStatus, setOutlookStatus] = useState({
    connected: false,
    outlookEmail: null,
    tokenExpired: false,
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIX : /api/auth/microsoft/status
  const checkOutlookStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/microsoft/status');
      setOutlookStatus(data);
    } catch (err) {
      console.error('Erreur vérification statut Outlook:', err);
    }
  }, []);

  // ✅ FIX : /api/calendar/events
  const fetchEvents = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/api/calendar/events', { params });
      setEvents(data.events);
    } catch (err) {
      if (err.response?.data?.code === 'OUTLOOK_NOT_CONNECTED') {
        setOutlookStatus({ connected: false });
      } else {
        setError('Erreur lors du chargement des événements');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX : /api/auth/microsoft/connect
  const connectOutlook = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/microsoft/connect');
      window.location.href = data.authUrl;
    } catch {
      setError('Impossible de se connecter à Outlook');
    }
  }, []);

  // ✅ FIX : /api/auth/microsoft/disconnect
  const disconnectOutlook = useCallback(async () => {
    try {
      await api.delete('/api/auth/microsoft/disconnect');
      setOutlookStatus({ connected: false, outlookEmail: null });
      await fetchEvents();
    } catch {
      setError('Erreur lors de la déconnexion');
    }
  }, [fetchEvents]);

  // ✅ FIX : /api/calendar/events
  const createEvent = useCallback(async (eventData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/calendar/events', eventData);
      setEvents((prev) =>
        [...prev, data.event].sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        )
      );
      return { success: true, event: data.event };
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur création événement';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX : /api/calendar/events/:id  (supporte _id MongoDB)
  const updateEvent = useCallback(async (eventId, eventData) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/api/calendar/events/${eventId}`, eventData);
      setEvents((prev) =>
        prev.map((e) =>
          (e._id === eventId || e.id === eventId) ? data.event : e
        )
      );
      return { success: true, event: data.event };
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur mise à jour';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX : /api/calendar/events/:id  (supporte _id MongoDB)
  const deleteEvent = useCallback(async (eventId) => {
    try {
      await api.delete(`/api/calendar/events/${eventId}`);
      setEvents((prev) =>
        prev.filter((e) => e._id !== eventId && e.id !== eventId)
      );
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur suppression';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ✅ FIX : /api/calendar/sync
  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/api/calendar/sync');
      await fetchEvents();
      return { success: true, synced: data.synced };
    } catch (err) {
      setError('Erreur synchronisation');
      return { success: false };
    } finally {
      setSyncing(false);
    }
  }, [fetchEvents]);

  useEffect(() => {
    checkOutlookStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setOutlookStatus((prev) => ({ ...prev, connected: true }));
      window.history.replaceState({}, '', window.location.pathname);
      fetchEvents(); // recharge après connexion OAuth
    }
    if (params.get('error')) {
      setError('Connexion Outlook annulée ou échouée');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkOutlookStatus, fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    outlookStatus,
    loading,
    syncing,
    error,
    setError,
    fetchEvents,
    connectOutlook,
    disconnectOutlook,
    createEvent,
    updateEvent,
    deleteEvent,
    syncNow,
  };
};