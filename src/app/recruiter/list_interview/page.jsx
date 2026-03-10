"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
  RefreshCcw,
  Plus,
  ChevronDown,
  Star,
  FileText,
  X,
  ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
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

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "Attente ResponsableMétier",
    short: "Attente Resp.",
    color:
      "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente candidat",
    short: "Attente candidat",
    color:
      "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/30",
    dot: "bg-sky-500",
  },
  CONFIRMED: {
    label: "Confirmé",
    short: "Confirmé",
    color:
      "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  CANDIDATE_REQUESTED_RESCHEDULE: {
    label: "Report demandé",
    short: "Report",
    color:
      "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30",
    dot: "bg-orange-500",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "Attente admin",
    short: "Attente admin",
    color:
      "text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30",
    dot: "bg-violet-500",
  },
  MODIFIED: {
    label: "Modifié",
    short: "Modifié",
    color:
      "text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30",
    dot: "bg-indigo-500",
  },
  CANCELLED: {
    label: "Annulé",
    short: "Annulé",
    color:
      "text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
};

const TYPE_CONFIG = {
  RH: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
  rh: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
  rh_technique: {
    label: "RH + Tech",
    cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700",
  },
  TECHNIQUE: {
    label: "Technique",
    cls: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-700",
  },
  DGA: {
    label: "DGA",
    cls: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-700",
  },
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

function getDGANote(interview) {
  const notes = interview.entretienNotesDGA || [];
  if (!notes.length) return null;

  return [...notes].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )[0];
}

function getStatusCount(stats, key) {
  if (!stats) return 0;
  if (key === "ALL") return stats.TOTAL ?? 0;
  return stats[key] ?? 0;
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
      {getInitials(name)}
    </div>
  );
}

function Badge({ label, className = "", dotClass = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${className}`}
    >
      {dotClass ? <span className={`w-2 h-2 rounded-full ${dotClass}`} /> : null}
      {label}
    </span>
  );
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600 text-[#4E8F2F] dark:text-emerald-400 transition-colors">
      <Star className="w-3.5 h-3.5 fill-current" />
      {score}/5
    </span>
  );
}

function DetailCard({ label, value, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors">
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      {children ? (
        children
      ) : (
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function CancelInterviewModal({
  open,
  onClose,
  onConfirm,
  reason,
  setReason,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Annuler l'entretien
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cette action annulera définitivement cet entretien.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Raison de l'annulation <span className="text-gray-400">(optionnel)</span>
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Saisir une raison..."
            disabled={loading}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none"
          />
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Annulation..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInterviewList() {
  const router = useRouter();

  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelInterviewId, setCancelInterviewId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const LIMIT = 10;
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });

      const data = await apiFetch(`/api/interviews/admin/all?${params.toString()}`);
      setInterviews(data.interviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch("/api/interviews/admin/stats");
      setStats(data.data || {});
    } catch (_) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleApprove(interviewId, e) {
    e.stopPropagation();
    if (!confirm("Approuver la modification de cet entretien ?")) return;

    setActionLoading(interviewId + "_approve");
    try {
      await apiFetch(`/api/interviews/admin/approve/${interviewId}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(interviewId, e) {
    e.stopPropagation();
    const reason = prompt("Raison du rejet (optionnel) :");
    if (reason === null) return;

    setActionLoading(interviewId + "_reject");
    try {
      await apiFetch(`/api/interviews/admin/reject/${interviewId}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  function openCancelModal(interviewId, e) {
    e.stopPropagation();
    setCancelInterviewId(interviewId);
    setCancelReason("");
    setCancelModalOpen(true);
  }

  function closeCancelModal() {
    if (actionLoading === cancelInterviewId + "_cancel") return;
    setCancelModalOpen(false);
    setCancelInterviewId(null);
    setCancelReason("");
  }

  async function confirmCancelInterview() {
    if (!cancelInterviewId) return;

    setActionLoading(cancelInterviewId + "_cancel");
    try {
      await apiFetch(`/api/interviews/${cancelInterviewId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: cancelReason }),
      });

      await fetchInterviews();
      await fetchStats();
      setExpandedRow(null);
      setCancelModalOpen(false);
      setCancelInterviewId(null);
      setCancelReason("");
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <CancelInterviewModal
        open={cancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={confirmCancelInterview}
        reason={cancelReason}
        setReason={setCancelReason}
        loading={actionLoading === cancelInterviewId + "_cancel"}
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Liste des Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Administration · Vue globale de tous les entretiens
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/recruiter/schedule_interview")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Planifier un entretien
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              "ALL",
              "CONFIRMED",
              "PENDING_CONFIRMATION",
              "PENDING_ADMIN_APPROVAL",
              "CANCELLED",
            ].map((s) => {
              const cfg = s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
              const isActive = statusFilter === s;

              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${isActive
                    ? "bg-[#6CB33F] hover:bg-[#4E8F2F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
                    }`}
                >
                  {cfg.dot ? (
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : cfg.dot}`}
                    />
                  ) : null}
                  {cfg.short}
                </button>
              );
            })}
          </div>

          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${total} résultat${total > 1 ? "s" : ""}`}
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Chargement des entretiens...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Une erreur est survenue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
              <button
                onClick={fetchInterviews}
                className="mt-2 px-6 py-3 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full font-semibold transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#4E8F2F] dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Aucun entretien trouvé
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Aucun entretien ne correspond aux filtres actuels.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Candidat
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Poste
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Planification
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Éval. DGA
                    </th>
                    <th className="text-right px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {interviews.map((iv) => {
                    const sc = STATUS_CONFIG[iv.status] || {};
                    const tc = TYPE_CONFIG[iv.interviewType] || TYPE_CONFIG.RH;
                    const dgaNote = getDGANote(iv);
                    const score = dgaNote
                      ? dgaNote.evaluationGlobale ?? dgaNote.score ?? null
                      : null;
                    const comment = dgaNote ? dgaNote.commentaire || "" : "";
                    const hasConfirmedDate = !!iv.confirmedDate;
                    const displayDate = hasConfirmedDate ? iv.confirmedDate : (iv.proposedDate || iv.proposedStart);
                    const displayTime = hasConfirmedDate ? iv.confirmedTime : (iv.proposedTime || (iv.proposedStart
                      ? new Date(iv.proposedStart).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                      : null));
                    const isCancelled = iv.status === "CANCELLED";
                    const isExpanded = expandedRow === iv._id;
                    const hasDGA = iv.allEntretienNotes?.some((n) => /dga/i.test(n.type));
                    const isActioning = actionLoading?.startsWith(iv._id);

                    return (
                      <React.Fragment key={iv._id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : iv._id)}
                          className={`hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${isExpanded ? "bg-green-50/30 dark:bg-gray-700/30" : ""
                            } ${isCancelled ? "opacity-60" : ""}`}
                        >
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={iv.candidateName} />
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 dark:text-white">
                                  {iv.candidateName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {iv.candidateEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 lg:px-8 py-5">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[100px] sm:max-w-[140px]">
                                {iv.jobTitle || "—"}
                              </span>
                            </span>
                          </td>

                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <Badge label={tc.label} className={tc.cls} />
                              {hasDGA && !isCancelled && (
                                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                                  + Note DGA
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 lg:px-8 py-5">
                            <Badge
                              label={sc.short || iv.status}
                              className={sc.color}
                              dotClass={sc.dot}
                            />
                          </td>

                          <td className="px-6 lg:px-8 py-5 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400" />
                                <span>Planifié {formatDate(iv.createdAt)}</span>
                              </div>

                              {iv.status === "CONFIRMED" && iv.confirmedDate && (
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>Confirmé {formatDate(iv.confirmedDate)}</span>
                                </div>
                              )}

                              {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                                  <span>
                                    Report : {formatDate(iv.candidateProposedDate)}{" "}
                                    {iv.candidateProposedTime}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 lg:px-8 py-5">
                            {dgaNote ? (
                              <div className="flex flex-col gap-2">
                                <ScoreBadge score={score} />
                                {comment ? (
                                  <span
                                    className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[170px]"
                                    title={comment}
                                  >
                                    {comment}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                            )}
                          </td>

                          <td className="px-6 lg:px-8 py-5 text-right">
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""
                                }`}
                            />
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 lg:px-8 pb-6 bg-green-50/20 dark:bg-gray-900/20"
                            >
                              {/* ✅ GRILLE DETAIL CARDS */}
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
                                {/* Poste */}
                                <DetailCard label="Poste" value={iv.jobTitle || "—"} />

                                {/* Responsable */}
                                <DetailCard
                                  label="Responsable"
                                  value={iv.assignedUserEmail || "—"}
                                />

                                {/* ✅ CARTE: Date et Heure (NOUVELLE) */}
                                <DetailCard
                                  label="Date et Heure"
                                  value={`${formatDate(displayDate)} • ${displayTime || "—"}`}
                                />

                                {/* Raison report */}
                                {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                  <DetailCard
                                    label="Raison report"
                                    value={iv.candidateRescheduleReason || "Non précisée"}
                                  />
                                )}

                                {/* Nouvelle date proposée */}
                                {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                  <DetailCard
                                    label="Nouvelle date proposée"
                                    value={`${formatDate(iv.responsableProposedDate)} ${iv.responsableProposedTime || ""}`}
                                  />
                                )}

                                {/* ✅ CARTE: Fiche d'évaluation */}
                                {(iv.status === "CONFIRMED" || iv.status === "PENDING_CANDIDATE_CONFIRMATION") && (
                                  <DetailCard label="Évaluation">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/recruiter/interviews/${iv._id}/evaluation`);
                                      }}
                                      className="w-full px-4 py-2.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Fiche d'évaluation
                                    </button>
                                  </DetailCard>
                                )}

                                {/* ✅ CARTE: Actions (Annuler) */}
                                {!isCancelled && (
                                  <DetailCard label="Actions">
                                    <button
                                      disabled={!!isActioning}
                                      onClick={(e) => openCancelModal(iv._id, e)}
                                      className="w-full px-4 py-2.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                    >
                                      Annuler l'entretien
                                    </button>
                                  </DetailCard>
                                )}

                                {/* ✅ CARTE: Approuver/Rejeter (si PENDING_ADMIN_APPROVAL) */}
                                {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                  <>
                                    <DetailCard label="Approbation">
                                      <button
                                        disabled={!!isActioning}
                                        onClick={(e) => handleApprove(iv._id, e)}
                                        className="w-full px-4 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                                      >
                                        {actionLoading === iv._id + "_approve" ? "…" : "Approuver"}
                                      </button>
                                    </DetailCard>

                                    <DetailCard label="Refus">
                                      <button
                                        disabled={!!isActioning}
                                        onClick={(e) => handleReject(iv._id, e)}
                                        className="w-full px-4 py-2.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                      >
                                        {actionLoading === iv._id + "_reject" ? "…" : "Rejeter"}
                                      </button>
                                    </DetailCard>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && totalPages > 1 && (
          <div className="mt-6 px-4 sm:px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">
              Page {page} sur {totalPages} — Total: {total} entretien{total > 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors"
              >
                ← Préc.
              </button>

              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-full border font-bold transition-colors ${p === page
                    ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors"
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}