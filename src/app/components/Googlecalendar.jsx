"use client";
// components/GoogleCalendar.jsx — remplace Outlookcalendar.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useGoogleCalendar } from "../hooks/Usegooglecalendar";
import { Trash2 } from "lucide-react";

/* ================= THEME OPTYLAB ================= */
const THEME_LIGHT = {
  bgPage: "#F1FAF4",
  surface: "#FFFFFF",
  surface2: "#F7FAF8",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  primary: "#6CB33F",
  primaryDark: "#4E8F2F",
  primarySoft: "#E9F5E3",
  todaySoft: "#F0FAF0",
  evBg: "#E9F5E3",
  evText: "#2E6B1F",
  evBorder: "#6CB33F",
  evAltBg: "#EAF2FF",
  evAltText: "#1E3A8A",
  evAltBorder: "#2563EB",
};

const THEME_DARK = {
  bgPage: "#0B1220",
  surface: "#0F1A2F",
  surface2: "#0B1220",
  border: "#24324A",
  text: "#E5E7EB",
  muted: "#94A3B8",
  primary: "#6CB33F",
  primaryDark: "#5AAE35",
  primarySoft: "rgba(108,179,63,0.14)",
  todaySoft: "rgba(108,179,63,0.10)",
  evBg: "rgba(108,179,63,0.16)",
  evText: "#D9F5D0",
  evBorder: "#6CB33F",
  evAltBg: "rgba(59,130,246,0.16)",
  evAltText: "#DBEAFE",
  evAltBorder: "#3B82F6",
};

/* ================= ICONS ================= */
const GoogleCalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
      fill="#fff"
      stroke="#DADCE0"
      strokeWidth="1.5"
    />
    <path d="M16 2v4M8 2v4M3 9h18" stroke="#DADCE0" strokeWidth="1.5" />
    <path
      d="M8 13l2.5 2.5L16 11"
      stroke="#4285F4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="3" y="4" width="18" height="5" rx="2" fill="#4285F4" />
    <text
      x="12"
      y="19"
      textAnchor="middle"
      fontSize="7"
      fontWeight="bold"
      fill="#1a73e8"
    >
      G
    </text>
  </svg>
);

const SyncIcon = ({ spinning }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PrintIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const MeetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#00897B" />
    <path d="M4 8h9v8H4V8zm9 2l4-3v10l-4-3V10z" fill="white" />
  </svg>
);

const ChevLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ================= CONSTS ================= */
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ================= STATUS CONFIG ================= */
const STATUS_CFG = {
  PENDING_CANDIDATE_CONFIRMATION: { label: "En attente",     dot: "#F59E0B", bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  CANDIDATE_REQUESTED_RESCHEDULE: { label: "Report demandé", dot: "#EF4444", bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
  CONFIRMED:                      { label: "Confirmé",       dot: "#10B981", bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
  RESCHEDULED:                    { label: "Reprogrammé",    dot: "#3B82F6", bg: "#DBEAFE", text: "#1E3A8A", border: "#3B82F6" },
  CANCELLED:                      { label: "Annulé",         dot: "#9CA3AF", bg: "#F3F4F6", text: "#6B7280", border: "#9CA3AF" },
};

const STATUS_CFG_DARK = {
  PENDING_CANDIDATE_CONFIRMATION: { label: "En attente",     dot: "#F59E0B", bg: "rgba(245,158,11,0.18)", text: "#FCD34D", border: "#F59E0B" },
  CANDIDATE_REQUESTED_RESCHEDULE: { label: "Report demandé", dot: "#EF4444", bg: "rgba(239,68,68,0.18)",  text: "#FCA5A5", border: "#EF4444" },
  CONFIRMED:                      { label: "Confirmé",       dot: "#10B981", bg: "rgba(16,185,129,0.18)", text: "#6EE7B7", border: "#10B981" },
  RESCHEDULED:                    { label: "Reprogrammé",    dot: "#3B82F6", bg: "rgba(59,130,246,0.18)", text: "#BFDBFE", border: "#3B82F6" },
  CANCELLED:                      { label: "Annulé",         dot: "#9CA3AF", bg: "rgba(156,163,175,0.18)",text: "#9CA3AF", border: "#9CA3AF" },
};

function getStatusCfg(ev, isDark) {
  if (ev?.source !== "nord" || !ev?.status) return null;
  const map = isDark ? STATUS_CFG_DARK : STATUS_CFG;
  return map[ev.status] || null;
}

/* ================= EVENT STYLE ================= */
function eventStyle(ev, T, isDark) {
  const sc = getStatusCfg(ev, isDark);
  if (sc) return { background: sc.bg, color: sc.text, borderLeft: `3px solid ${sc.border}` };
  const isGoogle = ev?.source === "google";
  return {
    background: isGoogle ? T.evBg : T.evAltBg,
    color: isGoogle ? T.evText : T.evAltText,
    borderLeft: `3px solid ${isGoogle ? T.evBorder : T.evAltBorder}`,
  };
}

/* ================= STYLES FACTORY ================= */
const makeStyles = (T, isDark) => ({
  googleBtn: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "7px 12px",
    background: T.surface,
    cursor: "pointer",
    fontSize: 13,
    color: T.text,
  },
  viewBtn: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: T.border,
    background: "transparent",
    padding: "7px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    color: T.text,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    background: isDark ? "rgba(239,68,68,0.12)" : "#FEE2E2",
    color: isDark ? "#FCA5A5" : "#991B1B",
    padding: "10px 16px",
    fontSize: 13,
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    alignItems: "center",
  },
  alertBanner: {
    background: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7",
    color: isDark ? "#FCD34D" : "#92400E",
    padding: "10px 16px",
    fontSize: 13,
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    alignItems: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    background: T.surface,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(0,0,0,.35)",
    border: `1px solid ${T.border}`,
  },
  btnGoogleSave: {
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
    background: T.primary,
    color: "#fff",
  },
  fieldIcon: {
    width: 26,
    textAlign: "center",
    color: T.muted,
    paddingTop: 3,
  },
  fieldInput: {
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 13,
    outline: "none",
    background: T.surface,
    color: T.text,
  },
  attendeeChip: {
    background: T.surface2,
    border: `1px solid ${T.border}`,
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    color: T.text,
  },
  btnSmall: {
    border: "none",
    borderRadius: 10,
    padding: "9px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  btnSecondary: {
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  btnPrimary: {
    border: "none",
    background: T.primary,
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
  },
});

/* ================= DATE HELPERS ================= */
function monthRange(d) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function weekRange(weekStart) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function dayRange(d) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function getMonWeekStart(d) {
  const day = new Date(d);
  const dow = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - dow);
  day.setHours(0, 0, 0, 0);
  return day;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ================= HOOK MODE DARK FROM NAVBAR ================= */
function useNavbarDarkMode() {
  const getDark = () => {
    if (typeof window === "undefined") return false;
    return (
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark")
    );
  };

  const [isDark, setIsDark] = useState(getDark);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateTheme = () => setIsDark(getDark());

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("storage", updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  return isDark;
}

/* ================= CONFIRM DELETE MODAL ================= */
const ConfirmDeleteModal = ({ T, S, onConfirm, onCancel }) => (
  <div style={S.overlay}>
    <div style={{ ...S.modal, maxWidth: 420 }}>
      <div style={{ padding: 24, background: T.surface, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={48} color="#EF4444" />
        </div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: T.text,
            marginBottom: 12,
          }}
        >
          Confirmer la suppression ?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: T.muted,
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          Vous allez supprimer définitivement cet événement.
          <br />
          Cette action est irréversible.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{ ...S.btnSecondary, padding: "12px 24px", fontSize: 14 }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              border: "none",
              background: "#EF4444",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 28px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ================= EVENT MODAL ================= */
const EventModal = ({ T, S, event, defaultDate, defaultHour, onSave, onClose, onDelete }) => {
  const pad = (n) => String(n).padStart(2, "0");

  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const initStart = event
    ? toLocal(event.startDate)
    : defaultDate
    ? `${defaultDate}T${pad(defaultHour || 9)}:00`
    : "";

  const initEnd = event
    ? toLocal(event.endDate)
    : defaultDate
    ? `${defaultDate}T${pad((defaultHour || 9) + 1)}:00`
    : "";

  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    start: initStart,
    end: initEnd,
    location: event?.location || "",
    isAllDay: event?.isAllDay || false,
    attendees: event?.attendees || [],
    addMeet: false,
  });

  const [attendeeInput, setAttendeeInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (!email || form.attendees.find((a) => a.email === email)) return;
    setForm({
      ...form,
      attendees: [...form.attendees, { email, name: email }],
    });
    setAttendeeInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.start || !form.end) return;
    onSave({
      ...form,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
    });
  };

  return (
    <>
      <div style={S.overlay}>
        <div style={{ ...S.modal, maxWidth: 680 }}>
          <div
            style={{
              background: T.surface2,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 14, color: T.text }}>
              {event ? "Modifier l'événement" : "Nouvel événement"}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {event && (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  style={{
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.text,
                    borderRadius: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  Supprimer
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("google-cal-form")
                    ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
                }
                style={S.btnGoogleSave}
              >
                Enregistrer
              </button>

              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  color: T.muted,
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            style={{
              background: T.surface,
              padding: "8px 20px",
              display: "flex",
              gap: 10,
              borderBottom: `1px solid ${T.border}`,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 13,
                color: form.addMeet ? "#00897B" : T.muted,
                fontWeight: form.addMeet ? 700 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={form.addMeet}
                onChange={() => setForm({ ...form, addMeet: !form.addMeet })}
              />
              <MeetIcon /> Google Meet
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 13,
                color: T.muted,
              }}
            >
              <input
                type="checkbox"
                checked={form.isAllDay}
                onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
              />
              Journée entière
            </label>
          </div>

          <form id="google-cal-form" onSubmit={handleSubmit}>
            <div style={{ padding: "16px 20px 0" }}>
              <input
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: `2px solid ${T.primary}`,
                  outline: "none",
                  fontSize: 20,
                  fontWeight: 800,
                  color: T.text,
                  padding: "4px 0",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "transparent",
                }}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ajoutez un titre"
                required
              />
            </div>

            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={S.fieldIcon}>👥</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 6,
                    }}
                  >
                    {form.attendees.map((a, i) => (
                      <span key={i} style={S.attendeeChip}>
                        {a.name || a.email}
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              attendees: form.attendees.filter((_, j) => j !== i),
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: 4,
                            color: T.muted,
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...S.fieldInput, flex: 1 }}
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                      placeholder="Invitez des participants (email)"
                    />
                    <button
                      type="button"
                      onClick={addAttendee}
                      style={{ ...S.btnSmall, background: T.primary, color: "#fff" }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={S.fieldIcon}>🕐</span>
                {!form.isAllDay ? (
                  <>
                    <input
                      type="datetime-local"
                      style={S.fieldInput}
                      value={form.start}
                      onChange={(e) => setForm({ ...form, start: e.target.value })}
                      required
                    />
                    <span style={{ color: T.muted, fontSize: 13 }}>à</span>
                    <input
                      type="datetime-local"
                      style={S.fieldInput}
                      value={form.end}
                      onChange={(e) => setForm({ ...form, end: e.target.value })}
                      required
                    />
                  </>
                ) : (
                  <input
                    type="date"
                    style={S.fieldInput}
                    value={form.start?.slice(0, 10)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start: `${e.target.value}T00:00`,
                        end: `${e.target.value}T23:59`,
                      })
                    }
                    required
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={S.fieldIcon}>📍</span>
                <input
                  style={{ ...S.fieldInput, flex: 1 }}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Rechercher un lieu"
                />
              </div>

              {form.addMeet && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={S.fieldIcon}>
                    <MeetIcon />
                  </span>
                  <span style={{ fontSize: 13, color: "#00897B", fontWeight: 700 }}>
                    Lien Google Meet généré automatiquement
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={S.fieldIcon}>≡</span>
                <textarea
                  style={{ ...S.fieldInput, flex: 1, height: 90, resize: "vertical" }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ajoutez une description..."
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                padding: "12px 20px",
                borderTop: `1px solid ${T.border}`,
                background: T.surface2,
              }}
            >
              <button type="button" onClick={onClose} style={S.btnSecondary}>
                Annuler
              </button>
              <button type="submit" style={S.btnPrimary}>
                Enregistrer & sync Google
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDeleteModal
          T={T}
          S={S}
          onConfirm={() => {
            onDelete(event._id?.toString() || event.googleId);
            setShowConfirm(false);
            onClose();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

/* ================= MINI MONTH ================= */
const MiniMonth = ({ T, S, currentDate, selectedDate, onChangeMonth, onPickDay }) => {
  const [mini, setMini] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  useEffect(() => {
    setMini(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  const year = mini.getFullYear();
  const month = mini.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];

  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        background: T.surface,
        padding: 12,
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => {
            const d = new Date(mini);
            d.setMonth(d.getMonth() - 1);
            setMini(d);
            onChangeMonth?.(d);
          }}
          style={{ ...S.navBtn, width: 26, height: 26 }}
        >
          <ChevLeft />
        </button>

        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {MONTHS[month]} {year}
        </span>

        <button
          onClick={() => {
            const d = new Date(mini);
            d.setMonth(d.getMonth() + 1);
            setMini(d);
            onChangeMonth?.(d);
          }}
          style={{ ...S.navBtn, width: 26, height: 26 }}
        >
          <ChevRight />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: T.muted,
              fontWeight: 700,
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const date = new Date(year, month, d);
          const isToday = isSameDay(date, today);
          const isSel = selectedDate && isSameDay(date, selectedDate);

          return (
            <button
              key={i}
              onClick={() => onPickDay?.(date)}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: isToday || isSel ? 900 : 400,
                background: isSel ? T.primary : isToday ? T.todaySoft : "transparent",
                color: isSel ? "#fff" : isToday ? T.primaryDark : T.text,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ================= MONTH VIEW ================= */
const MonthView = ({ T, isDark, year, month, events, today, onDayClick, onEventClick }) => {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsForDay = (d) => {
    const dayDate = new Date(year, month, d);
    return events.filter((ev) => {
      const s = new Date(ev.startDate || ev.start);
      return isSameDay(s, dayDate);
    });
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            style={{
              padding: "8px 0",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: T.muted,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((d, i) => {
          const isToday = d && isSameDay(new Date(year, month, d), today);
          const dayEvs = d ? eventsForDay(d) : [];

          return (
            <div
              key={i}
              onClick={() => d && onDayClick?.(d)}
              style={{
                minHeight: 90,
                borderRight: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                padding: 4,
                cursor: d ? "pointer" : "default",
                background: T.surface,
              }}
            >
              {d && (
                <>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: isToday ? T.primary : "transparent",
                      color: isToday ? "#fff" : T.text,
                      fontWeight: isToday ? 900 : 400,
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    {d}
                  </div>

                  {dayEvs.slice(0, 3).map((ev, j) => {
                    const sc = getStatusCfg(ev, isDark);
                    return (
                    <div
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                      style={{
                        ...eventStyle(ev, T, isDark),
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        padding: "2px 5px",
                        marginBottom: 2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                      }}
                    >
                      {sc && <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot, flexShrink:0, display:"inline-block", marginRight:3, verticalAlign:"middle" }} />}
                      {ev.title}
                      {sc && <span style={{ marginLeft:4, fontSize:9, fontWeight:900, opacity:0.85 }}>{sc.label}</span>}
                    </div>
                    );
                  })}

                  {dayEvs.length > 3 && (
                    <div style={{ fontSize: 10, color: T.muted }}>+{dayEvs.length - 3}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= WEEK VIEW ================= */
const WeekView = ({ T, isDark, weekStart, events, today, onSlotClick, onEventClick }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const eventsForDayHour = (day, h) =>
    events.filter((ev) => {
      const s = new Date(ev.startDate || ev.start);
      return isSameDay(s, day) && s.getHours() === h;
    });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "48px repeat(7,1fr)",
        overflow: "auto",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      <div />
      {days.map((d, i) => (
        <div
          key={i}
          style={{
            textAlign: "center",
            padding: "8px 0",
            borderBottom: `1px solid ${T.border}`,
            borderLeft: `1px solid ${T.border}`,
            fontSize: 12,
            fontWeight: isSameDay(d, today) ? 900 : 400,
            color: isSameDay(d, today) ? T.primary : T.text,
            background: T.surface2,
          }}
        >
          <div>{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i]}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</div>
        </div>
      ))}

      {HOURS.map((h) => (
        <React.Fragment key={h}>
          <div
            style={{
              textAlign: "right",
              padding: "2px 6px 0 0",
              fontSize: 11,
              color: T.muted,
              height: 48,
              boxSizing: "border-box",
            }}
          >
            {h}:00
          </div>

          {days.map((d, di) => {
            const evs = eventsForDayHour(d, h);
            return (
              <div
                key={di}
                onClick={() => onSlotClick?.(d, h)}
                style={{
                  borderLeft: `1px solid ${T.border}`,
                  borderBottom: `1px solid ${T.border}`,
                  height: 48,
                  position: "relative",
                  cursor: "pointer",
                  background: T.surface,
                }}
              >
                {evs.map((ev, j) => {
                  const sc = getStatusCfg(ev, isDark);
                  return (
                  <div
                    key={j}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                    style={{
                      ...eventStyle(ev, T, isDark),
                      position: "absolute",
                      inset: "1px 2px",
                      borderRadius: 4,
                      padding: "2px 4px",
                      fontSize: 10,
                      fontWeight: 700,
                      overflow: "hidden",
                      cursor: "pointer",
                      zIndex: j + 1,
                    }}
                  >
                    {sc && <span style={{ display:"inline-block",width:5,height:5,borderRadius:"50%",background:sc.dot,marginRight:3,verticalAlign:"middle" }} />}
                    {ev.title}
                    {sc && <span style={{ marginLeft:3,fontSize:8,fontWeight:900,opacity:0.85 }}>{sc.label}</span>}
                  </div>
                  );
                })}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ================= DAY VIEW ================= */
const DayView = ({ T, isDark, date, events, onSlotClick, onEventClick }) => {
  const dayEvs = events.filter((ev) => isSameDay(new Date(ev.startDate || ev.start), date));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "48px 1fr",
        overflow: "auto",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      {HOURS.map((h) => (
        <React.Fragment key={h}>
          <div
            style={{
              textAlign: "right",
              padding: "2px 6px 0 0",
              fontSize: 11,
              color: T.muted,
              height: 64,
              boxSizing: "border-box",
            }}
          >
            {h}:00
          </div>
          <div
            onClick={() => onSlotClick?.(date, h)}
            style={{
              borderLeft: `1px solid ${T.border}`,
              borderBottom: `1px solid ${T.border}`,
              height: 64,
              position: "relative",
              cursor: "pointer",
              background: T.surface,
            }}
          >
            {dayEvs
              .filter((ev) => new Date(ev.startDate || ev.start).getHours() === h)
              .map((ev, j) => {
                const sc = getStatusCfg(ev, isDark);
                return (
                <div
                  key={j}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                  style={{
                    ...eventStyle(ev, T, isDark),
                    position: "absolute",
                    inset: "1px 4px",
                    borderRadius: 4,
                    padding: "3px 6px",
                    fontSize: 12,
                    fontWeight: 700,
                    overflow: "hidden",
                    cursor: "pointer",
                    zIndex: j + 1,
                  }}
                >
                  {sc && <span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:sc.dot,marginRight:4,verticalAlign:"middle" }} />}
                  {ev.title}
                  {sc && <span style={{ marginLeft:5,fontSize:9,fontWeight:900,opacity:0.85 }}>{sc.label}</span>}
                </div>
                );
              })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const GoogleCalendar = ({ onDateSelect }) => {
  const {
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
  } = useGoogleCalendar();

  const isDark = useNavbarDarkMode();
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getMonWeekStart(new Date()));
  const [dayDate, setDayDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [editingEv, setEditingEv] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [defaultHour, setDefaultHour] = useState(9);
  const [toast, setToast] = useState(null);

  const T = isDark ? THEME_DARK : THEME_LIGHT;
  const S = useMemo(() => makeStyles(T, isDark), [T, isDark]);
  const today = new Date();

  useEffect(() => {
    const init = async () => {
      await checkGoogleStatus();
      const range =
        view === "month"
          ? monthRange(currentDate)
          : view === "week"
          ? weekRange(weekStart)
          : dayRange(dayDate);
      await fetchEvents(range);
    };

    init();

    const onRefresh = () => fetchEvents();
    window.addEventListener("calendar:refresh", onRefresh);
    return () => window.removeEventListener("calendar:refresh", onRefresh);
  }, []);

  useEffect(() => {
    let range;
    if (view === "month") range = monthRange(currentDate);
    else if (view === "week") range = weekRange(weekStart);
    else range = dayRange(dayDate);
    fetchEvents(range);
  }, [view, currentDate, weekStart, dayDate]);

  const getNavLabel = () => {
    if (view === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} — ${end.getDate()} ${
        MONTHS[end.getMonth()]
      } ${end.getFullYear()}`;
    }

    return `${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]} ${dayDate.getFullYear()}`;
  };

  const navigate = (dir) => {
    if (view === "month") {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + dir);
      setCurrentDate(d);
    } else if (view === "week") {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dir * 7);
      setWeekStart(d);
    } else {
      const d = new Date(dayDate);
      d.setDate(d.getDate() + dir);
      setDayDate(d);
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setWeekStart(getMonWeekStart(new Date()));
    setDayDate(new Date());
  };

  const handleMiniChangeMonth = (d) => setCurrentDate(new Date(d));

  const handlePickDay = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
      return;
    }
    setDayDate(new Date(date));
    setView("day");
  };

  function openNewEventModal(date, hour = 9) {
    if (onDateSelect) {
      onDateSelect(date);
      return;
    }
    setEditingEv(null);
    const pad = (n) => String(n).padStart(2, "0");
    setDefaultDate(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    );
    setDefaultHour(hour);
    setShowModal(true);
  }

  function handleEventClick(ev) {
    if (ev.source === "google") {
      if (ev.htmlLink) {
        window.open(ev.htmlLink, "_blank");
        return;
      }
    }
    setEditingEv(ev);
    setDefaultDate(null);
    setShowModal(true);
  }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  async function handleSave(payload) {
    try {
      if (editingEv) {
        const id = editingEv._id?.toString() || editingEv.googleId;
        await updateEvent(id, payload);
        showToast("Événement mis à jour ");
      } else {
        await createEvent(payload);
        showToast("Événement créé dans Google Calendar ");
      }
      setShowModal(false);
      setEditingEv(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "Erreur lors de l'enregistrement", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEvent(id);
      showToast("Événement supprimé");
    } catch (e) {
      showToast("Erreur lors de la suppression", "error");
    }
  }

  const handlePrint = () => window.print();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Lien copié ✅");
    } catch {
      showToast("Partage non supporté", "error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: T.bgPage,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── TOP BAR ── */}
      <div
        style={{
          background: T.primary,
          color: "#fff",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>Google Calendar</span>
        </div>

        {googleStatus.connected ? (
          <>
            <span style={{ fontSize: 17, opacity: 0.85 ,fontWeight: 900,}}>
               {googleStatus.googleEmail || "Connecté"}
            </span>
            <button
              onClick={disconnectGoogle}
              style={{
                background: "#fff",
                border: "none",
                color: T.primaryDark,
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Déconnecter
            </button>
          </>
        ) : (
          <button
            onClick={connectGoogle}
            style={{
              background: "#fff",
              border: "none",
              color: T.primaryDark,
              borderRadius: 10,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            Connecter Google Calendar
          </button>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div
        style={{
          background: T.surface2,
          borderBottom: `1px solid ${T.border}`,
          padding: "10px 16px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setEditingEv(null);
            setDefaultDate(null);
            setDefaultHour(9);
            setShowModal(true);
          }}
          style={{
            ...S.googleBtn,
            background: T.primary,
            color: "#fff",
            border: "none",
            fontWeight: 900,
          }}
        >
          + Nouvel événement
        </button>

        <div
          style={{
            width: 1,
            height: 24,
            background: isDark ? "#1E2A40" : "#D1D5DB",
          }}
        />

        {googleStatus.connected && (
          <button
            onClick={async () => {
              let range;
              if (view === "month") range = monthRange(currentDate);
              else if (view === "week") range = weekRange(weekStart);
              else range = dayRange(dayDate);
              await syncNow(range);
            }}
            style={S.googleBtn}
            disabled={syncing}
          >
            <SyncIcon spinning={syncing} /> Synchroniser
          </button>
        )}

        <button onClick={handleShare} style={S.googleBtn}>
          <ShareIcon /> Partager
        </button>

        <button onClick={handlePrint} style={S.googleBtn}>
          <PrintIcon /> Imprimer
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["day", "week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                ...S.viewBtn,
                borderColor: view === v ? T.primary : T.border,
                background: view === v ? T.primarySoft : "transparent",
                color: view === v ? T.primaryDark : T.text,
                fontWeight: view === v ? 900 : 800,
              }}
            >
              {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={S.errorBanner}>
          ❌ {error}
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: 8,
              color: "inherit",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {!googleStatus.connected && (
        <div style={S.alertBanner}>
          ⚠️ Connectez Google Calendar pour synchroniser vos événements.
          <button
            onClick={connectGoogle}
            style={{
              marginLeft: 12,
              background: T.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            Connecter
          </button>
        </div>
      )}

      {/* ── NAV ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
        }}
      >
        <button onClick={() => navigate(-1)} style={S.navBtn}>
          <ChevLeft />
        </button>
        <button onClick={() => navigate(1)} style={S.navBtn}>
          <ChevRight />
        </button>
        <button
          onClick={goToday}
          style={{
            ...S.googleBtn,
            fontWeight: 900,
            color: T.primaryDark,
            border: `1px solid ${T.primary}`,
          }}
        >
          Aujourd&apos;hui
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T.text }}>
          {getNavLabel()}
        </h2>
        {loading && <span style={{ fontSize: 12, color: T.muted }}>⏳ Chargement…</span>}
      </div>

      {/* ── MAIN ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRight: `1px solid ${T.border}`,
            background: T.surface2,
            overflow: "auto",
          }}
        >
          <MiniMonth
            T={T}
            S={S}
            currentDate={currentDate}
            selectedDate={view === "day" ? dayDate : null}
            onChangeMonth={handleMiniChangeMonth}
            onPickDay={handlePickDay}
          />

          <div style={{ height: 12 }} />

          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              background: T.surface,
              padding: 12,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: T.text,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              Mes calendriers
            </div>

            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: T.primary,
                    display: "inline-block",
                  }}
                />
                Calendrier Optylab
              </span>

              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#4285F4",
                    display: "inline-block",
                  }}
                />
                Google Calendar {googleStatus.connected ? "(connecté)" : "(non connecté)"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ minHeight: 0, overflow: "auto", background: T.surface }}>
          {view === "month" && (
            <MonthView
              T={T}
              isDark={isDark}
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              events={events}
              today={today}
              onDayClick={(day) =>
                openNewEventModal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
              }
              onEventClick={handleEventClick}
            />
          )}

          {view === "week" && (
            <WeekView
              T={T}
              isDark={isDark}
              weekStart={weekStart}
              events={events}
              today={today}
              onSlotClick={(d, h) => openNewEventModal(d, h)}
              onEventClick={handleEventClick}
            />
          )}

          {view === "day" && (
            <DayView
              T={T}
              isDark={isDark}
              date={dayDate}
              events={events}
              onSlotClick={(d, h) => openNewEventModal(d, h)}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {showModal && (
        <EventModal
          T={T}
          S={S}
          event={editingEv}
          defaultDate={defaultDate}
          defaultHour={defaultHour}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingEv(null);
            setDefaultDate(null);
          }}
          onDelete={handleDelete}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 18,
            right: 18,
            background: toast.type === "error" ? "#DC2626" : T.primary,
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 13,
            boxShadow: "0 18px 40px rgba(0,0,0,.18)",
            zIndex: 60,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default GoogleCalendar;