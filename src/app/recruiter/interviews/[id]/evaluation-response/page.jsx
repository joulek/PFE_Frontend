"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function resolveInterviewTypeLabel(type) {
  if (!type) return null;
  const t = String(type).toLowerCase().trim();
  if ((t.includes("rh") && t.includes("tech")) || (t.includes("rh") && t.includes("technique"))) return { label: "RH + Tech", cls: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-950/30 dark:border-violet-700" };
  if (t.includes("technique") || t === "technique") return { label: "Technique", cls: "text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-300 dark:bg-pink-950/30 dark:border-pink-700" };
  if (t.includes("dga")) return { label: "DGA", cls: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-700" };
  if (t.includes("tel") || t.includes("phon")) return { label: "Téléphonique", cls: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/30 dark:border-sky-700" };
  return { label: "Entretien RH", cls: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700" };
}

function getInitials(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "R")[0].toUpperCase();
}

// ─── component ──────────────────────────────────────────────────────────────

export default function EvaluationResponsePage() {
  const { id } = useParams();

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token =
      (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
      "";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${id}/evaluation`, {
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
        // support both { evaluation: {...} } and flat object
        setEvaluation(data?.evaluation || data || null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement de l&apos;évaluation…</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Évaluation introuvable</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune évaluation n&apos;a été trouvée pour cet entretien.</p>
        </div>
      </div>
    );
  }

  // ── derived data ──────────────────────────────────────────────────────────

  const evaluatorName =
    evaluation?.evaluatedByName ||
    evaluation?.responsableName ||
    evaluation?.assignedUserName ||
    evaluation?.evaluatedBy ||
    null;

  const evaluatorEmail =
    evaluation?.evaluatedByEmail ||
    evaluation?.responsableEmail ||
    evaluation?.assignedUserEmail ||
    null;

  const interviewType =
    evaluation?.interviewType ||
    evaluation?.type ||
    null;

  const typeConfig = resolveInterviewTypeLabel(interviewType);

  const ratings = evaluation?.ratings || evaluation?.criteria || [];
  const overallRating = evaluation?.overallRating ?? evaluation?.evaluationGlobale ?? null;
  const notes = evaluation?.notes || evaluation?.commentaire || "";
  const decision = evaluation?.decision || null;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── BACK ── */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#4E8F2F] dark:hover:text-emerald-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* ── HEADER ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6CB33F]" />
              Critères d&apos;évaluation
            </h1>

            {/* Type badge */}
            {typeConfig && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${typeConfig.cls}`}>
                {typeConfig.label}
              </span>
            )}
          </div>

          {/* Evaluator card */}
          <div className="flex items-center gap-3 bg-[#F1FAF4] dark:bg-emerald-950/20 border border-[#d7ebcf] dark:border-emerald-800 rounded-xl p-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
              {evaluatorName ? getInitials(evaluatorName) : "R"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                Responsable métier
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {evaluatorName || "Responsable métier"}
              </p>
              {evaluatorEmail && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{evaluatorEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── QUESTIONS ── */}
        {ratings.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-800 dark:text-white text-base">Réponses détaillées</h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {ratings.map((r, index) => (
                <div key={index} className="px-6 py-5 space-y-3">

                  {/* Question label */}
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {index + 1}. {r.label || r.question || r.criterion || `Question ${index + 1}`}
                  </p>

                  {/* Score numérique 1-5 */}
                  {typeof r.value === "number" && (
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold border transition-colors
                            ${r.value === n
                              ? "bg-[#6CB33F] text-white border-[#6CB33F] shadow-sm"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                            }`}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Choix multiples */}
                  {r.choices && Array.isArray(r.choices) && (
                    <div className="space-y-2">
                      {r.choices.map((choice, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors
                            ${choice === r.value
                              ? "border-[#6CB33F] bg-[#F1FAF4] dark:bg-emerald-950/20 dark:border-emerald-700"
                              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
                              ${choice === r.value
                                ? "bg-[#6CB33F] border-[#6CB33F]"
                                : "border-gray-300 dark:border-gray-600"
                              }`}
                          />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{choice}</p>
                          {choice === r.value && (
                            <CheckCircle2 className="w-4 h-4 text-[#6CB33F] ml-auto flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Oui / Non */}
                  {typeof r.value === "string" && (r.value === "Oui" || r.value === "Non") && !r.choices && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm
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

                  {/* Texte libre */}
                  {typeof r.value === "string" && r.value !== "Oui" && r.value !== "Non" && !r.choices && (
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                      {r.value}
                    </div>
                  )}

                  {/* Commentaire */}
                  {r.comment && (
                    <div className="border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 bg-amber-50 dark:bg-amber-950/20">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-amber-500 dark:text-amber-400 mb-1">Commentaire</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÉVALUATION GÉNÉRALE ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-gray-800 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3">
            Évaluation générale
          </h2>

          {/* Note globale */}
          {overallRating !== null && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2">
                Note globale
              </p>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-6 h-6 transition-colors ${
                        n <= overallRating
                          ? "text-[#6CB33F] fill-[#6CB33F]"
                          : "text-gray-200 dark:text-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-extrabold text-[#4E8F2F] dark:text-emerald-400">
                  {overallRating}/5
                </span>
              </div>
            </div>
          )}

          {/* Décision */}
          {decision && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2">
                Décision
              </p>
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

          {/* Observations */}
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2">
              Observations supplémentaires
            </p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[60px]">
              {notes || <span className="text-gray-400 italic">Aucune observation</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}