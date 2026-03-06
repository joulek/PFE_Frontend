"use client";

// ✅ Reçoit le token via prop depuis page.jsx (params.rescheduleToken)
// ✅ Fallback: lecture depuis window.location.pathname si prop manquante

import { useEffect, useState } from "react";
import {
  CalendarDays, RefreshCw, Clock3, AlertCircle,
  CheckCircle2, Loader2, MapPin, Briefcase,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const OPTY   = "#4E8F2F";
const OPTY_D = "#3D7524";

function cn(...a) { return a.filter(Boolean).join(" "); }

function getTokenFromUrl() {
  if (typeof window === "undefined") return null;
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
}

function groupSlotsByDay(slots = []) {
  const map = new Map();
  for (const slot of slots) {
    const d = new Date(slot.startISO);
    const dayLabel = d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    }).toUpperCase();
    if (!map.has(dayLabel)) map.set(dayLabel, []);
    map.get(dayLabel).push(slot);
  }
  return Array.from(map.entries()).map(([dayLabel, slots]) => ({ dayLabel, slots }));
}

function formatDateFR(isoOrDate, fallbackTime) {
  if (!isoOrDate) return null;
  try {
    const d = new Date(isoOrDate);
    const dateStr = d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const hasTime = String(isoOrDate).includes("T");
    const timeStr = hasTime
      ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : fallbackTime || null;
    return timeStr ? `${dateStr} à ${timeStr}` : dateStr;
  } catch { return String(isoOrDate); }
}

export default function CandidatRescheduleInterview({ token: tokenProp }) {
  // ✅ token = prop (depuis page.jsx) OU dernière partie de l'URL
  const [token,       setToken]       = useState(tokenProp || null);
  const [interview,   setInterview]   = useState(null);
  const [slotsByDay,  setSlotsByDay]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadError,   setLoadError]   = useState("");
  const [selected,    setSelected]    = useState(null);
  const [reason,      setReason]      = useState("");
  const [sending,     setSending]     = useState(false);
  const [ok,          setOk]          = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Résoudre le token côté client si pas reçu en prop
  useEffect(() => {
    if (!token) {
      const t = getTokenFromUrl();
      if (t) setToken(t);
    }
  }, []);

  // Charger dès que le token est connu
  useEffect(() => {
    if (token) loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInfo() {
    if (!token) { setLoadError("Token introuvable."); return; }
    setLoading(true);
    setLoadError("");
    setOk(false);
    setSelected(null);
    try {
      const res  = await fetch(`${API_BASE}/api/calendar/interview/reschedule-info/${token}`);
      let data   = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || data?.message || `Erreur ${res.status}`);
      setInterview(data.interview || null);
      setSlotsByDay(groupSlotsByDay(data.slots || []));
    } catch (e) {
      setLoadError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  async function submitChoice() {
    if (!selected || !token) return;
    setSending(true);
    setSubmitError("");
    try {
      const res  = await fetch(`${API_BASE}/api/calendar/interview/reschedule/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedStartISO: selected.startISO, reason: reason.trim() }),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || data?.message || `Erreur ${res.status}`);
      setOk(true);
    } catch (e) {
      setSubmitError(e?.message || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">

          {/* HEADER */}
          <div className="rounded-[28px] p-8 shadow-xl"
            style={{ background: "linear-gradient(135deg,#4E8F2F 0%,#5a9e38 50%,#3D7524 100%)" }}>
            <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-[0.18em]">
              Proposer une autre date
            </p>
            {loading && !interview && (
              <div className="mt-3 flex items-center gap-3 text-white/80">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Chargement…</span>
              </div>
            )}
            {interview && (
              <>
                <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  {interview.candidateName}
                </h1>
                <p className="mt-2 text-white/90 font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 shrink-0" />{interview.jobTitle}
                </p>
                {interview.location && (
                  <p className="mt-1 text-white/75 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />{interview.location}
                  </p>
                )}
              </>
            )}
            {!loading && loadError && !interview && (
              <h1 className="mt-2 text-xl font-extrabold text-white/70">Lien invalide ou expiré</h1>
            )}
          </div>

          {/* ERREUR */}
          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40 p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-red-700 dark:text-red-300">Lien invalide ou expiré</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{loadError}</p>
              </div>
            </div>
          )}

          {/* SUCCÈS */}
          {ok && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/40 p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300">Créneau envoyé avec succès ✅</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Le recruteur sera notifié et reviendra vers vous pour confirmer.
                </p>
              </div>
            </div>
          )}

          {/* CONTENU PRINCIPAL */}
          {!loadError && (
            <>
              {interview?.date && (
                <div className="rounded-2xl border p-5 bg-[#FFF7E6] border-amber-200 shadow-sm dark:bg-[#1A1406] dark:border-amber-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Date actuellement proposée
                      </div>
                      <div className="mt-0.5 font-extrabold text-gray-900 dark:text-white">
                        {formatDateFR(interview.date, interview.time)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border shadow-xl overflow-hidden bg-white dark:bg-[#0B1220] border-emerald-100 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 bg-[#F6FFF7] dark:bg-[#08101C] border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: OPTY }} />
                    <p className="font-extrabold text-gray-900 dark:text-white">Choisissez un créneau disponible</p>
                  </div>
                  <button onClick={loadInfo} disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold border text-sm
                               bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200
                               border-gray-200 dark:border-slate-800 hover:bg-gray-50 transition disabled:opacity-50">
                    <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
                    Rafraîchir
                  </button>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: OPTY }} />
                      Chargement des créneaux…
                    </div>
                  ) : slotsByDay.length > 0 ? (
                    <div className="space-y-6">
                      {slotsByDay.map((day) => (
                        <div key={day.dayLabel} className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                          <div className="px-5 py-3 bg-gray-50 dark:bg-[#08101C] border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" style={{ color: OPTY }} />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                              {day.dayLabel}
                            </span>
                          </div>
                          <div className="p-5 flex flex-wrap gap-3">
                            {day.slots.map((slot) => {
                              const isActive = selected?.startISO === slot.startISO;
                              const timeLabel = new Date(slot.startISO).toLocaleTimeString("fr-FR", {
                                hour: "2-digit", minute: "2-digit",
                              });
                              return (
                                <button key={slot.startISO}
                                  onClick={() => { setSelected(slot); setOk(false); setSubmitError(""); }}
                                  className={cn(
                                    "px-4 py-3 rounded-2xl border font-extrabold text-sm transition inline-flex items-center gap-2",
                                    isActive
                                      ? "text-white border-transparent"
                                      : "bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50"
                                  )}
                                  style={isActive ? { background: OPTY } : {}}>
                                  <Clock3 className="w-4 h-4" />
                                  {timeLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-14 text-center text-gray-500 dark:text-slate-300">
                      Aucun créneau disponible pour le moment.
                    </div>
                  )}

                  {!loading && !ok && slotsByDay.length > 0 && (
                    <div className="mt-6">
                      <label className="block text-sm font-extrabold text-gray-700 dark:text-slate-300 mb-2">
                        Raison du report <span className="font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                        placeholder="Ex : déplacement professionnel, rendez-vous médical…"
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700
                                   bg-gray-50 dark:bg-[#08101C] text-gray-900 dark:text-white
                                   placeholder:text-gray-400 px-4 py-3 text-sm font-medium resize-none
                                   focus:outline-none focus:ring-2 focus:ring-[#4E8F2F] focus:border-transparent transition" />
                    </div>
                  )}

                  {submitError && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
                    </div>
                  )}

                  {!ok && (
                    <div className="mt-7 flex items-center justify-end gap-4 flex-wrap">
                      <div className="text-sm font-semibold text-gray-500 dark:text-slate-300">
                        {selected ? (
                          <>Sélection :{" "}
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {new Date(selected.startISO).toLocaleString("fr-FR", {
                                weekday: "long", day: "numeric", month: "long",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </>
                        ) : "Sélectionnez un créneau"}
                      </div>
                      <button onClick={submitChoice} disabled={!selected || sending}
                        className={cn(
                          "h-12 px-7 rounded-2xl font-extrabold text-white transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "inline-flex items-center justify-center gap-2"
                        )}
                        style={{ background: OPTY, boxShadow: "0 12px 30px rgba(78,143,47,0.22)" }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = OPTY_D; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = OPTY; }}>
                        {sending && <Loader2 className="w-5 h-5 animate-spin" />}
                        {sending ? "Envoi…" : "Envoyer le créneau"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}