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
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function recColor(rec) {
  if (rec === "RETENIR")      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (rec === "A_CONSIDERER") return { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" };
  return                               { bg: "bg-red-50",    border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500" };
}

function recLabel(rec) {
  if (rec === "RETENIR")      return "✅ Retenir";
  if (rec === "A_CONSIDERER") return "⚠️ À considérer";
  return "❌ Rejeter";
}

function ScoreBar({ value, color = "#6CB33F" }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

const COLORS = ["#6CB33F", "#3B82F6", "#8B5CF6", "#F59E0B"];

export default function ComparisonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/interviews/comparisons/${id}`, {
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

  if (loading) return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#E9F5E3] flex items-center justify-center">
          <Brain className="w-7 h-7 text-[#6CB33F] animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-[#6CB33F] animate-spin" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center">
      <div className="text-center space-y-3">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <p className="text-red-600 font-bold">{error || "Comparaison introuvable"}</p>
        <button onClick={() => router.back()} className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm">← Retour</button>
      </div>
    </div>
  );

  const { comparison, candidates, jobTitle, createdAt } = data;
  const best = comparison?.meilleur_candidat;
  const cols = (candidates || []).length;

  return (
    <div className="min-h-screen bg-[#F0FAF0] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/recruiter/comparisons_list")} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-[#6CB33F]" /> Détails Comparaison
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              <span>{jobTitle || "—"}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(createdAt)}</span>
              <span>•</span>
              <span>{cols} candidat{cols > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Résumé global */}
        {comparison?.resume_global && (
          <div className="bg-white rounded-3xl border border-[#d7ebcf] shadow-sm px-6 py-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E9F5E3] flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-[#6CB33F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Synthèse globale</p>
              <p className="text-sm text-gray-800 leading-relaxed">{comparison.resume_global}</p>
            </div>
          </div>
        )}

        {/* Meilleur candidat */}
        {best && (
          <div className="bg-gradient-to-r from-[#6CB33F] to-[#4E8F2F] rounded-3xl px-6 py-5 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">Meilleur candidat recommandé</p>
              <p className="text-xl font-extrabold text-white">{best.nom}</p>
              <p className="text-sm text-white/85 mt-0.5">{best.raison}</p>
            </div>
          </div>
        )}

        {/* Cartes candidats */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, minmax(220px, 1fr))` }}>
          {(comparison?.candidats || []).map((cand, idx) => {
            const rc = recColor(cand.recommandation);
            const isBest = best?.nom === cand.nom;
            return (
              <div key={idx} className={`bg-white rounded-3xl shadow-sm overflow-hidden border ${isBest ? "border-[#6CB33F] ring-2 ring-[#6CB33F]/20" : "border-gray-100"}`}>
                <div className={`px-5 py-4 flex items-center gap-3 ${isBest ? "bg-[#E9F5E3]" : "bg-gray-50"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg flex-shrink-0 ${isBest ? "bg-[#6CB33F] text-white" : "bg-gray-200 text-gray-700"}`}>
                    {(cand.nom || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5 truncate">
                      {cand.nom} {isBest && <Trophy className="w-4 h-4 text-[#6CB33F] flex-shrink-0" />}
                    </div>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${rc.bg} ${rc.border} ${rc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />{recLabel(cand.recommandation)}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Score global</span>
                      <span className="text-sm font-extrabold text-[#6CB33F]">{cand.score_global}%</span>
                    </div>
                    <ScoreBar value={cand.score_global} />
                  </div>
                  {(cand.points_forts || []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Points forts</p>
                      <ul className="space-y-1">
                        {cand.points_forts.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(cand.points_faibles || []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Points faibles</p>
                      <ul className="space-y-1">
                        {cand.points_faibles.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cand.commentaire && (
                    <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                      <p className="text-xs text-gray-600 italic leading-relaxed">{cand.commentaire}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tableau comparatif */}
        {comparison?.tableau_comparatif && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#6CB33F]" />
              <h2 className="font-extrabold text-gray-900 text-base">Tableau comparatif</h2>
            </div>
            <div className="p-5 space-y-5">
              {(comparison.tableau_comparatif.criteres || []).map((critere, ci) => (
                <div key={ci}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{critere}</p>
                  <div className="space-y-2">
                    {(comparison.tableau_comparatif.scores || []).map((s, si) => (
                      <div key={si} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-700 w-28 truncate flex-shrink-0">{s.nom}</span>
                        <div className="flex-1"><ScoreBar value={s.valeurs?.[ci] ?? 0} color={COLORS[si % COLORS.length]} /></div>
                        <span className="text-xs font-bold text-gray-600 w-10 text-right flex-shrink-0">{s.valeurs?.[ci] ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Données brutes */}
        {(candidates || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {candidates.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{c.nom}</p>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600"><TrendingUp className="w-3.5 h-3.5" /> Match IA</span>
                  <span className="font-bold text-[#6CB33F]">{c.matchScore !== null && c.matchScore !== undefined ? `${c.matchScore}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600"><Star className="w-3.5 h-3.5" /> Quiz</span>
                  <span className="font-bold text-blue-600">{c.quizPercentage !== null && c.quizPercentage !== undefined ? `${c.quizPercentage}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600"><ClipboardCheck className="w-3.5 h-3.5" /> Fiche</span>
                  <span className={`font-bold ${c.ficheExists ? "text-emerald-600" : "text-gray-400"}`}>{c.ficheExists ? "✅ Soumis" : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Décision finale */}
        {comparison?.decision_finale && (
          <div className="bg-white rounded-3xl border border-[#d7ebcf] shadow-sm px-6 py-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E9F5E3] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#6CB33F]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Décision finale</p>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{comparison.decision_finale}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
