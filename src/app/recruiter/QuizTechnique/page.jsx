"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllQuizzes, deleteQuiz } from "../../services/quiz.api";
import {
  Loader2,
  Search,
  Trash2,
  ExternalLink,
  AlertCircle,
  FileQuestion,
  Briefcase,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function QuizTechniqueListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllQuizzes();
      setItems(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = (x.jobTitle || x.titre || "").toLowerCase();
      const jobId = (x.jobOfferId || "").toLowerCase();
      return title.includes(s) || jobId.includes(s);
    });
  }, [items, q]);

  const handleDelete = async (quizId) => {
    if (!confirm("Supprimer ce quiz ?")) return;
    setDeletingId(quizId);
    try {
      await deleteQuiz(quizId);
      setItems((prev) => prev.filter((x) => x._id !== quizId));
    } catch (err) {
      alert(err.response?.data?.message || "Erreur suppression");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm text-gray-400 font-medium tracking-wide">
          Chargement des quiz…
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Quiz techniques
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {items.length} quiz disponible{items.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre ou jobId…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                       transition-shadow placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <FileQuestion className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-medium">Aucun quiz trouvé</p>
        </div>
      ) : (
        /* ── Quiz list ── */
        <div className="grid gap-4">
          {filtered.map((x) => {
            const title = x.jobTitle || x.titre || "Sans titre";
            const questionsCount =
              x.totalQuestions ?? x.questionsCount ?? x.questions?.length ?? 0;
            const isActive = x.status === "ACTIVE";

            return (
              <div
                key={x._id}
                className="group relative rounded-2xl border border-gray-200 dark:border-gray-700/80
                           bg-white dark:bg-gray-900
                           hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-500/30
                           transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                  {/* Left: icon */}
                  <div
                    className="shrink-0 w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10
                                flex items-center justify-center"
                  >
                    <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {/* Center: info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Job title */}
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {title}
                    </h3>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {/* Job ID */}
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="font-mono truncate max-w-[180px]">
                          {x.jobOfferId}
                        </span>
                      </span>

                      {/* Questions count */}
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        {questionsCount} question{questionsCount > 1 ? "s" : ""}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider
                          ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                      >
                        {isActive ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {x.status || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/recruiter/QuizTechnique/${x.jobOfferId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                 border border-gray-200 dark:border-gray-700
                                 text-gray-700 dark:text-gray-300
                                 hover:bg-gray-50 dark:hover:bg-gray-800
                                 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir
                    </Link>

                    <button
                      onClick={() => handleDelete(x._id)}
                      disabled={deletingId === x._id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                                 bg-red-50 dark:bg-red-500/10
                                 text-red-600 dark:text-red-400
                                 border border-red-200 dark:border-red-500/20
                                 hover:bg-red-100 dark:hover:bg-red-500/20
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors"
                    >
                      {deletingId === x._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}