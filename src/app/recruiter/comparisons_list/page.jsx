"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, Trophy, Eye, Trash2, Loader2,
  Users, Calendar, Briefcase, AlertCircle, RefreshCcw,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  try {
    const token =
      (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

export default function ComparisonsListPage() {
  const router = useRouter();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API_BASE}/api/interviews/comparisons`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const data = await res.json();
      setComparisons(Array.isArray(data.comparisons) ? data.comparisons : []);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Délai dépassé. Vérifiez la connexion au serveur.");
      } else {
        setError(err.message || "Erreur chargement");
      }
      setComparisons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Supprimer cette comparaison ?")) return;
    setDeletingId(String(id));
    try {
      await fetch(`${API_BASE}/api/interviews/comparisons/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setComparisons((prev) => prev.filter((c) => String(c._id) !== String(id)));
    } catch (err) {
      alert("Erreur suppression : " + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-[#6CB33F]" />
              Comparaisons IA
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Historique des comparaisons — {!loading && !error ? `${comparisons.length} comparaison${comparisons.length > 1 ? "s" : ""}` : ""}
            </p>
          </div>

          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Nouvelle comparaison
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#6CB33F] animate-spin" />
            <p className="text-sm text-gray-500">Chargement des comparaisons…</p>
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && error && (
          <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-10 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-gray-900 mb-1">Erreur de chargement</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white font-semibold text-sm transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        )}

        {/* ── Vide ── */}
        {!loading && !error && comparisons.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E9F5E3] flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-[#6CB33F]" />
            </div>
            <p className="font-extrabold text-gray-900 text-lg mb-1">Aucune comparaison</p>
            <p className="text-sm text-gray-500 mb-6">
              Allez sur la liste des entretiens, sélectionnez des candidats et cliquez sur "Comparer"
            </p>
            <button
              onClick={() => router.push("/recruiter/list_interview")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white font-semibold text-sm transition-colors"
            >
              <Users className="w-4 h-4" /> Aller aux entretiens
            </button>
          </div>
        )}

        {/* ── Liste ── */}
        {!loading && !error && comparisons.length > 0 && (
          <div className="space-y-3">
            {comparisons.map((comp) => (
              <div
                key={String(comp._id)}
                onClick={() => router.push(`/recruiter/compare_interviews/${comp._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:border-[#6CB33F] hover:shadow-md transition-all cursor-pointer"
              >
                {/* Icône */}
                <div className="w-12 h-12 rounded-2xl bg-[#E9F5E3] flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-[#6CB33F]" />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-extrabold text-gray-900 text-sm truncate">
                      {(comp.candidatesNames || []).join(" vs ") || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9F5E3] text-[#4E8F2F] border border-[#d7ebcf]">
                      {comp.candidatesCount || 0} candidats
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Briefcase className="w-3 h-3" /> {comp.jobTitle || "—"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" /> {formatDate(comp.createdAt)}
                    </span>
                    {comp.meilleurCandidat && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Trophy className="w-3 h-3" /> {comp.meilleurCandidat}
                      </span>
                    )}
                    {comp.creatorName && (
                      <span className="text-xs text-gray-400">par {comp.creatorName}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/recruiter/compare_interviews/${comp._id}`); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#6CB33F] bg-[#E9F5E3] text-[#4E8F2F] text-xs font-bold hover:bg-[#6CB33F] hover:text-white transition-all whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" /> Détails
                  </button>

                  <button
                    onClick={(e) => handleDelete(comp._id, e)}
                    disabled={deletingId === String(comp._id)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                  >
                    {deletingId === String(comp._id)
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}