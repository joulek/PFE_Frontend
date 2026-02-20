"use client";
import React, { useState, useMemo } from 'react';
import { useOutlookCalendar } from '../hooks/Useoutlookcalendar';

// ─── Icons ───────────────────────────────────────────────────
const OutlookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#0078D4"/>
    <path d="M12 6C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
  </svg>
);
const SyncIcon = ({ spinning }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const PrintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const TeamsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#5059C9">
    <path d="M19.5 8.5h-3v7a3.5 3.5 0 0 1-7 0v-7h-3a.5.5 0 0 0-.5.5v7a7 7 0 0 0 14 0V9a.5.5 0 0 0-.5-.5z"/>
    <circle cx="12" cy="4.5" r="2.5"/>
  </svg>
);
const ChevLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>;

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_FULL  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS     = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const HOURS      = Array.from({ length: 24 }, (_, i) => i);

// ─── Event Modal (Outlook-style) ─────────────────────────────
const EventModal = ({ event, defaultDate, defaultHour, onSave, onClose }) => {
  const pad = (n) => String(n).padStart(2, '0');
  const toLocal = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : '';

  const initStart = event ? toLocal(event.startDate)
    : defaultDate ? `${defaultDate}T${pad(defaultHour || 9)}:00`
    : '';
  const initEnd = event ? toLocal(event.endDate)
    : defaultDate ? `${defaultDate}T${pad((defaultHour || 9) + 1)}:00`
    : '';

  const [form, setForm] = useState({
    title:       event?.title       || '',
    description: event?.description || '',
    start:       initStart,
    end:         initEnd,
    location:    event?.location    || '',
    isAllDay:    event?.isAllDay    || false,
    attendees:   event?.attendees   || [],
    isTeams:     false,
  });
  const [attendeeInput, setAttendeeInput] = useState('');

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (!email || form.attendees.find(a => a.email === email)) return;
    setForm({ ...form, attendees: [...form.attendees, { email, name: email }] });
    setAttendeeInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.start || !form.end) return;
    onSave({ ...form, start: new Date(form.start).toISOString(), end: new Date(form.end).toISOString() });
  };

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 680 }}>
        {/* Header barre */}
        <div style={{ background: '#f3f2f1', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ddd' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#201f1e' }}>
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => {
              document.getElementById('outlook-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }} style={{ ...S.btnOutlookSave }}>
              💾 Enregistrer
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#605e5c', padding: '0 4px' }}>✕</button>
          </div>
        </div>

        {/* Toolbar options */}
        <div style={{ background: '#fff', padding: '8px 20px', display: 'flex', gap: 10, borderBottom: '1px solid #edebe9', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: form.isTeams ? '#5059C9' : '#605e5c', fontWeight: form.isTeams ? 600 : 400 }}>
            <div style={{ ...S.toggle, background: form.isTeams ? '#5059C9' : '#ccc' }} onClick={() => setForm({ ...form, isTeams: !form.isTeams })}>
              <div style={{ ...S.toggleThumb, transform: form.isTeams ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
            <TeamsIcon /> Réunion Teams
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#605e5c' }}>
            <input type="checkbox" checked={form.isAllDay} onChange={e => setForm({ ...form, isAllDay: e.target.checked })} />
            Journée entière
          </label>
        </div>

        <form id="outlook-form" onSubmit={handleSubmit} style={{ padding: '0 0 0 0' }}>
          {/* Title */}
          <div style={{ padding: '16px 20px 0' }}>
            <input
              style={{ width: '100%', border: 'none', borderBottom: '2px solid #0078D4', outline: 'none', fontSize: 20, fontWeight: 600, color: '#201f1e', padding: '4px 0', boxSizing: 'border-box', fontFamily: 'inherit' }}
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ajoutez un titre" required
            />
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Attendees */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={S.fieldIcon}>👥</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  {form.attendees.map((a, i) => (
                    <span key={i} style={S.attendeeChip}>
                      {a.name || a.email}
                      <button type="button" onClick={() => setForm({ ...form, attendees: form.attendees.filter((_, j) => j !== i) })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, color: '#888', fontSize: 12 }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...S.fieldInput, flex: 1 }}
                    value={attendeeInput}
                    onChange={e => setAttendeeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    placeholder="Invitez des participants (email)"
                  />
                  <button type="button" onClick={addAttendee} style={{ ...S.btnSmall, background: '#0078D4', color: '#fff' }}>Ajouter</button>
                </div>
              </div>
            </div>

            {/* Date/Time */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={S.fieldIcon}>🕐</span>
              <input type="datetime-local" style={S.fieldInput} value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })} required disabled={form.isAllDay} />
              <span style={{ color: '#605e5c', fontSize: 13 }}>à</span>
              <input type="datetime-local" style={S.fieldInput} value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })} required disabled={form.isAllDay} />
              {form.isAllDay && (
                <>
                  <input type="date" style={S.fieldInput} value={form.start?.slice(0,10)}
                    onChange={e => setForm({ ...form, start: e.target.value + 'T00:00', end: e.target.value + 'T23:59' })} required />
                </>
              )}
            </div>

            {/* Location */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={S.fieldIcon}>📍</span>
              <input style={{ ...S.fieldInput, flex: 1 }} value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Rechercher un lieu" />
            </div>

            {/* Teams link auto */}
            {form.isTeams && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={S.fieldIcon}><TeamsIcon /></span>
                <span style={{ fontSize: 13, color: '#5059C9', fontWeight: 500 }}>Lien de réunion Teams généré automatiquement</span>
              </div>
            )}

            {/* Description */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={S.fieldIcon}>≡</span>
              <textarea style={{ ...S.fieldInput, flex: 1, height: 90, resize: 'vertical' }}
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ajoutez une description..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid #edebe9' }}>
            <button type="button" onClick={onClose} style={S.btnSecondary}>Annuler</button>
            <button type="submit" style={S.btnPrimary}>Enregistrer & sync Outlook</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Vue MOIS ────────────────────────────────────────────────
const MonthView = ({ year, month, events, today, onDayClick, onEventClick }) => {
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.startDate) return;
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const cells = [];
    // prev month padding
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, cur: false });
    return cells;
  }, [year, month]);

  const isToday = (d, cur) => cur && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #edebe9', background: '#faf9f8' }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: '#8a8886', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
        {days.map((cell, i) => {
          const key = cell.cur ? `${year}-${month}-${cell.day}` : null;
          const dayEvs = key ? (eventsByDay[key] || []) : [];
          const tod = isToday(cell.day, cell.cur);
          return (
            <div key={i} onClick={() => cell.cur && onDayClick(cell.day)}
              style={{ minHeight: 110, padding: '4px', borderRight: '1px solid #edebe9', borderBottom: '1px solid #edebe9',
                background: cell.cur ? '#fff' : '#faf9f8', cursor: cell.cur ? 'pointer' : 'default',
                transition: 'background .1s',
              }}>
              <div style={{ marginBottom: 3 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%',
                  background: tod ? '#0078D4' : 'transparent', color: tod ? '#fff' : cell.cur ? '#201f1e' : '#c8c6c4', fontSize: 13, fontWeight: tod ? 700 : 500 }}>
                  {cell.day}
                </span>
              </div>
              {dayEvs.slice(0, 3).map((ev, ei) => (
                <div key={ei} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                  style={{ fontSize: 11, padding: '2px 5px', borderRadius: 3, marginBottom: 2, cursor: 'pointer',
                    background: ev.source === 'outlook' ? '#deecf9' : '#e8def8',
                    color:      ev.source === 'outlook' ? '#004578' : '#4b0082',
                    borderLeft: `3px solid ${ev.source === 'outlook' ? '#0078D4' : '#7c3aed'}`,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                  {!ev.isAllDay && `${new Date(ev.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} `}
                  {ev.title}
                </div>
              ))}
              {dayEvs.length > 3 && <div style={{ fontSize: 10, color: '#8a8886', paddingLeft: 5 }}>+{dayEvs.length - 3} autres</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Vue SEMAINE ─────────────────────────────────────────────
const WeekView = ({ weekStart, events, today, onSlotClick, onEventClick }) => {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!ev.startDate) return;
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const isToday = (d) => d.toDateString() === today.toDateString();

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header jours */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: '1px solid #edebe9', background: '#faf9f8', position: 'sticky', top: 0, zIndex: 2 }}>
        <div />
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 4px', borderLeft: '1px solid #edebe9' }}>
            <div style={{ fontSize: 11, color: '#8a8886', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{DAYS_SHORT[i]}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', marginTop: 2,
              background: isToday(d) ? '#0078D4' : 'transparent', color: isToday(d) ? '#fff' : '#201f1e', fontSize: 15, fontWeight: 700 }}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Grid heures */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', flex: 1 }}>
        {HOURS.map(h => (
          <React.Fragment key={h}>
            <div style={{ fontSize: 10, color: '#8a8886', textAlign: 'right', paddingRight: 6, paddingTop: 2, borderBottom: '1px solid #edebe9', height: 52 }}>
              {h === 0 ? '' : `${String(h).padStart(2,'0')}:00`}
            </div>
            {days.map((d, di) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const slotEvs = (eventsByDay[key] || []).filter(ev => {
                const evH = new Date(ev.startDate).getHours();
                return evH === h;
              });
              return (
                <div key={di} onClick={() => onSlotClick(d, h)}
                  style={{ borderLeft: '1px solid #edebe9', borderBottom: '1px solid #edebe9', height: 52,
                    cursor: 'pointer', position: 'relative', background: isToday(d) ? '#f0f6fc' : '#fff',
                    transition: 'background .1s' }}>
                  {slotEvs.map((ev, ei) => (
                    <div key={ei} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      style={{ position: 'absolute', top: 2, left: 2, right: 2, borderRadius: 4, padding: '2px 5px',
                        background: ev.source === 'outlook' ? '#deecf9' : '#e8def8',
                        color:      ev.source === 'outlook' ? '#004578' : '#4b0082',
                        borderLeft: `3px solid ${ev.source === 'outlook' ? '#0078D4' : '#7c3aed'}`,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', zIndex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Vue JOUR ────────────────────────────────────────────────
const DayView = ({ date, events, onSlotClick, onEventClick }) => {
  const dayEvs = useMemo(() => events.filter(ev => {
    if (!ev.startDate) return false;
    const d = new Date(ev.startDate);
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
  }), [events, date]);

  const byHour = useMemo(() => {
    const map = {};
    dayEvs.forEach(ev => {
      const h = new Date(ev.startDate).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(ev);
    });
    return map;
  }, [dayEvs]);

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr' }}>
        {HOURS.map(h => (
          <React.Fragment key={h}>
            <div style={{ fontSize: 11, color: '#8a8886', textAlign: 'right', paddingRight: 8, paddingTop: 4, borderBottom: '1px solid #edebe9', height: 60 }}>
              {h === 0 ? '' : `${String(h).padStart(2,'0')}:00`}
            </div>
            <div onClick={() => onSlotClick(date, h)}
              style={{ borderLeft: '1px solid #edebe9', borderBottom: '1px solid #edebe9', height: 60, cursor: 'pointer', position: 'relative', padding: 2 }}>
              {(byHour[h] || []).map((ev, ei) => (
                <div key={ei} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                  style={{ borderRadius: 4, padding: '4px 8px', marginBottom: 2,
                    background: ev.source === 'outlook' ? '#deecf9' : '#e8def8',
                    color:      ev.source === 'outlook' ? '#004578' : '#4b0082',
                    borderLeft: `3px solid ${ev.source === 'outlook' ? '#0078D4' : '#7c3aed'}`,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {new Date(ev.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {ev.title}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Composant Principal ──────────────────────────────────────
const OutlookCalendar = () => {
  const { events, outlookStatus, loading, syncing, error, setError,
    connectOutlook, disconnectOutlook, createEvent, updateEvent, deleteEvent, syncNow } = useOutlookCalendar();

  const today = new Date();
  const [view,        setView]        = useState('month'); // month | week | day
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekStart,   setWeekStart]   = useState(() => {
    const d = new Date(today); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); return d;
  });
  const [dayDate,     setDayDate]     = useState(new Date(today));
  const [showModal,   setShowModal]   = useState(false);
  const [editingEv,   setEditingEv]   = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [defaultHour, setDefaultHour] = useState(9);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const navigate = (dir) => {
    if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else if (view === 'week') setWeekStart(d => { const nd = new Date(d); nd.setDate(nd.getDate() + dir * 7); return nd; });
    else setDayDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + dir); return nd; });
  };

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const d = new Date(today); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); setWeekStart(d);
    setDayDate(new Date(today));
  };

  const getNavLabel = () => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const end = new Date(weekStart); end.setDate(end.getDate() + 6);
      return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0,3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0,3)} ${end.getFullYear()}`;
    }
    return `${DAYS_FULL[dayDate.getDay() === 0 ? 6 : dayDate.getDay()-1]} ${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]} ${dayDate.getFullYear()}`;
  };

  const openNewEventModal = (date, hour = 9) => {
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
    setDefaultDate(`${y}-${m}-${d}`); setDefaultHour(hour); setEditingEv(null); setShowModal(true);
  };

  const handleSave = async (formData) => {
    const result = editingEv
      ? await updateEvent(editingEv._id?.toString() || editingEv.outlookId, formData)
      : await createEvent(formData);
    if (result.success) { showToast(editingEv ? '✅ Mis à jour !' : '✅ Créé !'); setShowModal(false); setEditingEv(null); }
    else showToast(result.message || 'Erreur', 'error');
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ?')) return;
    const result = await deleteEvent(id);
    if (result.success) showToast('🗑️ Supprimé'); else showToast('Erreur', 'error');
  };

  const handleEventClick = (ev) => { setEditingEv(ev); setShowModal(true); };

  const handlePrint = () => window.print();
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: 'Calendrier', text: 'Mon calendrier Optylab', url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); showToast('🔗 Lien copié !'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 700, fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#fff' }}>
      {/* ── Barre top Outlook style ── */}
      <div style={{ background: '#0078D4', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
        <OutlookIcon />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginRight: 'auto' }}>Calendrier</span>
        {outlookStatus.connected ? (
          <>
            <span style={{ color: '#c7e0f4', fontSize: 12 }}>{outlookStatus.email}</span>
            <button onClick={disconnectOutlook} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Déconnecter</button>
          </>
        ) : (
          <button onClick={connectOutlook} style={{ background: '#fff', border: 'none', color: '#0078D4', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            Connecter Outlook
          </button>
        )}
      </div>

      {/* ── Barre actions ── */}
      <div style={{ background: '#f3f2f1', borderBottom: '1px solid #edebe9', padding: '6px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setEditingEv(null); setDefaultDate(null); setDefaultHour(9); setShowModal(true); }}
          style={{ ...S.outlookBtn, background: '#0078D4', color: '#fff', fontWeight: 600 }}>
          + Nouvel événement
        </button>
        <div style={{ width: 1, height: 24, background: '#c8c6c4' }} />
        {outlookStatus.connected && (
          <button onClick={async () => { await syncNow(); showToast('🔄 Synchronisé !'); }} style={S.outlookBtn} disabled={syncing}>
            <SyncIcon spinning={syncing} /> Synchroniser
          </button>
        )}
        <button onClick={handleShare} style={S.outlookBtn}><ShareIcon /> Partager</button>
        <button onClick={handlePrint} style={S.outlookBtn}><PrintIcon /> Imprimer</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {['day','week','month'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ ...S.viewBtn, background: view === v ? '#0078D4' : 'transparent', color: view === v ? '#fff' : '#323130', fontWeight: view === v ? 600 : 400 }}>
              {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      {/* Erreurs */}
      {error && (
        <div style={S.errorBanner}>❌ {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>✕</button></div>
      )}
      {!outlookStatus.connected && (
        <div style={S.alertBanner}>
          ⚠️ Connectez Outlook pour synchroniser.
          <button onClick={connectOutlook} style={{ marginLeft: 12, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Connecter</button>
        </div>
      )}

      {/* ── Nav mois/semaine/jour ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #edebe9' }}>
        <button onClick={() => navigate(-1)} style={S.navBtn}><ChevLeft /></button>
        <button onClick={() => navigate(1)}  style={S.navBtn}><ChevRight /></button>
        <button onClick={goToday} style={{ ...S.outlookBtn, fontWeight: 600, color: '#0078D4', border: '1px solid #0078D4' }}>Aujourd'hui</button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#201f1e' }}>{getNavLabel()}</h2>
        {loading && <span style={{ fontSize: 12, color: '#8a8886' }}>⏳ Chargement...</span>}
      </div>

      {/* ── Vue ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {view === 'month' && (
          <MonthView
            year={currentDate.getFullYear()} month={currentDate.getMonth()}
            events={events} today={today}
            onDayClick={(day) => openNewEventModal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'week' && (
          <WeekView weekStart={weekStart} events={events} today={today}
            onSlotClick={(d, h) => openNewEventModal(d, h)}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'day' && (
          <DayView date={dayDate} events={events}
            onSlotClick={(d, h) => openNewEventModal(d, h)}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          event={editingEv}
          defaultDate={defaultDate}
          defaultHour={defaultHour}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEv(null); setDefaultDate(null); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === 'error' ? '#dc2626' : '#107c10' }}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
};

const S = {
  btnPrimary:      { background: '#0078D4', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' },
  btnSecondary:    { background: '#fff', color: '#323130', border: '1px solid #8a8886', borderRadius: 4, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' },
  outlookBtn:      { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 13, color: '#323130', fontFamily: 'inherit' },
  viewBtn:         { border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  navBtn:          { background: '#fff', border: '1px solid #edebe9', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#323130' },
  alertBanner:     { background: '#fff4ce', borderBottom: '1px solid #ffb900', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center' },
  errorBanner:     { background: '#fde7e9', borderBottom: '1px solid #d13438', padding: '8px 16px', fontSize: 13, color: '#a4262c', display: 'flex', alignItems: 'center' },
  // Modal styles
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal:           { background: '#fff', borderRadius: 4, width: '100%', maxWidth: 680, boxShadow: '0 8px 32px rgba(0,0,0,.24)', animation: 'fadeIn .15s ease', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  btnOutlookSave:  { background: '#0078D4', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  fieldIcon:       { width: 20, textAlign: 'center', paddingTop: 4, fontSize: 15, flexShrink: 0 },
  fieldInput:      { border: '1px solid #edebe9', borderRadius: 4, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#faf9f8' },
  attendeeChip:    { display: 'inline-flex', alignItems: 'center', background: '#deecf9', color: '#004578', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
  btnSmall:        { border: 'none', borderRadius: 4, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  toggle:          { width: 32, height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 },
  toggleThumb:     { position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'transform .2s' },
  toast:           { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '12px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,.2)', animation: 'fadeIn .2s ease' },
};

export default OutlookCalendar;
