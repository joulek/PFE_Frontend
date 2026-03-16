"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Trash2,
  Eye,
  Plus,
  Calendar,
  Users,
  Briefcase,
  User,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────
//  Modal de confirmation de suppression
// ─────────────────────────────────────────────────────────────────
function DeleteModal({ comparison, onConfirm, onCancel, loading }) {
  if (!comparison) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70" />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icône */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>

        {/* Titre */}
        <h3 className="text-center text-lg font-extrabold text-gray-900 dark:text-white">
          Supprimer cette comparaison ?
        </h3>

        {/* Détail */}
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          La comparaison{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {comparison.title || comparison.candidateNames?.join(" vs ") || "sélectionnée"}
          </span>{" "}
          sera définitivement supprimée. Cette action est irréversible.
        </p>

        {/* Boutons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </>
            )}
          </button>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Carte comparaison
// ─────────────────────────────────────────────────────────────────
function ComparisonCard({ comparison, onDelete, onView }) {
  const names = comparison.candidateNames || [];
  const title =
    comparison.title ||
    (names.length >= 2 ? names.slice(0, 2).join(" vs ") : "Comparaison");

  const winner = comparison.winner || comparison.recommendation || null;
  const winnerName =
    typeof winner === "string"
      ? winner
      : winner?.name || winner?.candidateName || null;

  const date = comparison.createdAt
    ? new Date(comparison.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:border-[#6CB33F]/30 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#6CB33F]/40">
      {/* Icône */}
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E9F5E3] dark:bg-[#6CB33F]/10">
        <Brain className="h-5 w-5 text-[#6CB33F]" />
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold text-gray-900 dark:text-white">
          {title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {comparison.jobTitle && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {comparison.jobTitle}
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
          )}
          {winnerName && (
            <span className="flex items-center gap-1 font-semibold text-[#4E8F2F] dark:text-[#6CB33F]">
              <User className="h-3 w-3" />
              {winnerName}
            </span>
          )}
          {comparison.createdByName && (
            <span className="flex items-center gap-1">
              par {comparison.createdByName}
            </span>
          )}
        </div>
      </div>

      {/* Badge candidats */}
      {names.length > 0 && (
        <span className="flex-shrink-0 rounded-full border border-[#6CB33F]/30 bg-[#E9F5E3] px-3 py-1 text-xs font-bold text-[#4E8F2F] dark:border-[#6CB33F]/20 dark:bg-[#6CB33F]/10 dark:text-[#6CB33F]">
          {names.length} candidat{names.length > 1 ? "s" : ""}
        </span>
      )}

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onView(comparison._id)}
          className="flex items-center gap-1.5 rounded-full border border-[#6CB33F] bg-[#E9F5E3] px-3.5 py-1.5 text-xs font-semibold text-[#4E8F2F] transition hover:bg-[#6CB33F] hover:text-white dark:border-[#6CB33F]/50 dark:bg-[#6CB33F]/10 dark:text-[#6CB33F] dark:hover:bg-[#6CB33F] dark:hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Détails
        </button>
        <button
          type="button"
          onClick={() => onDelete(comparison)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-400 transition hover:border-red-300 hover:bg-red-100 hover:text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────────────
export default function ComparisonsListPage() {
  const router = useRouter();

  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal suppression
  const [deleteTarget, setDeleteTarget] = useState(null); // comparison object
  const [deleting, setDeleting] = useState(false);

  // ── Chargement ──
  useEffect(() => {
    loadComparisons();
  }, []);

  async function loadComparisons() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/interviews/comparisons");
      setComparisons(Array.isArray(data) ? data : data.comparisons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Suppression ──
  function handleDeleteClick(comparison) {
    setDeleteTarget(comparison);
  }

  function handleDeleteCancel() {
    if (deleting) return;
    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/interviews/comparisons/${deleteTarget._id}`, {
        method: "DELETE",
      });
      setComparisons((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Vue ──
  function handleView(id) {
    router.push(`/recruiter/compare_interviews/${id}`);
  }

  // ─────────────────────────────────────────────────────────────
  //  Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] px-4 py-8 dark:bg-gray-950 sm:px-6 sm:py-10">
      {/* Modal suppression */}
      <DeleteModal
        comparison={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      <div className="mx-auto max-w-4xl">
        {/* ── En-tête ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              <Brain className="h-8 w-8 text-[#6CB33F]" />
              Comparaisons IA
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Historique des comparaisons —{" "}
              {loading ? "…" : `${comparisons.length} comparaison${comparisons.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/recruiter/list_interview")}
            className="flex items-center gap-2 rounded-full bg-[#6CB33F] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4E8F2F] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nouvelle comparaison
          </button>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Chargement ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#6CB33F]" />
          </div>
        )}

        {/* ── Liste vide ── */}
        {!loading && comparisons.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F5E3] dark:bg-[#6CB33F]/10">
              <Brain className="h-8 w-8 text-[#6CB33F]" />
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              Aucune comparaison
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sélectionnez des candidats depuis la liste des entretiens pour lancer une comparaison IA.
            </p>
            <button
              onClick={() => router.push("/recruiter/list_interview")}
              className="mt-6 flex items-center gap-2 rounded-full bg-[#6CB33F] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4E8F2F]"
            >
              <ChevronRight className="h-4 w-4" />
              Aller aux entretiens
            </button>
          </div>
        )}

        {/* ── Liste ── */}
        {!loading && comparisons.length > 0 && (
          <div className="space-y-3">
            {comparisons.map((comparison) => (
              <ComparisonCard
                key={comparison._id}
                comparison={comparison}
                onDelete={handleDeleteClick}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}