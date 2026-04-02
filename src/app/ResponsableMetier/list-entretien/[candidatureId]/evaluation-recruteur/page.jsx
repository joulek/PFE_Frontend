"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../services/api";
import {
  ArrowLeft, Loader2, Star, User, MessageSquare,
  FileText, AlertTriangle, CheckCircle2, XCircle, TrendingUp,
  Award, BarChart3, ChevronRight,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Retourne true si le critère a une note numérique (type SCORE ou valeur numérique).
 * BOOLEAN et CHOICE ont une valeur textuelle → pas de barre ni de note /5.
 */
function isNumericRating(r) {
  return r.value !== null && r.value !== undefined && !isNaN(Number(r.value));
}

function numericValue(r) {
  return Number(r.value);
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-all ${
            i < value
              ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]"
              : "text-gray-200 dark:text-gray-700"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200">
        {value}
        <span className="font-normal text-gray-400 dark:text-gray-500">/5</span>
      </span>
    </div>
  );
}

// ─── Gauge bar ────────────────────────────────────────────────────────────────
function GaugeBar({ value, max = 5 }) {
  const pct = Math.min(100, Math.max(0, (Number(value) / max) * 100));
  const color =
    pct >= 80 ? "from-[#4E8F2F] to-[#69B332]"
    : pct >= 60 ? "from-[#69B332] to-[#8BC34A]"
    : pct >= 40 ? "from-amber-400 to-amber-500"
    : "from-red-400 to-red-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Badge for non-numeric answer (BOOLEAN / CHOICE) ─────────────────────────
function AnswerBadge({ value }) {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value);
  // Oui / Yes → vert ; Non / No → rouge ; autre → gris
  const isYes = /^(oui|yes|true|1)$/i.test(str);
  const isNo  = /^(non|no|false|0)$/i.test(str);
  const style = isYes
    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
    : isNo
    ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-bold ${style}`}>
      {str}
    </span>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ value, max = 5 }) {
  const pct = Math.round((Number(value) / max) * 100);
  const color =
    pct >= 80 ? "#4E8F2F"
    : pct >= 60 ? "#69B332"
    : pct >= 40 ? "#D97706"
    : "#DC2626";
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  const label =
    pct >= 80 ? "Excellent"
    : pct >= 60 ? "Bien"
    : pct >= 40 ? "Moyen"
    : "Insuffisant";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20"
          style={{ background: color }}
        />
        <svg className="w-full h-full -rotate-90 relative">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor"
            className="text-gray-100 dark:text-slate-700" strokeWidth="10" />
          <circle cx="64" cy="64" r={radius} fill="none" stroke={color}
            strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums leading-none" style={{ color }}>{value}</span>
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">/5</span>
        </div>
      </div>
      <span
        className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
        style={{ background: `${color}18`, color }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700/60">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EvaluationRecruteurPage() {
  const router = useRouter();
  const { candidatureId } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!candidatureId) return;
    setLoading(true);
    setError(null);
    api.get(`/api/interviews/${candidatureId}/evaluation?viewer=responsable`)
      .then((res) => setEvaluation(res?.data ?? res ?? null))
      .catch((err) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.error || err?.response?.data?.message;
        if (status === 404) setError("Aucune évaluation recruteur n'a encore été soumise pour cet entretien.");
        else if (status === 403) setError("Vous n'avez pas les droits pour consulter cette évaluation.");
        else setError(msg || "Erreur lors du chargement de l'évaluation.");
      })
      .finally(() => setLoading(false));
  }, [candidatureId]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-[#0c1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#4E8F2F]" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Chargement de l'évaluation…</p>
        </div>
      </div>
    );
  }

  // ── Calcul de la moyenne UNIQUEMENT sur les critères numériques ──
  const numericRatings = evaluation?.ratings?.filter(isNumericRating) ?? [];
  const avg = numericRatings.length
    ? (numericRatings.reduce((a, r) => a + numericValue(r), 0) / numericRatings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#f5faf3] dark:bg-[#0c1117] pb-16 transition-colors duration-300">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Breadcrumb / Retour ── */}
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4E8F2F] dark:text-green-400 hover:text-[#3d7025] dark:hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4E8F2F] to-[#2d5a1a] dark:from-[#1e3d10] dark:to-[#0e2008] p-6 sm:p-8 shadow-xl shadow-green-900/20">
          <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-green-200/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Fiche d'évaluation — Lecture seule
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Évaluation du Recruteur
              </h1>
              <p className="text-green-200/60 text-sm mt-1">Synthèse RH & Technique de l'entretien</p>
            </div>

            {!error && evaluation && (
              <div className="sm:ml-auto shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-200" />
                <span className="text-xs font-bold text-green-100">Évaluation complétée</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-4 rounded-2xl border border-orange-200/60 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-950/20 px-6 py-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-0.5">Évaluation indisponible</p>
              <p className="text-sm text-orange-600/80 dark:text-orange-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        {!error && evaluation && (
          <div className="space-y-5">

            {/* ── Score + Évaluateur card ── */}
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">

              {/* Score card */}
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6 flex flex-col items-center justify-center gap-1 min-w-[180px]">
                <ScoreRing value={evaluation.overallRating ?? 0} max={5} />
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                  Note globale
                </p>
              </div>

              {/* Évaluateur card */}
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6 flex flex-col justify-between gap-5">

                {evaluation.evaluatedByName && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E9F5E3] to-[#d4edca] dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center shrink-0 border border-[#c8e6ba] dark:border-green-800/30">
                      <User className="w-5 h-5 text-[#4E8F2F] dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-base leading-tight">
                        {evaluation.evaluatedByName}
                      </p>
                      {evaluation.evaluatedByEmail && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{evaluation.evaluatedByEmail}</p>
                      )}
                      {evaluation.evaluatedByRole && (
                        <span className="inline-flex mt-2 items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#E9F5E3] dark:bg-green-900/30 text-[#4E8F2F] dark:text-green-300 border border-[#c8e6ba] dark:border-green-800/30">
                          <Award className="w-3 h-3" />
                          {evaluation.evaluatedByRole}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick stats — uniquement si des critères numériques existent */}
                {avg && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatPill icon={BarChart3} label="Moyenne critères" value={`${avg}/5`} accent="#4E8F2F" />
                    <StatPill
                      icon={TrendingUp}
                      label="Critères excellents"
                      value={`${numericRatings.filter(r => numericValue(r) >= 4).length} / ${numericRatings.length}`}
                      accent="#69B332"
                    />
                    {evaluation.updatedAt && (
                      <StatPill icon={CheckCircle2} label="Soumis le" value={formatDate(evaluation.updatedAt)} accent="#6B7280" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Note générale ── */}
            {evaluation.notes && (
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-widest">
                    Note générale
                  </h2>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-[#4E8F2F] to-[#69B332]" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {evaluation.notes}
                  </p>
                </div>
              </div>
            )}

            {/* ── Critères ── */}
            {Array.isArray(evaluation.ratings) && evaluation.ratings.length > 0 && (
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                      Critères évalués
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                    {evaluation.ratings.length}
                  </span>
                </div>

                {/* Liste */}
                <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {evaluation.ratings.map((r, i) => {
                    const numeric = isNumericRating(r);
                    const val = numeric ? numericValue(r) : null;
                    const pct = numeric ? Math.round((val / 5) * 100) : null;

                    return (
                      <div
                        key={i}
                        className="group px-6 py-5 hover:bg-[#fafff8] dark:hover:bg-slate-900/40 transition-colors duration-150"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                          {/* Index + Label */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 group-hover:bg-[#E9F5E3] group-hover:text-[#4E8F2F] dark:group-hover:bg-green-900/30 dark:group-hover:text-green-400 transition-colors">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-snug">
                                  {r.label || `Critère ${i + 1}`}
                                </p>
                                {r.type && (
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                    {r.type}
                                  </span>
                                )}
                              </div>

                              {/* Barre de progression UNIQUEMENT si valeur numérique */}
                              {numeric ? (
                                <GaugeBar value={val} />
                              ) : (
                                /* Pour BOOLEAN / CHOICE : afficher la réponse en badge */
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Réponse :</span>
                                  <AnswerBadge value={r.value} />
                                </div>
                              )}

                              {/* Comment */}
                              {r.comment && (
                                <div className="mt-3 flex items-start gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-gray-300 dark:text-gray-600 shrink-0" />
                                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {r.comment}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Côté droit : étoiles si numérique, badge réponse si non numérique */}
                          <div className="shrink-0 sm:pt-0.5 ml-10 sm:ml-0">
                            {numeric ? (
                              <>
                                <StarRating value={val} max={5} />
                                <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right mt-1 tabular-nums">
                                  {pct}%
                                </p>
                              </>
                            ) : (
                              /* Pas d'étoiles pour les critères non numériques */
                              <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium uppercase tracking-wide">
                                {r.type === "BOOLEAN" ? "Oui / Non" : "Choix"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Synthèse footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/60 bg-gradient-to-r from-[#f4faf0] to-[#edf7e8] dark:from-slate-900/60 dark:to-slate-900/30">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {avg ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Moyenne</span>
                          <span className="font-black text-[#4E8F2F] dark:text-green-400 text-base tabular-nums">
                            {avg}
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">/5</span>
                          </span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 hidden sm:block" />
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#4E8F2F]" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-gray-700 dark:text-gray-200">
                              {numericRatings.filter(r => numericValue(r) >= 4).length}
                            </span> excellents
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-gray-700 dark:text-gray-200">
                              {numericRatings.filter(r => numericValue(r) <= 2).length}
                            </span> insuffisants
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Aucun critère noté — moyenne non disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Aucun critère ── */}
            {(!Array.isArray(evaluation.ratings) || evaluation.ratings.length === 0) && (
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aucun critère enregistré dans cette évaluation.</p>
                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Les critères apparaîtront ici une fois l'évaluation complétée.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}