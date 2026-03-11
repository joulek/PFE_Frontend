"use client";
// components/RhNordReviewReschedule.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Page RH Nord — valider ou refuser la demande de report du candidat
//
// URL : /Responsable_RH_Nord/interview/review/[token]?action=accept|refuse
//
// Endpoints :
//   GET  /api/interviewNord/review-info/:token   → infos demande
//   POST /api/interviewNord/review/:token        → { action: "accept"|"refuse" }
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  User,
  Briefcase,
  MessageSquare,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const OPTY   = "#4E8F2F";
const OPTY_D = "#3D7524";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function RhNordReviewReschedule({ token }) {
  const searchParams = useSearchParams();
  const actionParam  = searchParams.get("action"); // "accept" | "refuse" | null

  const [info,      setInfo]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result,    setResult]    = useState(null); // "accepted" | "refused"
  const [submitErr, setSubmitErr] = useState("");

  // ── Charger les infos de la demande ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${API_BASE}/api/interviewNord/review-info/${token}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Lien invalide ou expiré.");
        setInfo(data);
      } catch (e) {
        setError(e?.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Auto-submit si action dans l'URL ─────────────────────────────────────
  useEffect(() => {
    if (!info || result || submitting) return;
    if (actionParam === "accept" || actionParam === "refuse") {
      handleAction(actionParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, actionParam]);

  // ── Action accepter / refuser ─────────────────────────────────────────────
  async function handleAction(action) {
    if (submitting || result) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const res  = await fetch(`${API_BASE}/api/interviewNord/review/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erreur lors de l'action.");
      setResult(action === "accept" ? "accepted" : "refused");
    } catch (e) {
      setSubmitErr(e?.message || "Erreur lors de l'action.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Format date ───────────────────────────────────────────────────────────
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
        year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* ── Header Optylab ── */}
        <div
          className="rounded-[24px] p-7 shadow-xl mb-6"
          style={{ background: "linear-gradient(135deg, #4E8F2F 0%, #5a9e38 60%, #3D7524 100%)" }}
        >
          <p className="text-white/70 text-[11px] font-extrabold uppercase tracking-[0.2em]">
            Optylab — Responsable RH Nord
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            Demande de report d&apos;entretien
          </h1>
          {info && (
            <p className="mt-1 text-white/80 text-sm font-medium">
              {info.candidateName} · {info.jobTitle}
            </p>
          )}
        </div>

        {/* ── Chargement ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow p-10 flex items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: OPTY }} />
            Chargement de la demande…
          </div>
        )}

        {/* ── Erreur lien ── */}
        {!loading && error && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow p-8 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-red-700 dark:text-red-400">Lien invalide</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ── Résultat après action ── */}
        {result && (
          <div className={`rounded-3xl shadow p-8 flex items-start gap-4 ${
            result === "accepted"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40"
              : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40"
          }`}>
            {result === "accepted"
              ? <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
              : <XCircle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-extrabold text-lg ${
                result === "accepted" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
              }`}>
                {result === "accepted"
                  ? "✅ Demande acceptée !"
                  : "❌ Demande refusée"
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {result === "accepted"
                  ? `Le candidat ${info?.candidateName} sera notifié par email. L'entretien est reprogrammé au créneau proposé.`
                  : `Le candidat ${info?.candidateName} sera notifié par email. L'entretien reste à la date initiale.`
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Carte infos + boutons ── */}
        {!loading && !error && info && !result && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">

            {/* Infos candidat */}
            <div className="p-6 space-y-4 border-b border-gray-100 dark:border-gray-800">

              <InfoRow icon={<User className="w-4 h-4" />}
                label="Candidat" value={info.candidateName} />

              <InfoRow icon={<Briefcase className="w-4 h-4" />}
                label="Poste" value={info.jobTitle} />

              <InfoRow icon={<CalendarDays className="w-4 h-4" />}
                label="Date actuelle" value={fmtDate(info.currentDate)} amber />

              <InfoRow icon={<Clock className="w-4 h-4" />}
                label="Nouveau créneau demandé" value={fmtDate(info.proposedSlot)} green />

              {info.reason && (
                <InfoRow icon={<MessageSquare className="w-4 h-4" />}
                  label="Raison du report" value={info.reason} />
              )}
            </div>

            {/* Erreur action */}
            {submitErr && (
              <div className="mx-6 mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitErr}
              </div>
            )}

            {/* Boutons */}
            <div className="p-6 flex gap-3">

              {/* Accepter */}
              <button
                onClick={() => handleAction("accept")}
                disabled={submitting}
                className="flex-1 h-12 rounded-2xl font-extrabold text-white text-sm
                           flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: OPTY, boxShadow: "0 8px 24px rgba(78,143,47,0.25)" }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = OPTY_D; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = OPTY; }}
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />
                }
                Accepter
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Refuser */}
              <button
                onClick={() => handleAction("refuse")}
                disabled={submitting}
                className="flex-1 h-12 rounded-2xl font-extrabold text-sm
                           flex items-center justify-center gap-2 border-2 border-red-400
                           text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                Refuser
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, green, amber }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 ${
        green ? "text-emerald-600" : amber ? "text-amber-500" : "text-gray-400"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className={`text-sm font-bold mt-0.5 ${
          green  ? "text-emerald-700 dark:text-emerald-400" :
          amber  ? "text-amber-700 dark:text-amber-400" :
                   "text-gray-900 dark:text-white"
        }`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}