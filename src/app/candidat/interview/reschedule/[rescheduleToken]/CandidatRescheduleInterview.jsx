"use client";

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
  User,
} from "lucide-react";

const OPTY = "#4E8F2F";
const OPTY_D = "#3D7524";

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

// Group flat slots array into days for display
function groupSlotsByDay(slots = []) {
  const map = new Map();
  for (const slot of slots) {
    const dateObj = new Date(slot.startISO);
    const dayLabel = dateObj
      .toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      .toUpperCase();
    if (!map.has(dayLabel)) map.set(dayLabel, []);
    map.get(dayLabel).push(slot);
  }
  return Array.from(map.entries()).map(([dayLabel, slots]) => ({
    dayLabel,
    slots,
  }));
}

export default function CandidatRescheduleInterview({ token }) {
  const [interview, setInterview] = useState(null);
  const [slotsByDay, setSlotsByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null); // slot object with startISO
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function loadInfo() {
    setLoading(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch(
        `/api/calendar/interview/reschedule-info/${token}`
      );
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

  async function submitChoice() {
    if (!selected) return;
    setSending(true);
    setSubmitError("");
    setOk(false);
    try {
      const res = await fetch(`/api/calendar/interview/reschedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedStartISO: selected.startISO,
          reason: reason.trim(),
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

  // ── Format current proposed date nicely ──
  const currentDateLabel = useMemo(() => {
    if (!interview?.date) return null;
    try {
      const d = new Date(interview.date);
      const dateStr = d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = interview.time ||
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      return `${dateStr} à ${timeStr}`;
    } catch {
      return interview.date;
    }
  }, [interview]);

  // ────────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-6xl">

          {/* ── Header ── */}
          <div
            className="rounded-[28px] p-8 shadow-xl"
            style={{
              background: "linear-gradient(135deg, #4E8F2F 0%, #5a9e38 50%, #3D7524 100%)",
            }}
          >
            <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-[0.18em]">
              Proposer une autre date
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
              <h1 className="mt-2 text-3xl font-extrabold text-white">
                Chargement…
              </h1>
            )}
          </div>

          {/* ── Error banner (invalid/expired link) ── */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/40 p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* ── Success banner ── */}
          {ok && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/40 p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300">
                  Créneau envoyé avec succès ✅
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Le recruteur sera notifié et reviendra vers vous pour confirmer.
                </p>
              </div>
            </div>
          )}

          {/* Only show main content if no fatal error */}
          {!error && (
            <>
              {/* ── Current proposed date block ── */}
              {currentDateLabel && (
                <div className="mt-7 rounded-2xl border p-5 bg-[#FFF7E6] border-amber-200 shadow-sm dark:bg-[#1A1406] dark:border-amber-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[12px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Date actuellement proposée
                      </div>
                      <div className="mt-0.5 font-extrabold text-gray-900 dark:text-white">
                        {currentDateLabel}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Slots container ── */}
              <div className="mt-6 rounded-3xl border shadow-xl overflow-hidden bg-white dark:bg-[#0B1220] border-emerald-100 dark:border-slate-800">
                {/* Header row */}
                <div className="px-6 py-4 bg-[#F6FFF7] dark:bg-[#08101C] border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: OPTY }}
                    />
                    <p className="font-extrabold text-gray-900 dark:text-white">
                      Choisissez un créneau disponible
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

                {/* Body */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-slate-300">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: OPTY }} />
                      Chargement des créneaux…
                    </div>
                  ) : slotsByDay.length ? (
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
                              const isActive = selected?.startISO === slot.startISO;
                              const timeLabel = new Date(slot.startISO).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
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
                                    "px-4 py-3 rounded-2xl border font-extrabold text-sm transition",
                                    "inline-flex items-center gap-2",
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
                    <div className="py-14 text-center text-gray-500 dark:text-slate-300">
                      Aucun créneau disponible pour le moment.
                    </div>
                  )}

                  {/* Reason textarea */}
                  {!ok && slotsByDay.length > 0 && (
                    <div className="mt-6">
                      <label className="block text-sm font-extrabold text-gray-700 dark:text-slate-300 mb-2">
                        Raison du report <span className="font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Ex: Déplacement professionnel, rendez-vous médical…"
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#08101C]
                                   text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500
                                   px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
                        style={{ "--tw-ring-color": OPTY }}
                      />
                    </div>
                  )}

                  {/* Submit error */}
                  {submitError && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  {/* CTA */}
                  {!ok && (
                    <div className="mt-7 flex items-center justify-end gap-3 flex-wrap">
                      <div className="text-sm font-semibold text-gray-500 dark:text-slate-300">
                        {selected ? (
                          <>
                            Sélection :{" "}
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {new Date(selected.startISO).toLocaleString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        ) : (
                          "Sélectionnez un créneau"
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
                        style={{
                          background: OPTY,
                          boxShadow: "0 12px 30px rgba(78,143,47,0.22)",
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled)
                            e.currentTarget.style.background = OPTY_D;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = OPTY;
                        }}
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
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
