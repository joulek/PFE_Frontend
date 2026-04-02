"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star, ArrowLeft, FileText, CheckCircle2, XCircle,
  AlertCircle, User, MessageSquare, BarChart3, TrendingUp,
  Award, Loader2, AlertTriangle,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function resolveInterviewTypeLabel(type) {
  if (!type) return null;
  const t = String(type).toLowerCase().trim();
  if ((t.includes("rh") && t.includes("tech")) || (t.includes("rh") && t.includes("technique")))
    return { label: "RH + Tech", cls: "bg-violet-100/60 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700" };
  if (t.includes("technique") || t === "technique")
    return { label: "Technique", cls: "bg-pink-100/60 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-700" };
  if (t.includes("dga"))
    return { label: "DGA", cls: "bg-rose-100/60 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-700" };
  if (t.includes("tel") || t.includes("phon"))
    return { label: "Téléphonique", cls: "bg-sky-100/60 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-700" };
  return { label: "Entretien RH", cls: "bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700" };
}

function getInitials(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "R")[0].toUpperCase();
}

function isNumericRating(r) {
  return r.value !== null && r.value !== undefined && !isNaN(Number(r.value)) && typeof r.value === "number";
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

// ─── GaugeBar ────────────────────────────────────────────────────────────────
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

// ─── ScoreRing ────────────────────────────────────────────────────────────────
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
        <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ background: color }} />
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

// ─── StatPill ─────────────────────────────────────────────────────────────────
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

// ─── AnswerBadge ──────────────────────────────────────────────────────────────
function AnswerBadge({ value }) {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value);
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

// ─── ChoiceList ───────────────────────────────────────────────────────────────
function ChoiceList({ choices, selected }) {
  return (
    <div className="space-y-2 mt-2">
      {choices.map((choice, i) => {
        const active = choice === selected;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors
              ${active
                ? "border-[#6CB33F] bg-[#F1FAF4] dark:bg-emerald-950/20 dark:border-emerald-700"
                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
              ${active ? "bg-[#6CB33F] border-[#6CB33F]" : "border-gray-300 dark:border-gray-600"}`}
            />
            <p className="text-sm text-gray-700 dark:text-gray-300">{choice}</p>
            {active && <CheckCircle2 className="w-4 h-4 text-[#6CB33F] ml-auto flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EvaluationResponsePage() {
  const { id } = useParams();
  const router = useRouter();

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token =
      (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
      "";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${id}/evaluation?viewer=recruteur`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        setEvaluation(data?.evaluation || data || null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-[#0c1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#4E8F2F]" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Chargement de l&apos;évaluation…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-[#0c1117] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-10 shadow-sm text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Évaluation introuvable</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Le responsable métier n&apos;a pas encore soumis son évaluation pour cet entretien.
          </p>
          <button
            onClick={() => router.push("/recruiter/list_interview/")}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4E8F2F] dark:text-green-400 hover:text-[#3d7025] dark:hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste des entretiens
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const evaluatorName  = evaluation?.evaluatedByName  || evaluation?.responsableName  || evaluation?.assignedUserName  || "Responsable métier";
  const evaluatorEmail = evaluation?.evaluatedByEmail || evaluation?.responsableEmail || evaluation?.assignedUserEmail || null;
  const evaluatorRole  = evaluation?.evaluatedByRole  || null;
  const interviewType  = evaluation?.interviewType    || evaluation?.type             || null;
  const typeConfig     = resolveInterviewTypeLabel(interviewType);
  const ratings        = evaluation?.ratings          || evaluation?.criteria         || [];
  const overallRating  = evaluation?.overallRating    ?? evaluation?.evaluationGlobale ?? null;
  const notes          = evaluation?.notes            || evaluation?.commentaire       || "";
  const decision       = evaluation?.decision         || null;

  const numericRatings = ratings.filter(isNumericRating);
  const avg = numericRatings.length
    ? (numericRatings.reduce((a, r) => a + numericValue(r), 0) / numericRatings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#f5faf3] dark:bg-[#0c1117] pb-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Retour ── */}
        <button
          onClick={() => router.push("/recruiter/list_interview/")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4E8F2F] dark:text-green-400 hover:text-[#3d7025] dark:hover:text-green-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

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
                Évaluation du Responsable Métier
              </h1>
              <p className="text-green-200/60 text-sm mt-1">Synthèse des réponses et observations</p>
            </div>

            <div className="sm:ml-auto shrink-0 flex flex-wrap items-center gap-2">
              {typeConfig && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap backdrop-blur-sm bg-white/10 border-white/20 text-white`}>
                  {typeConfig.label}
                </span>
              )}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-200" />
                <span className="text-xs font-bold text-green-100">Évaluation complétée</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Score + Évaluateur ── */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">

          {/* Score ring */}
          {overallRating !== null && (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6 flex flex-col items-center justify-center gap-1 min-w-[180px]">
              <ScoreRing value={overallRating} max={5} />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                Note globale
              </p>
            </div>
          )}

          {/* Évaluateur */}
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6 flex flex-col justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E9F5E3] to-[#d4edca] dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center shrink-0 border border-[#c8e6ba] dark:border-green-800/30">
                <span className="text-sm font-black text-[#4E8F2F] dark:text-green-400">
                  {getInitials(evaluatorName)}
                </span>
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white text-base leading-tight">
                  {evaluatorName}
                </p>
                {evaluatorEmail && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{evaluatorEmail}</p>
                )}
                <span className="inline-flex mt-2 items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#E9F5E3] dark:bg-green-900/30 text-[#4E8F2F] dark:text-green-300 border border-[#c8e6ba] dark:border-green-800/30">
                  <Award className="w-3 h-3" />
                  {evaluatorRole || "Responsable métier"}
                </span>
              </div>
            </div>

            {/* Stats pills */}
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

        {/* ── Décision ── */}
        {decision && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-widest">
                Décision
              </h2>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm
              ${String(decision).toLowerCase().includes("retenu")
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                : String(decision).toLowerCase().includes("refus") || String(decision).toLowerCase().includes("rejet")
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300"
              }`}>
              {String(decision).toLowerCase().includes("retenu")
                ? <CheckCircle2 className="w-4 h-4" />
                : String(decision).toLowerCase().includes("refus") || String(decision).toLowerCase().includes("rejet")
                  ? <XCircle className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4" />
              }
              {decision}
            </span>
          </div>
        )}

        {/* ── Notes générales ── */}
        {notes && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-widest">
                Observations supplémentaires
              </h2>
            </div>
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-[#4E8F2F] to-[#69B332]" />
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          </div>
        )}

        {/* ── Critères / Réponses détaillées ── */}
        {ratings.length > 0 && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                  Réponses détaillées
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                {ratings.length}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {ratings.map((r, i) => {
                const numeric = isNumericRating(r);
                const val     = numeric ? numericValue(r) : null;
                const pct     = numeric ? Math.round((val / 5) * 100) : null;
                const hasChoices = r.choices && Array.isArray(r.choices) && r.choices.length > 0;

                return (
                  <div
                    key={i}
                    className="group px-6 py-5 hover:bg-[#fafff8] dark:hover:bg-slate-900/40 transition-colors duration-150"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Index + Label + answer */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 group-hover:bg-[#E9F5E3] group-hover:text-[#4E8F2F] dark:group-hover:bg-green-900/30 dark:group-hover:text-green-400 transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-snug">
                              {r.label || r.question || r.criterion || `Question ${i + 1}`}
                            </p>
                            {r.type && (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                {r.type}
                              </span>
                            )}
                          </div>

                          {/* Numeric → gauge bar */}
                          {numeric && <GaugeBar value={val} />}

                          {/* Choices list */}
                          {!numeric && hasChoices && (
                            <ChoiceList choices={r.choices} selected={r.value} />
                          )}

                          {/* Oui / Non without choices */}
                          {!numeric && !hasChoices && typeof r.value === "string" &&
                            (r.value === "Oui" || r.value === "Non") && (
                            <div className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm
                              ${r.value === "Oui"
                                ? "bg-[#F1FAF4] dark:bg-emerald-950/20 border-[#6CB33F] dark:border-emerald-700 text-[#4E8F2F] dark:text-emerald-300"
                                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                              }`}>
                              {r.value === "Oui"
                                ? <CheckCircle2 className="w-4 h-4" />
                                : <XCircle className="w-4 h-4" />
                              }
                              {r.value}
                            </div>
                          )}

                          {/* Other string / CHOICE */}
                          {!numeric && !hasChoices && typeof r.value === "string" &&
                            r.value !== "Oui" && r.value !== "Non" && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Réponse :</span>
                              <AnswerBadge value={r.value} />
                            </div>
                          )}

                          {/* Comment */}
                          {r.comment && (
                            <div className="mt-3 border border-amber-200 dark:border-amber-800 rounded-xl p-3 bg-amber-50 dark:bg-amber-950/20">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-500 dark:text-amber-400 mb-1">Commentaire</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right — stars if numeric */}
                      <div className="shrink-0 sm:pt-0.5 ml-10 sm:ml-0">
                        {numeric ? (
                          <>
                            <StarRating value={val} max={5} />
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right mt-1 tabular-nums">
                              {pct}%
                            </p>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium uppercase tracking-wide">
                            {hasChoices ? "Choix" : r.type === "BOOLEAN" ? "Oui / Non" : "Texte"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer synthèse */}
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

        {/* ── Aucune réponse ── */}
        {ratings.length === 0 && (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aucune réponse enregistrée.</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
              Les réponses apparaîtront ici une fois l&apos;évaluation complétée.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}