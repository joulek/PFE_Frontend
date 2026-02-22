"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Briefcase,
  Send,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getInterviewById,
  getRecruiterFreeSlots,
  recruiterProposeNewSlot,
} from "../../../../services/calendar.api.js"; // ✅ ton calendar.api.js

function formatDateFR(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeFR(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function RecruiterReschedulePage() {
  const { interviewId } = useParams();

  const [loading, setLoading] = useState(true);
  const [iv, setIv] = useState(null);

  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selectedStartISO, setSelectedStartISO] = useState("");

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getInterviewById(interviewId);
        if (!mounted) return;
        setIv(res?.data?.interview || res?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Impossible de charger l’entretien.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [interviewId]);

  useEffect(() => {
    if (!interviewId) return;
    let mounted = true;

    (async () => {
      try {
        setSlotsLoading(true);
        setError("");

        const res = await getRecruiterFreeSlots(interviewId);
        if (!mounted) return;

        const s = res?.data?.slots || [];
        setSlots(s);
        setSelectedStartISO(s?.[0]?.startISO || "");
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Impossible de charger les créneaux.");
      } finally {
        if (mounted) setSlotsLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [interviewId]);

  const canSend = useMemo(() => !!selectedStartISO && slots.length > 0, [selectedStartISO, slots]);

  async function handleSend() {
    try {
      setSending(true);
      setError("");

      await recruiterProposeNewSlot(interviewId, selectedStartISO);
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Envoi impossible. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F8] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-[#2F7D32] px-8 py-8">
          <div className="text-white text-3xl font-extrabold tracking-tight">Optylab</div>
          <div className="text-white/90 mt-1">Gestion — Report d’entretien</div>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-extrabold text-[#2F7D32] dark:text-emerald-400">
            Choisir un nouveau créneau
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Le candidat a demandé un report. Sélectionnez un créneau libre depuis votre calendrier, puis envoyez
            une proposition au candidat (il pourra seulement <b>confirmer</b>).
          </p>

          {(loading || slotsLoading) && (
            <div className="mt-6 text-gray-600 dark:text-gray-300">Chargement...</div>
          )}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {!loading && iv && (
            <div className="mt-6 rounded-2xl bg-[#E9F4EA] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-6 space-y-4">
              <InfoRow icon={<Briefcase className="w-5 h-5" />} label="Poste" value={iv?.jobTitle || "Poste à définir"} />
              <InfoRow icon={<CalendarDays className="w-5 h-5" />} label="Ancienne date" value={formatDateFR(iv?.proposedDate || iv?.date)} />
              <InfoRow icon={<Clock className="w-5 h-5" />} label="Ancienne heure" value={iv?.proposedDate ? formatTimeFR(iv.proposedDate) : (iv?.proposedTime || "—")} />
              <InfoRow icon={<MapPin className="w-5 h-5" />} label="Lieu" value={iv?.location || "Optylab / Teams"} />

              {iv?.candidateRescheduleReason && (
                <div className="pt-2 text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Raison candidat:</span> {iv.candidateRescheduleReason}
                </div>
              )}
            </div>
          )}

          {/* Slots */}
          {!slotsLoading && !error && (
            <div className="mt-7">
              <div className="font-bold text-gray-900 dark:text-gray-100">Créneaux libres (durée 1h)</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Fenêtre: 10h–12h (10→11 et 11→12), week-ends exclus.
              </div>

              {slots.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 mt-0.5" />
                    <div>
                      <div className="font-semibold">Aucun créneau libre</div>
                      <div className="text-sm mt-1">Élargissez la plage ou vérifiez le calendrier Outlook.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {slots.map((s, idx) => {
                    const selected = selectedStartISO === s.startISO;
                    const start = new Date(s.startISO);
                    const end = new Date(s.endISO);

                    const startTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    const endTime = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedStartISO(s.startISO)}
                        className={`text-left rounded-2xl border px-5 py-4 transition
                          ${
                            selected
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                              : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatDateFR(s.date)}
                            </div>
                            <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-bold">{startTime}</span>{" "}
                              <span className="text-gray-400">→</span>{" "}
                              <span className="font-bold">{endTime}</span>
                              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                1h
                              </span>
                            </div>
                          </div>

                          {selected && (
                            <div className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Send */}
          {!error && (
            <button
              onClick={handleSend}
              disabled={!canSend || sending || done}
              className="mt-7 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold
                         bg-[#2F7D32] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {sending ? "Envoi..." : done ? "Proposition envoyée" : "Envoyer la proposition au candidat"}
            </button>
          )}

          {done && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Proposition envoyée ✅</div>
                  <div className="text-sm mt-1">
                    Le candidat reçoit un email avec un bouton <b>Confirmer</b>.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#2F7D32] dark:text-emerald-400">{icon}</div>
      <div className="min-w-28 text-gray-600 dark:text-gray-300">{label}</div>
      <div className="font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}