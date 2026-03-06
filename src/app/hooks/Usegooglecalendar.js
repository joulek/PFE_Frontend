"use client";
// hooks/UseGoogleCalendar.js
// Remplace UseOutlookCalendar.js — connecté à Google Calendar

import { useState, useCallback, useRef } from "react";
import api from "../services/api"; // axios avec token automatique

export function useGoogleCalendar() {
  const [events,        setEvents]       = useState([]);
  const [loading,       setLoading]      = useState(false);
  const [syncing,       setSyncing]      = useState(false);
  const [error,         setError]        = useState(null);
  const [googleStatus,  setGoogleStatus] = useState({ connected: false, googleEmail: null });

  // Anti-double-fetch
  const fetchingRef = useRef(false);

  // ── Vérifie le statut Google Calendar ──────────────────────────
  const checkGoogleStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/google/status");
      setGoogleStatus({
        connected:   !!data.connected,
        googleEmail: data.googleEmail || null,
      });
      return data;
    } catch {
      setGoogleStatus({ connected: false, googleEmail: null });
      return { connected: false };
    }
  }, []);

  // ── Lance le flux OAuth Google ──────────────────────────────────
  const connectGoogle = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/google/connect");
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (e) {
      setError("Impossible de démarrer la connexion Google");
    }
  }, []);

  // ── Déconnecte Google Calendar ──────────────────────────────────
  const disconnectGoogle = useCallback(async () => {
    try {
      await api.delete("/api/auth/google/disconnect");
      setGoogleStatus({ connected: false, googleEmail: null });
      setEvents([]);
    } catch (e) {
      setError("Erreur lors de la déconnexion Google");
    }
  }, []);

  // ── Récupère les événements (local DB + Google sync) ────────────
  const fetchEvents = useCallback(async ({ startDate, endDate } = {}) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate)   params.set("endDate",   endDate);

      const { data } = await api.get(`/api/calendar/events?${params}`);
      setEvents(data.events || []);
    } catch (e) {
      const code = e?.response?.data?.code;
      if (code === "GOOGLE_NOT_CONNECTED") {
        setGoogleStatus({ connected: false, googleEmail: null });
        // Essaie quand même de récupérer les événements locaux
        try {
          const { data } = await api.get("/api/calendar/events");
          setEvents((data.events || []).filter(ev => ev.source === "app"));
        } catch {}
      } else {
        setError(e?.response?.data?.message || "Erreur de chargement du calendrier");
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // ── Synchronise avec Google Calendar ───────────────────────────
  const syncNow = useCallback(async ({ startDate, endDate } = {}) => {
    setSyncing(true);
    setError(null);
    try {
      await api.post("/api/calendar/sync", { startDate, endDate });
      await fetchEvents({ startDate, endDate });
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur de synchronisation Google");
    } finally {
      setSyncing(false);
    }
  }, [fetchEvents]);

  // ── Crée un événement ───────────────────────────────────────────
  const createEvent = useCallback(async (payload) => {
    const { data } = await api.post("/api/calendar/events", payload);
    setEvents(prev => [...prev, data.event]);
    return data.event;
  }, []);

  // ── Met à jour un événement ─────────────────────────────────────
  const updateEvent = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/calendar/events/${id}`, payload);
    setEvents(prev => prev.map(ev =>
      (ev._id === id || ev.googleId === id) ? { ...ev, ...data.event } : ev
    ));
    return data.event;
  }, []);

  // ── Supprime un événement ───────────────────────────────────────
  const deleteEvent = useCallback(async (id) => {
    await api.delete(`/api/calendar/events/${id}`);
    setEvents(prev => prev.filter(ev =>
      ev._id !== id && ev.googleId !== id
    ));
  }, []);

  return {
    events,
    loading,
    syncing,
    error,
    setError,
    googleStatus,
    checkGoogleStatus,
    connectGoogle,
    disconnectGoogle,
    fetchEvents,
    syncNow,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}