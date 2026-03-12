"use client";
// components/CandidatRescheduleRhTechInterview.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Page publique — candidat propose une autre date pour son entretien RH Nord
//
// Règles métier :
//   • Créneaux disponibles = Google Calendar du RESPONSABLE_RH_NORD
//   • Fenêtre autorisée    = proposedDate + 3 jours (inclus)
//   • Après soumission → RH Nord reçoit un email pour valider/refuser
//
// Endpoints appelés (publics — pas de token auth) :
//   GET  /api/interviewNord/reschedule-info/:rescheduleToken
//   POST /api/interviewNord/reschedule/:rescheduleToken
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Briefcase,
  CalendarClock,
  Send,
} from "lucide-react";

const OPTY   = "#F4F8F1";
const OPTY_D = "#F4F8F1";

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function groupSlotsByDay(slots = []) {
  const map = new Map();
  for (const slot of slots) {
    const d        = new Date(slot.startISO);
    const dayLabel = d
      .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      .toUpperCase();
    if (!map.has(dayLabel)) map.set(dayLabel, []);
    map.get(dayLabel).push(slot);
  }
  return Array.from(map.entries()).map(([dayLabel, slots]) => ({ dayLabel, slots }));
}

export default function CandidatRescheduleRhTechInterview({ token }) {
  const [interview,   setInterview]   = useState(null);
  const [slotsByDay,  setSlotsByDay]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [selected,    setSelected]    = useState(null);
  const [reason,      setReason]      = useState("");
  const [sending,     setSending]     = useState(false);
  const [ok,          setOk]          = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Charger infos entretien + créneaux dispo du RH Nord ──────────────────
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  async function loadInfo() {
    setLoading(true);
    setError("");
    setOk(false);
    setSelected(null);
    try {
      const res = await fetch(`${API_BASE}/api/interviewNord/reschedule-info/${token}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || data?.message || "Lien invalide ou expiré.");
      }
      const data = await res.json();
      setInterview(data.interview || null);
      setSlotsByDay(groupSlotsByDay(data.slots || []));
    } catch (e) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Soumettre le créneau sélectionné ─────────────────────────────────────
  async function submitChoice() {
    if (!selected) return;
    setSending(true);
    setSubmitError("");
    setOk(false);
    try {
      const res = await fetch(`${API_BASE}/api/interviewNord/reschedule/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedStartISO: selected.startISO,
          reason:           reason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || data?.message || "Erreur lors de l'envoi.");
      }
      setOk(true);
    } catch (e) {
      setSubmitError(e?.message || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  // ── Date actuelle proposée formatée ──────────────────────────────────────
  const currentDateLabel = useMemo(() => {
    if (!interview?.proposedDate) return null;
    try {
      const d       = new Date(interview.proposedDate);
      const dateStr = d.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const timeStr = interview.proposedTime ||
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} à ${timeStr}`;
    } catch { return null; }
  }, [interview]);

  // ── Fenêtre de 3 jours ────────────────────────────────────────────────────
  const windowLabel = useMemo(() => {
    if (!interview?.proposedDate) return null;
    try {
      const start = new Date(interview.proposedDate);
      const end   = new Date(start);
      end.setDate(end.getDate() + 3);
      const fmt = (d) => d.toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      return `${fmt(start)} → ${fmt(end)}`;
    } catch { return null; }
  }, [interview]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-5xl">

          {/* ── Header ── */}
          <div
            className="rounded-[28px] p-8 shadow-xl"
            style={{ background: "linear-gradient(135deg, #4E8F2F 0%, #5a9e38 50%, #3D7524 100%)" }}
          >
            <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-[0.18em]">
              Proposer une autre date — Entretien RH Nord
            </p>
            {interview ? (
              <>
                <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  {interview.candidateName}
                </h1>
                <p className="mt-2 text-white/90 font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {interview.jobTitle}
                </p>
                {interview.location && (
                  <p className="mt-1 text-white/75 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {interview.location}
                  </p>
                )}
              </>
            ) : (
              <h1 className="mt-2 text-3xl font-extrabold text-white">Chargement…</h1>
            )}
          </div>

          {/* ── Erreur lien invalide ── */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40 p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* ── Succès ── */}
          {ok && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/40 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-lg">
                  Demande envoyée avec succès ✅
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 leading-relaxed">
                  Le responsable RH Nord va examiner votre demande et vous confirmera
                  la nouvelle date par email dans les plus brefs délais.
                </p>
                {selected && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Créneau proposé :{" "}
                    {new Date(selected.startISO).toLocaleString("fr-FR", {
                      weekday: "long", day: "numeric", month: "long",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Contenu principal ── */}
          {!error && interview && (
            <>
              {/* Cards date actuelle + fenêtre */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-5 bg-[#FFF7E6] border-amber-200 shadow-sm dark:bg-[#1A1406] dark:border-amber-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Date actuellement proposée
                      </div>
                      <div className="mt-0.5 font-extrabold text-gray-900 dark:text-white text-sm">
                        {currentDateLabel || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-5 bg-[#EEF6FF] border-blue-200 shadow-sm dark:bg-[#06101A] dark:border-blue-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Fenêtre de report autorisée (3 jours)
                      </div>
                      <div className="mt-0.5 font-extrabold text-gray-900 dark:text-white text-sm">
                        {windowLabel || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Container créneaux ── */}
              <div className="mt-6 rounded-3xl border shadow-xl overflow-hidden bg-white dark:bg-[#0B1220] border-emerald-100 dark:border-slate-800">

                {/* Header créneaux */}
                <div className="px-6 py-4 bg-[#F6FFF7] dark:bg-[#08101C] border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: OPTY }} />
                    <p className="font-extrabold text-gray-900 dark:text-white">
                      Créneaux disponibles du responsable RH Nord
                    </p>
                  </div>
                  <button
                    onClick={loadInfo}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold border text-sm
                               bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200
                               border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
                    Rafraîchir
                  </button>
                </div>

                {/* Body créneaux */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-slate-300">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: OPTY }} />
                      Chargement des créneaux…
                    </div>
                  ) : slotsByDay.length > 0 ? (
                    <div className="space-y-6">
                      {slotsByDay.map((day) => (
                        <div
                          key={day.dayLabel}
                          className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                        >
                          <div className="px-5 py-4 bg-gray-50 dark:bg-[#08101C] border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" style={{ color: OPTY }} />
                            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                              {day.dayLabel}
                            </div>
                          </div>
                          <div className="p-5 flex flex-wrap gap-3">
                            {day.slots.map((slot) => {
                              const isActive  = selected?.startISO === slot.startISO;
                              const timeLabel = new Date(slot.startISO).toLocaleTimeString("fr-FR", {
                                hour: "2-digit", minute: "2-digit",
                              });
                              return (
                                <button
                                  key={slot.startISO}
                                  onClick={() => {
                                    setSelected(slot);
                                    setOk(false);
                                    setSubmitError("");
                                  }}
                                  className={cn(
                                    "px-4 py-3 rounded-2xl border font-extrabold text-sm transition inline-flex items-center gap-2",
                                    isActive
                                      ? "text-white border-transparent"
                                      : "bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900"
                                  )}
                                  style={isActive ? { background: OPTY } : {}}
                                >
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
                    /* Aucun créneau */
                    <div className="py-14 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
                        <CalendarDays className="w-7 h-7 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="font-extrabold text-gray-700 dark:text-slate-300">
                        Aucun créneau disponible
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Le responsable RH Nord n&apos;a pas de créneaux libres dans la fenêtre de 3 jours.
                        <br />Veuillez le contacter directement ou rafraîchir plus tard.
                      </p>
                    </div>
                  )}

                  {/* Raison du report */}
                  {!ok && slotsByDay.length > 0 && (
                    <div className="mt-6">
                      <label className="block text-sm font-extrabold text-gray-700 dark:text-slate-300 mb-2">
                        Raison du report{" "}
                        <span className="font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Ex : Déplacement professionnel, rendez-vous médical…"
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#08101C]
                                   text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500
                                   px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
                      />
                    </div>
                  )}

                  {/* Erreur soumission */}
                  {submitError && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  {/* CTA */}
                  {!ok && slotsByDay.length > 0 && (
                    <div className="mt-7 flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-sm font-semibold text-gray-500 dark:text-slate-300">
                        {selected ? (
                          <>
                            Sélection :{" "}
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {new Date(selected.startISO).toLocaleString("fr-FR", {
                                weekday: "long", day: "numeric", month: "long",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">
                            Sélectionnez un créneau ci-dessus
                          </span>
                        )}
                      </div>

                      <button
                        onClick={submitChoice}
                        disabled={!selected || sending}
                        className={cn(
                          "h-12 px-6 rounded-2xl font-extrabold text-white transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "inline-flex items-center justify-center gap-2"
                        )}
                        style={{ background: OPTY, boxShadow: "0 12px 30px rgba(78,143,47,0.22)" }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = OPTY_D; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = OPTY; }}
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? "Envoi en cours…" : "Envoyer ma demande"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Note bas de page */}
              <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">
                ⚠️ Le responsable RH Nord doit valider votre demande avant que le changement soit effectif.
                Vous recevrez un email de confirmation une fois validé.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}