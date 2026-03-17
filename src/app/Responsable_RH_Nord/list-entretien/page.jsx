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
  PhoneCall,
} from "lucide-react";
import {
  getMyInterviewsStats,
  getMyTelephoniqueInterviews,
} from "../../services/interviewApi";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────
//  STATUTS
// ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "En attente de votre confirmation",
    short: "À confirmer",
    color: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente confirmation candidat",
    short: "Attente candidat",
    color: "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/30",
    dot: "bg-sky-500",
  },
  CONFIRMED: {
    label: "Confirmé",
    short: "Confirmé",
    color: "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  CANDIDATE_REQUESTED_RESCHEDULE: {
    label: "Candidat demande un report",
    short: "Report demandé",
    color: "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30",
    dot: "bg-orange-500",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "En attente d'approbation admin",
    short: "Attente admin",
    color: "text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30",
    dot: "bg-violet-500",
  },
  MODIFIED: {
    label: "Modifié",
    short: "Modifié",
    color: "text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30",
    dot: "bg-indigo-500",
  },
  RESCHEDULED: {
    label: "Reprogrammé",
    short: "Reprogrammé",
    color: "text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30",
    dot: "bg-blue-500",
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
  "RH + Tech": {
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
  telephonique: {
    label: "Téléphonique",
    cls: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700",
  },
  // ✅ AJOUTS — entretiens créés par RH Nord
  NORD: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
  entretien_nord: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
};

const STATUS_FILTERS = [
  "ALL",
  "CONFIRMED",
  "PENDING_CANDIDATE_CONFIRMATION",
  "CANDIDATE_REQUESTED_RESCHEDULE",
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

function isRHTechInterview(interviewType) {
  const type = String(interviewType || "").toLowerCase();
  return type.includes("rh") && type.includes("tech");
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
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${className}`}>
      {dotClass ? <span className={`w-2 h-2 rounded-full ${dotClass}`} /> : null}
      {label}
    </span>
  );
}

function StatCard({ label, value, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors shadow-sm ${active
        ? "bg-[#E9F5E3] dark:bg-gray-700 border-[#cfe4c4] dark:border-gray-600"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50/40 dark:hover:bg-gray-700/60"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#4E8F2F] dark:text-emerald-400">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">{label}</div>
    </button>
  );
}

function DetailCard({ label, value, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors">
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      {children ? children : (
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{value || "—"}</div>
      )}
    </div>
  );
}

function PendingAlert({ count, onClick }) {
  if (!count) return null;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors mb-6"
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <span>{count} entretien{count > 1 ? "s" : ""} en attente de votre confirmation</span>
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
  const [confirmingRhNordId, setConfirmingRhNordId] = useState(null);
  const [confirmedRhNordIds, setConfirmedRhNordIds] = useState(new Set());

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

  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Entretiens RH Nord planifiés
      let rhNordList = [];
      try {
        const params = new URLSearchParams({ page, limit: LIMIT });
        if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
        if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

        const rhNordRes = await api.get(`/api/interviewNord/interview-nord/list?${params}`);
        rhNordList = rhNordRes.data?.interviews || [];
      } catch (rhErr) {
        console.error("❌ Erreur chargement entretiens RH Nord:", rhErr);
      }

      // 2. Entretiens téléphoniques confirmés
      let telList = [];
      try {
        const telData = await getMyTelephoniqueInterviews({
          page: 1,
          limit: 50,
          search: debouncedSearch.trim(),
        });
        telList = telData.interviews || [];

        if (statusFilter !== "ALL" && statusFilter !== "CONFIRMED") {
          telList = [];
        }
      } catch (telErr) {
        console.error("❌ Erreur chargement téléphoniques:", telErr);
      }

      // 3. Fusion
      const telByCandidatureId = {};
      for (const tel of telList) {
        const key = String(tel.candidatureId || tel._id);
        telByCandidatureId[key] = tel;
      }

      const enrichedRhNord = rhNordList.map((iv) => {
        const key = iv.candidatureId ? String(iv.candidatureId) : null;
        const tel = key ? telByCandidatureId[key] : null;
        if (tel) {
          delete telByCandidatureId[key];
          return { ...iv, _telEntry: tel };
        }
        return iv;
      });

      const remainingTel = Object.values(telByCandidatureId);

      const merged = [...enrichedRhNord, ...remainingTel].sort((a, b) => {
        const da = new Date(a.confirmedDate || a.proposedDate || a.confirmedAt || 0);
        const db = new Date(b.confirmedDate || b.proposedDate || b.confirmedAt || 0);
        return db - da;
      });

      setInterviews(merged);
      setTotal(merged.length);
      setTotalPages(Math.ceil(merged.length / LIMIT) || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

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

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleConfirmRhNord = useCallback(async (e, iv) => {
    e.stopPropagation();
    const candidatureId = iv.candidatureId || iv._id;
    if (!candidatureId) return;
    setConfirmingRhNordId(iv._id);
    try {
      await api.patch(`/api/interviews/candidatures/${candidatureId}/confirm-rh-nord`);
      // ✅ Persiste définitivement dans le Set — pas de timeout
      setConfirmedRhNordIds((prev) => new Set([...prev, iv._id]));
    } catch (err) {
      console.error("❌ Erreur confirmation RH Nord:", err);
      alert(err?.response?.data?.message || "Erreur lors de la confirmation.");
    } finally {
      setConfirmingRhNordId(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">

        {/* En-tête */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Mes Entretiens</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Entretiens RH + Tech &amp; Téléphoniques assignés</p>
          </div>
        </div>

        <PendingAlert count={stats?.PENDING_CONFIRMATION ?? 0} onClick={() => setStatusFilter("PENDING_CONFIRMATION")} />

        {/* Recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
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

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {STATUS_FILTERS.map((s) => {
              const cfg = s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs font-semibold transition-colors ${isActive
                    ? "bg-[#6CB33F] hover:bg-[#4E8F2F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {cfg?.dot ? <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : cfg.dot}`} /> : null}
                  {cfg?.short || s}
                </button>
              );
            })}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${total} résultat${total > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Chargement */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Chargement de vos entretiens...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">Erreur de chargement</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              <button onClick={fetchInterviews} className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm hover:bg-[#4E8F2F] transition-colors">Réessayer</button>
            </div>
          </div>
        )}

        {/* Vide */}
        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">Aucun entretien trouvé</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {search ? "Aucun résultat pour cette recherche."
                  : statusFilter !== "ALL" ? "Aucun entretien pour ce statut."
                  : "Vous n'avez pas d'entretiens assignés."}
              </p>
            </div>
          </div>
        )}

        {/* ── Tableau ── */}
        {!loading && !error && interviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1280px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["Candidat", "Poste", "Type", "Date & heure", "Évaluation", "Statut", ""].map((h) => (
                      <th key={h} className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {interviews.map((iv) => {
                    const isExpanded = expandedRow === iv._id;
                    const isTelephonique = iv._isTelephonique === true || iv.interviewType === "telephonique";
                    const isRHTech = isRHTechInterview(iv.interviewType);

                    // ✅ FIX — inclure NORD et entretien_nord
                    const isRHSimple =
                      iv.interviewType === "RH"             ||
                      iv.interviewType === "rh"             ||
                      iv.interviewType === "NORD"           ||
                      iv.interviewType === "entretien_nord" ||
                      iv.type === "entretien_nord";

                    const hasBoth = !isTelephonique && !!iv._telEntry;

                    const statusCfg = STATUS_CONFIG[iv.status] || {};

                    // ✅ FIX — fallback sur iv.type si iv.interviewType non reconnu
                    const typeCfg = isTelephonique
                      ? TYPE_CONFIG.telephonique
                      : (TYPE_CONFIG[iv.interviewType] || TYPE_CONFIG[iv.type] || TYPE_CONFIG.RH);

                    const isCancelled = iv.status === "CANCELLED";

                    const displayDate = iv.confirmedDate || iv.proposedDate || iv.confirmedAt || iv.proposedStart;
                    const displayTime = iv.confirmedDate
                      ? iv.confirmedTime
                      : (iv.proposedTime || (iv.proposedStart
                        ? new Date(iv.proposedStart).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                        : null));

                    // ✅ FIX — showEvalRH inclut RESCHEDULED
                    const showEvalRH =
                      (isRHSimple || isRHTech) &&
                      ["CONFIRMED", "PENDING_CANDIDATE_CONFIRMATION", "RESCHEDULED"].includes(iv.status);

                    const showEvalTel = isTelephonique;
                    const showEval = showEvalRH || showEvalTel || hasBoth;

                    const evalUrlRH = isRHTech
                      ? `/Responsable_RH_Nord/interviews/${iv._id}/evaluation?type=rh_tech`
                      : `/Responsable_RH_Nord/interviews/${iv._id}/evaluation?type=rh`;

                    const evalUrlTel = isTelephonique
                      ? `/Responsable_RH_Nord/interviews/${iv._id}/evaluation-telephonique`
                      : iv._telEntry
                        ? `/Responsable_RH_Nord/interviews/${iv._telEntry._id}/evaluation-telephonique`
                        : null;

                    return (
                      <React.Fragment key={iv._id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : iv._id)}
                          className={`hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${isExpanded ? "bg-green-50/30 dark:bg-gray-700/30" : ""} ${isCancelled ? "opacity-60" : ""}`}
                        >
                          {/* Candidat */}
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={iv.candidateName} />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm">{iv.candidateName || "—"}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{iv.candidateEmail || "—"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Poste */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[100px] sm:max-w-[140px]">{iv.jobTitle || "—"}</span>
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5">
                            <div className="flex flex-col gap-1.5">
                              <Badge label={typeCfg.label} className={`${typeCfg.cls} border text-xs`} />
                              {hasBoth && (
                                <Badge label="Téléphonique" className={`${TYPE_CONFIG.telephonique.cls} border text-xs`} />
                              )}
                            </div>
                          </td>

                          {/* Date & heure */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-xs sm:text-sm">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
                                {formatDate(displayDate)}
                              </span>
                              {displayTime && (
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs ml-5 sm:ml-6">
                                  <Clock3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  {displayTime}
                                </span>
                              )}
                              {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs ml-5 sm:ml-6 font-semibold">
                                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>{formatDate(iv.candidateProposedDate)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Évaluation */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5">
                            <div className="flex flex-col gap-1.5">
                              {(showEvalRH || hasBoth) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); router.push(evalUrlRH); }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap ${
                                    isRHTech
                                      ? "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                                      : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  {isRHTech ? "RH + Tech" : "RH"}
                                </button>
                              )}
                              {(showEvalTel || hasBoth) && evalUrlTel && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); router.push(evalUrlTel); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  Téléphonique
                                </button>
                              )}
                              {!showEval && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>

                          {/* Statut */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5">
                            <Badge
                              label={statusCfg.short || iv.status}
                              className={`${statusCfg.color || ""} text-xs`}
                              dotClass={statusCfg.dot || ""}
                            />
                          </td>

                          {/* Chevron */}
                          <td className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 text-right">
                            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                        </tr>

                        {/* ── Ligne expandée ── */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6 bg-green-50/20 dark:bg-gray-900/20">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pt-4">
                                <DetailCard label="Poste" value={iv.jobTitle} />

                                {isTelephonique && (
                                  <DetailCard
                                    label="Type d'entretien"
                                    value="Entretien Téléphonique — confirmé par RH Nord"
                                  />
                                )}

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

                              <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                                {!isTelephonique && (iv.status === "PENDING_CONFIRMATION" || iv.status === "CANDIDATE_REQUESTED_RESCHEDULE") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/ResponsableMetier/confirm-interview/${iv.confirmationToken}`);
                                    }}
                                    className="px-3 sm:px-4 py-2 rounded-full bg-[#E9F5E3] dark:bg-emerald-950/30 border border-[#cfe4c4] dark:border-emerald-700 text-[#4E8F2F] dark:text-emerald-300 font-semibold text-xs sm:text-sm hover:bg-[#d7ebcf] dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-2"
                                  >
                                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" ? "Répondre" : "Confirmer"}
                                  </button>
                                )}

                                {/* ✅ Bouton Confirmer candidat — RH Nord — uniquement PENDING_CANDIDATE_CONFIRMATION */}
                                {!isTelephonique && iv.status === "PENDING_CANDIDATE_CONFIRMATION" && (
                                  (confirmedRhNordIds.has(iv._id) || iv.rhNordConfirmed) ? (
                                    <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm">
                                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      Candidat confirmé
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => handleConfirmRhNord(e, iv)}
                                      disabled={confirmingRhNordId === iv._id}
                                      className="px-3 sm:px-4 py-2 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-[#6CB33F] dark:border-emerald-600 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {confirmingRhNordId === iv._id ? (
                                        <>
                                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                          En cours...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          Confirmer candidat
                                        </>
                                      )}
                                    </button>
                                  )
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

        {/* Pagination */}
        {!loading && !error && interviews.length > 0 && totalPages > 1 && (
          <div className="mt-6 sm:mt-8 px-3 sm:px-4 md:px-8 py-4 sm:py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">Page {page} sur {totalPages} — Total : {total} entretien{total > 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >← Préc.</button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border font-bold text-xs sm:text-sm transition-colors ${
                    p === page
                      ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >{p}</button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors"
              >Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}