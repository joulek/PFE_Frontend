"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, Trophy, CheckCircle2, AlertTriangle,
  TrendingUp, Star, Loader2, BarChart3, FileText,
  ClipboardCheck, Zap, XCircle, Calendar,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function recColor(rec) {
  if (rec === "RETENIR")
    return {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-700",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  if (rec === "A_CONSIDERER")
    return {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-700",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  return {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  };
}

function recLabel(rec) {
  if (rec === "RETENIR")      return "✅ Retenir";
  if (rec === "A_CONSIDERER") return "⚠️ À considérer";
  return "❌ Rejeter";
}

function ScoreBar({ value, color = "#6CB33F" }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

const COLORS = ["#6CB33F", "#3B82F6", "#8B5CF6", "#F59E0B"];

export default function ComparisonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res  = await fetch(`${API_BASE}/api/interviews/comparisons/${id}`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Erreur");
        setData(json.comparison);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#E9F5E3] dark:bg-[#6CB33F]/10 flex items-center justify-center">
          <Brain className="w-7 h-7 text-[#6CB33F] animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-[#6CB33F] animate-spin" />
      </div>
    </div>
  );

  /* ── Erreur ── */
  if (error || !data) return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-red-600 dark:text-red-400 font-bold">{error || "Comparaison introuvable"}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm hover:bg-[#4E8F2F] transition-colors"
        >
          ← Retour
        </button>
      </div>
    </div>
  );

  const { comparison, candidates, jobTitle, createdAt } = data;
  const best = comparison?.meilleur_candidat;
  const cols = (candidates || []).length;

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 pb-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 sm:gap-4">
          <button
            onClick={() => router.push("/recruiter/comparisons_list")}
            className="mt-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-[#6CB33F] flex-shrink-0" />
              Détails Comparaison
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              {jobTitle && <span className="truncate max-w-[180px] sm:max-w-none">{jobTitle}</span>}
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {formatDate(createdAt)}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{cols} candidat{cols > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* ── Synthèse globale ── */}
        {comparison?.resume_global && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-[#d7ebcf] dark:border-gray-700 shadow-sm px-4 sm:px-6 py-4 sm:py-5 flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#E9F5E3] dark:bg-[#6CB33F]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#6CB33F]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Synthèse globale
              </p>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {comparison.resume_global}
              </p>
            </div>
          </div>
        )}

        {/* ── Meilleur candidat ── */}
        {best && (
          <div className="bg-gradient-to-r from-[#6CB33F] to-[#4E8F2F] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 shadow-md">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                Meilleur candidat recommandé
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-white truncate">{best.nom}</p>
              <p className="text-xs sm:text-sm text-white/85 mt-0.5 line-clamp-2 sm:line-clamp-none">
                {best.raison}
              </p>
            </div>
          </div>
        )}

        {/* ── Cartes candidats ── */}
        <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${
          cols === 2 ? "sm:grid-cols-2" :
          cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" :
          "sm:grid-cols-2 lg:grid-cols-4"
        }`}>
          {(comparison?.candidats || []).map((cand, idx) => {
            const rc    = recColor(cand.recommandation);
            const isBest = best?.nom === cand.nom;
            return (
              <div
                key={idx}
                className={`bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden border transition-colors ${
                  isBest
                    ? "border-[#6CB33F] ring-2 ring-[#6CB33F]/20 dark:ring-[#6CB33F]/30"
                    : "border-gray-100 dark:border-gray-700"
                }`}
              >
                {/* Card header */}
                <div className={`px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 ${
                  isBest
                    ? "bg-[#E9F5E3] dark:bg-[#6CB33F]/10"
                    : "bg-gray-50 dark:bg-gray-700/50"
                }`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-extrabold text-base sm:text-lg flex-shrink-0 ${
                    isBest
                      ? "bg-[#6CB33F] text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                  }`}>
                    {(cand.nom || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 truncate">
                      <span className="truncate">{cand.nom}</span>
                      {isBest && <Trophy className="w-4 h-4 text-[#6CB33F] flex-shrink-0" />}
                    </div>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${rc.bg} ${rc.border} ${rc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.dot}`} />
                      {recLabel(cand.recommandation)}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
                  {/* Score global */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Score global
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#6CB33F]">
                        {cand.score_global}%
                      </span>
                    </div>
                    <ScoreBar value={cand.score_global} />
                  </div>

                  {/* Points forts */}
                  {(cand.points_forts || []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                        Points forts
                      </p>
                      <ul className="space-y-1">
                        {cand.points_forts.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Points faibles */}
                  {(cand.points_faibles || []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                        Points faibles
                      </p>
                      <ul className="space-y-1">
                        {cand.points_faibles.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Commentaire */}
                  {cand.commentaire && (
                    <div className="rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-700/50 px-3 py-2 sm:py-2.5">
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                        {cand.commentaire}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tableau comparatif ── */}
        {comparison?.tableau_comparatif && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#6CB33F]" />
              <h2 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base">
                Tableau comparatif
              </h2>
            </div>
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {(comparison.tableau_comparatif.criteres || []).map((critere, ci) => (
                <div key={ci}>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {critere}
                  </p>
                  <div className="space-y-2">
                    {(comparison.tableau_comparatif.scores || []).map((s, si) => (
                      <div key={si} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-24 sm:w-28 truncate flex-shrink-0">
                          {s.nom}
                        </span>
                        <div className="flex-1">
                          <ScoreBar value={s.valeurs?.[ci] ?? 0} color={COLORS[si % COLORS.length]} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-9 sm:w-10 text-right flex-shrink-0">
                          {s.valeurs?.[ci] ?? 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Données brutes ── */}
        {(candidates || []).length > 0 && (
          <div className={`grid gap-3 sm:gap-4 grid-cols-1 ${
            candidates.length === 2 ? "sm:grid-cols-2" :
            candidates.length === 3 ? "sm:grid-cols-3" :
            "sm:grid-cols-2 lg:grid-cols-4"
          }`}>
            {candidates.map((c, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 sm:py-4 space-y-2 sm:space-y-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
                  {c.nom}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-3.5 h-3.5" /> Match IA
                  </span>
                  <span className="font-bold text-[#6CB33F]">
                    {c.matchScore != null ? `${c.matchScore}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Star className="w-3.5 h-3.5" /> Quiz
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {c.quizPercentage != null ? `${c.quizPercentage}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Fiche
                  </span>
                  <span className={`font-bold ${c.ficheExists ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>
                    {c.ficheExists ? "✅ Soumis" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Décision finale ── */}
        {comparison?.decision_finale && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-[#d7ebcf] dark:border-gray-700 shadow-sm px-4 sm:px-6 py-4 sm:py-5 flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#E9F5E3] dark:bg-[#6CB33F]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#6CB33F]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Décision finale
              </p>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {comparison.decision_finale}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}