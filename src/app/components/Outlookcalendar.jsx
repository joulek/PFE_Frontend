// ============================================================
// components/OutlookCalendar.jsx
// Composant calendrier avec sync Outlook bidirectionnelle
// ============================================================
"use client";

import React, { useState } from 'react';
import { useOutlookCalendar } from '../hooks/Useoutlookcalendar';

// ─── Icônes SVG inline ────────────────────────────────────────
const OutlookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="3" fill="#0078D4"/>
    <path d="M12 6C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  </svg>
);

const SyncIcon = ({ spinning }) => (
  <svg
    width="16" height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}
  >
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

// ─── Modal création/édition d'event ───────────────────────────
const EventModal = ({ event, onSave, onClose }) => {
  const [form, setForm] = useState(
    event || {
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      isAllDay: false,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.start || !form.end) return;
    onSave(form);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Titre *</label>
            <input
              style={styles.input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre de l'événement"
              required
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Début *</label>
              <input
                type="datetime-local"
                style={styles.input}
                value={form.start?.slice(0, 16) || ''}
                onChange={(e) => setForm({ ...form, start: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Fin *</label>
              <input
                type="datetime-local"
                style={styles.input}
                value={form.end?.slice(0, 16) || ''}
                onChange={(e) => setForm({ ...form, end: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Lieu</label>
            <input
              style={styles.input}
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Adresse ou lien Teams/Zoom"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes..."
            />
          </div>

          <div style={styles.fieldCheckbox}>
            <input
              type="checkbox"
              id="isAllDay"
              checked={form.isAllDay || false}
              onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
            />
            <label htmlFor="isAllDay" style={{ marginLeft: 8 }}>Journée entière</label>
          </div>

          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.btnSecondary}>
              Annuler
            </button>
            <button type="submit" style={styles.btnPrimary}>
              {event ? 'Mettre à jour' : 'Créer'} et sync Outlook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────
const OutlookCalendar = () => {
  const {
    events,
    outlookStatus,
    loading,
    syncing,
    error,
    setError,
    connectOutlook,
    disconnectOutlook,
    createEvent,
    updateEvent,
    deleteEvent,
    syncNow,
  } = useOutlookCalendar();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (formData) => {
    let result;
    if (editingEvent) {
      result = await updateEvent(editingEvent.id, formData);
    } else {
      result = await createEvent(formData);
    }

    if (result.success) {
      showToast(
        editingEvent
          ? '✅ Événement mis à jour et synchronisé avec Outlook !'
          : '✅ Événement créé et ajouté à votre Outlook !'
      );
      setShowModal(false);
      setEditingEvent(null);
    } else {
      showToast(result.error || 'Erreur', 'error');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Supprimer cet événement de l\'app et de Outlook ?')) return;
    const result = await deleteEvent(eventId);
    if (result.success) showToast('🗑️ Événement supprimé de Outlook également');
    else showToast('Erreur lors de la suppression', 'error');
  };

  const handleSync = async () => {
    const result = await syncNow();
    if (result.success) showToast(`🔄 ${result.synced} événements synchronisés depuis Outlook`);
    else showToast('Erreur synchronisation', 'error');
  };

  return (
    <div style={styles.container}>
      {/* ─── Header ─── */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📅 Calendrier</h2>
          <p style={styles.subtitle}>
            {outlookStatus.connected
              ? `Synchronisé avec ${outlookStatus.outlookEmail}`
              : 'Connectez Outlook pour synchroniser vos événements'}
          </p>
        </div>

        <div style={styles.headerActions}>
          {/* Bouton Sync */}
          {outlookStatus.connected && (
            <button onClick={handleSync} style={styles.btnSync} disabled={syncing}>
              <SyncIcon spinning={syncing} />
              {syncing ? 'Sync...' : 'Sync maintenant'}
            </button>
          )}

          {/* Bouton Outlook */}
          {outlookStatus.connected ? (
            <div style={styles.connectedBadge}>
              <OutlookIcon />
              <span>Outlook connecté</span>
              <button
                onClick={disconnectOutlook}
                style={styles.disconnectBtn}
                title="Déconnecter Outlook"
              >
                ✕
              </button>
            </div>
          ) : (
            <button onClick={connectOutlook} style={styles.btnOutlook}>
              <OutlookIcon />
              Connecter Outlook
            </button>
          )}

          {/* Bouton Nouvel événement */}
          <button
            onClick={() => { setEditingEvent(null); setShowModal(true); }}
            style={styles.btnPrimary}
          >
            + Nouvel événement
          </button>
        </div>
      </div>

      {/* ─── Bannière d'alerte si non connecté ─── */}
      {!outlookStatus.connected && (
        <div style={styles.alertBanner}>
          <span>⚠️ Connectez votre Outlook pour que vos événements se synchronisent automatiquement dans les deux sens.</span>
          <button onClick={connectOutlook} style={styles.alertBtn}>
            Connecter maintenant
          </button>
        </div>
      )}

      {/* ─── Erreur ─── */}
      {error && (
        <div style={styles.errorBanner}>
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ─── Liste des événements ─── */}
      <div style={styles.eventsList}>
        {loading && !events.length ? (
          <div style={styles.loadingState}>⏳ Chargement des événements...</div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p>Aucun événement pour le moment</p>
            <button
              onClick={() => setShowModal(true)}
              style={styles.btnPrimary}
            >
              Créer un événement
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} style={styles.eventCard}>
              <div style={styles.eventDateBadge}>
                <span style={styles.eventDay}>
                  {new Date(event.startDate).getDate()}
                </span>
                <span style={styles.eventMonth}>
                  {new Date(event.startDate).toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              </div>

              <div style={styles.eventContent}>
                <div style={styles.eventTitleRow}>
                  <h4 style={styles.eventTitle}>{event.title}</h4>
                  {/* Badge source */}
                  <span style={{
                    ...styles.sourceBadge,
                    background: event.source === 'outlook' ? '#e3f2fd' : '#e8f5e9',
                    color: event.source === 'outlook' ? '#1565c0' : '#2e7d32',
                  }}>
                    {event.source === 'outlook' ? '📧 Outlook' : '🏠 App'}
                  </span>
                </div>

                <div style={styles.eventMeta}>
                  <span>🕐 {new Date(event.startDate).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit'
                  })} → {new Date(event.endDate).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit'
                  })}</span>
                  {event.location && <span>📍 {event.location}</span>}
                </div>

                {event.description && (
                  <p style={styles.eventDesc}>{event.description}</p>
                )}
              </div>

              <div style={styles.eventActions}>
                <button
                  onClick={() => { setEditingEvent(event); setShowModal(true); }}
                  style={styles.btnIcon}
                  title="Modifier"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  style={styles.btnIcon}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <EventModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
        />
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? '#d32f2f' : '#2e7d32',
        }}>
          {toast.msg}
        </div>
      )}

      {/* CSS pour l'animation spin */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  container:       { maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title:           { margin: '0 0 4px', fontSize: 24, fontWeight: 700 },
  subtitle:        { margin: 0, color: '#666', fontSize: 14 },
  headerActions:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  btnOutlook:      { display: 'flex', alignItems: 'center', gap: 8, background: '#0078D4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnPrimary:      { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnSecondary:    { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnSync:         { display: 'flex', alignItems: 'center', gap: 6, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnIcon:         { background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 18 },
  connectedBadge:  { display: 'flex', alignItems: 'center', gap: 8, background: '#e3f2fd', color: '#1565c0', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 500 },
  disconnectBtn:   { background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontWeight: 700, padding: '0 0 0 4px', fontSize: 14 },
  alertBanner:     { background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  alertBtn:        { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  errorBanner:     { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', color: '#991b1b' },
  eventsList:      { display: 'flex', flexDirection: 'column', gap: 12 },
  eventCard:       { display: 'flex', gap: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'box-shadow .2s' },
  eventDateBadge:  { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, background: '#f0f9ff', borderRadius: 10, padding: '8px 6px' },
  eventDay:        { fontSize: 22, fontWeight: 700, color: '#0369a1', lineHeight: 1 },
  eventMonth:      { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  eventContent:    { flex: 1 },
  eventTitleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  eventTitle:      { margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' },
  sourceBadge:     { fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '3px 10px' },
  eventMeta:       { display: 'flex', gap: 16, fontSize: 13, color: '#6b7280', marginBottom: 4, flexWrap: 'wrap' },
  eventDesc:       { margin: '4px 0 0', fontSize: 13, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  eventActions:    { display: 'flex', gap: 4, flexShrink: 0 },
  loadingState:    { textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 16 },
  emptyState:      { textAlign: 'center', padding: 80, color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal:           { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' },
  modalHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0', marginBottom: 20 },
  modalTitle:      { margin: 0, fontSize: 18, fontWeight: 700 },
  closeBtn:        { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' },
  modalFooter:     { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '20px 24px', borderTop: '1px solid #f3f4f6', marginTop: 16 },
  field:           { margin: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 6 },
  fieldRow:        { display: 'flex', gap: 0 },
  fieldCheckbox:   { margin: '0 24px 16px', display: 'flex', alignItems: 'center', fontSize: 14, color: '#374151' },
  label:           { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:           { border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
  toast:           { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,.2)', maxWidth: 360 },
};

export default OutlookCalendar;