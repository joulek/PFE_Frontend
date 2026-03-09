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
  XCircle,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  FileText,
  X,
  AlertTriangle,
  Send,
} from "lucide-react";
import { getMyInterviews, getMyInterviewsStats } from "../../services/interviewApi";

// ─────────────────────────────────────────────────────────
//  STATUTS — Vue ResponsableMetier (labels adaptés)
// ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "En attente de votre confirmation",
    short: "À confirmer",
    color:
      "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente confirmation candidat",
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
    label: "Candidat demande un report",
    short: "Report demandé",
    color:
      "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30",
    dot: "bg-orange-500",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "En attente d'approbation admin",
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

// ─────────────────────────────────────────────────────────
//  Filtres affichés pour le ResponsableMetier
// ─────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  "ALL",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PENDING_CANDIDATE_CONFIRMATION",
  "CANDIDATE_REQUESTED_RESCHEDULE",
  "CANCELLED",
];

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

function getStatusCount(stats, key) {
  if (!stats) return 0;
  if (key === "ALL") return stats.TOTAL ?? 0;
  return stats[key] ?? 0;
}

// ─────────────────────────────────────────────────────────
//  Composants réutilisables
// ─────────────────────────────────────────────────────────
function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
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

function StatCard({ label, value, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors shadow-sm ${
        active
          ? "bg-[#E9F5E3] dark:bg-gray-700 border-[#cfe4c4] dark:border-gray-600"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50/40 dark:hover:bg-gray-700/60"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#4E8F2F] dark:text-emerald-400">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
        {label}
      </div>
    </button>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors">
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
        {value || "—"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Alerte de rappel — entretiens à confirmer
// ─────────────────────────────────────────────────────────
function PendingAlert({ count, onClick }) {
  if (!count) return null;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors mb-6"
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <span>
        {count} entretien{count > 1 ? "s" : ""} en attente de votre confirmation
      </span>
      <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────
export default function ResponsableMetierInterviewList() {
  const router = useRouter();

  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  const LIMIT = 10;
  const debounceRef = useRef(null);

  // Debounce search
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

  // ── Fetch entretiens ──
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyInterviews({
        page,
        limit: LIMIT,
        status: statusFilter,
        search: debouncedSearch.trim(),
      });
      setInterviews(data.interviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getMyInterviewsStats();
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

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* ── En-tête ── */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Mes Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Liste de vos entretiens assignés
            </p>
          </div>

          <button
            onClick={() => { fetchInterviews(); fetchStats(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* ── Alerte entretiens en attente ── */}
        <PendingAlert
          count={stats?.PENDING_CONFIRMATION ?? 0}
          onClick={() => setStatusFilter("PENDING_CONFIRMATION")}
        />

        {/* ── Cartes statistiques ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[
            { key: "ALL", label: "Total", icon: <Briefcase className="w-5 h-5" /> },
            { key: "PENDING_CONFIRMATION", label: "À confirmer", icon: <Clock3 className="w-5 h-5" /> },
            { key: "CONFIRMED", label: "Confirmés", icon: <CheckCircle2 className="w-5 h-5" /> },
            { key: "CANDIDATE_REQUESTED_RESCHEDULE", label: "Report demandé", icon: <RefreshCcw className="w-5 h-5" /> },
            { key: "CANCELLED", label: "Annulés", icon: <XCircle className="w-5 h-5" /> },
          ].map(({ key, label, icon }) => (
            <StatCard
              key={key}
              label={label}
              value={statsLoading ? "…" : getStatusCount(stats, key)}
              active={statusFilter === key}
              onClick={() => setStatusFilter(key)}
              icon={icon}
            />
          ))}
        </div>

        {/* ── Barre de recherche ── */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-5 transition-colors">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Filtres statuts ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => {
              const cfg = s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#6CB33F] hover:bg-[#4E8F2F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {cfg?.dot ? (
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : cfg.dot}`} />
                  ) : null}
                  {cfg?.short || s}
                </button>
              );
            })}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${total} résultat${total > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* ── État : chargement ── */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Chargement de vos entretiens...
              </p>
            </div>
          </div>
        )}

        {/* ── État : erreur ── */}
        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
                Erreur de chargement
              </p>
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
              <button
                onClick={fetchInterviews}
                className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold hover:bg-[#4E8F2F] transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── État : liste vide ── */}
        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">
                Aucun entretien trouvé
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {search
                  ? "Aucun résultat pour cette recherche."
                  : statusFilter !== "ALL"
                  ? "Aucun entretien pour ce statut."
                  : "Vous n'avez pas encore d'entretiens assignés."}
              </p>
            </div>
          </div>
        )}

        {/* ── Tableau ── */}
        {!loading && !error && interviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {["Candidat", "Poste", "Type", "Date & heure", "Statut", ""].map((h) => (
                      <th
                        key={h}
                        className="px-6 lg:px-8 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {interviews.map((iv) => {
                    const isExpanded = expandedRow === iv._id;
                    const statusCfg = STATUS_CONFIG[iv.status] || {};
                    const typeCfg = TYPE_CONFIG[iv.interviewType] || TYPE_CONFIG.RH;
                    const isCancelled = iv.status === "CANCELLED";

                    // Date active à afficher
                    const displayDate = iv.confirmedDate || iv.proposedDate;
                    const displayTime = iv.confirmedDate ? iv.confirmedTime : iv.proposedTime;

                    return (
                      <React.Fragment key={iv._id}>
                        <tr
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : iv._id)
                          }
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-green-50/30 dark:bg-gray-900/30"
                              : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                          } ${isCancelled ? "opacity-60" : ""}`}
                        >
                          {/* Candidat */}
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={iv.candidateName} />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                  {iv.candidateName || "—"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  {iv.candidateEmail || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Poste */}
                          <td className="px-6 lg:px-8 py-5">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {iv.jobTitle || "—"}
                              </span>
                            </span>
                          </td>

                          {/* Type d'entretien */}
                          <td className="px-6 lg:px-8 py-5">
                            <Badge
                              label={typeCfg.label}
                              className={`${typeCfg.cls} border`}
                            />
                          </td>

                          {/* Date & heure */}
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
                                <Calendar className="w-4 h-4 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
                                {formatDate(displayDate)}
                              </span>
                              {displayTime && (
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs ml-6">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  {displayTime}
                                </span>
                              )}
                              {/* Alerte report candidat */}
                              {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs ml-6 font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>
                                    Report : {formatDate(iv.candidateProposedDate)}{" "}
                                    {iv.candidateProposedTime}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Statut */}
                          <td className="px-6 lg:px-8 py-5">
                            <Badge
                              label={statusCfg.short || iv.status}
                              className={statusCfg.color || ""}
                              dotClass={statusCfg.dot || ""}
                            />
                          </td>

                          {/* Chevron */}
                          <td className="px-6 lg:px-8 py-5 text-right">
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </td>
                        </tr>

                        {/* ── Ligne expandée ── */}
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 lg:px-8 pb-6 bg-green-50/20 dark:bg-gray-900/20"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
                                <DetailCard
                                  label="Email candidat"
                                  value={iv.candidateEmail}
                                />
                                <DetailCard
                                  label="Date proposée"
                                  value={`${formatDate(iv.proposedDate)} ${iv.proposedTime || ""}`}
                                />
                                <DetailCard
                                  label="Date confirmée"
                                  value={
                                    iv.confirmedDate
                                      ? `${formatDate(iv.confirmedDate)} ${iv.confirmedTime || ""}`
                                      : "Non confirmée"
                                  }
                                />
                                <DetailCard label="Poste" value={iv.jobTitle} />
                                <DetailCard label="Notes" value={iv.notes || "Aucune note"} />

                                {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                  <>
                                    <DetailCard
                                      label="Date proposée par le candidat"
                                      value={`${formatDate(iv.candidateProposedDate)} ${iv.candidateProposedTime || ""}`}
                                    />
                                    <DetailCard
                                      label="Raison du report"
                                      value={iv.candidateRescheduleReason || "Non précisée"}
                                    />
                                  </>
                                )}

                                {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                  <DetailCard
                                    label="Votre nouvelle date (en attente admin)"
                                    value={`${formatDate(iv.responsableProposedDate)} ${iv.responsableProposedTime || ""}`}
                                  />
                                )}
                              </div>

                              {/* ── Actions ── */}
                              <div className="mt-5 flex flex-wrap gap-3">

                                {/* Confirmer / Modifier la date */}
                                {(iv.status === "PENDING_CONFIRMATION" ||
                                  iv.status === "CANDIDATE_REQUESTED_RESCHEDULE") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/ResponsableMetier/confirm-interview/${iv.confirmationToken}`
                                      );
                                    }}
                                    className="px-4 py-2 rounded-full bg-[#E9F5E3] dark:bg-emerald-950/30 border border-[#cfe4c4] dark:border-emerald-700 text-[#4E8F2F] dark:text-emerald-300 font-semibold text-sm hover:bg-[#d7ebcf] dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-2"
                                  >
                                    <Send className="w-4 h-4" />
                                    {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE"
                                      ? "Répondre au report"
                                      : "Confirmer / Modifier"}
                                  </button>
                                )}

                                {/* Fiche d'évaluation */}
                                {(iv.status === "CONFIRMED" ||
                                  iv.status === "PENDING_CANDIDATE_CONFIRMATION") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/ResponsableMetier/interviews/${iv._id}/evaluation`
                                      );
                                    }}
                                    className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold text-sm transition-colors flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Fiche d'évaluation
                                  </button>
                                )}

                                {/* Voir candidature */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/ResponsableMetier/candidatures/${iv.candidatureId}`
                                    );
                                  }}
                                  className="px-4 py-2 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm transition-colors flex items-center gap-2"
                                >
                                  <User className="w-4 h-4" />
                                  Voir candidature
                                </button>
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

        {/* ── Pagination ── */}
        {!loading && !error && interviews.length > 0 && totalPages > 1 && (
          <div className="mt-6 px-4 sm:px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">
              Page {page} sur {totalPages} — Total : {total} entretien
              {total > 1 ? "s" : ""}
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
                  className={`w-10 h-10 rounded-full border font-bold transition-colors ${
                    p === page
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