"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Briefcase, CheckCircle2, Clock3, XCircle,
  ChevronDown, ChevronRight, FileText, X, AlertTriangle, Send,
  Trophy, ClipboardList, Loader2, BarChart2, CheckCheck, CircleX,
} from "lucide-react";
import { getMyInterviews, getMyInterviewsStats } from "../../services/interviewApi";
import api from "../../services/api";

const getFicheSubmissionsByCandidature = (candidatureId) =>
  api.get(`/fiche-submissions/candidature/${candidatureId}`);

// ✅ FIX : récupère les soumissions quiz d'une candidature
const getQuizSubmissionsByCandidature = (candidatureId) =>
  api.get(`/quiz-submissions/candidature/${candidatureId}`);

const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "En attente de votre confirmation",
    short: "À confirmer",
    color: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  PENDING_MANAGER_CONFIRMATION: {
    label: "En attente de confirmation manager",
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
  CANCELLED: {
    label: "Annulé",
    short: "Annulé",
    color: "text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
};

const TYPE_CONFIG = {
  RH: { label: "Entretien RH", cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600" },
  rh: { label: "Entretien RH", cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600" },
  rh_technique: { label: "RH + Tech", cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700" },
  "RH + Tech": { label: "RH + Tech", cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700" },
  TECHNIQUE: { label: "Technique", cls: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-700" },
  DGA: { label: "DGA", cls: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-700" },
};

const STATUS_FILTERS = [
  "ALL",
  "PENDING_CONFIRMATION",
  "PENDING_MANAGER_CONFIRMATION",
  "CONFIRMED",
  "PENDING_CANDIDATE_CONFIRMATION",
  "CANDIDATE_REQUESTED_RESCHEDULE",
  "CANCELLED",
];

function formatDate(d) {
  if (!d) return "—";
  const raw = d?.$date ?? d;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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
    <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <span>{count} entretien{count > 1 ? "s" : ""} en attente de votre confirmation</span>
      <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
    </button>
  );
}

function ScoreCircle({ percentage }) {
  const pct = Math.min(100, Math.max(0, percentage ?? 0));
  const color = pct >= 70 ? "text-emerald-600 dark:text-emerald-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const ring = pct >= 70 ? "border-emerald-400 dark:border-emerald-500" : pct >= 40 ? "border-amber-400 dark:border-amber-500" : "border-red-400 dark:border-red-500";
  return (
    <div className={`w-14 h-14 rounded-full border-4 ${ring} flex items-center justify-center flex-shrink-0`}>
      <span className={`text-base font-extrabold ${color}`}>{pct}%</span>
    </div>
  );
}

// ✅ FIX COMPLET : QuizResultCard avec gestion d'erreur robuste
function QuizResultCard({ candidatureId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null); // ✅ distingue "pas soumis" de "erreur"

  useEffect(() => {
    // ✅ FIX : si candidatureId est absent ou invalide, on arrête immédiatement
    if (!candidatureId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    getQuizSubmissionsByCandidature(candidatureId)
      .then((res) => {
        // ✅ FIX : res est la réponse axios → res.data est le tableau
        // On accepte aussi le cas où res est directement un tableau (defensive)
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setData(list[0] ?? null);
      })
      .catch((err) => {
        // ✅ FIX : on stocke l'erreur au lieu de silencieusement mettre null
        // Cela évite d'afficher "Pas encore soumis" quand c'est un 403/500
        const status = err?.response?.status;
        if (status === 403) {
          setFetchError("Accès non autorisé");
        } else if (status === 404) {
          setFetchError(null); // vraiment pas de soumission
        } else {
          setFetchError("Erreur de chargement");
        }
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [candidatureId]);

  // ✅ Cas : candidatureId manquant dans l'objet interview
  if (!candidatureId) {
    return (
      <DetailCard label="Résultat Quiz">
        <div className="flex items-center gap-2 text-amber-500 text-xs py-1">
          <AlertTriangle className="w-4 h-4" />
          <span>ID candidature manquant</span>
        </div>
      </DetailCard>
    );
  }

  return (
    <DetailCard label="Résultat Quiz">
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement…
        </div>
      ) : fetchError ? (
        // ✅ FIX : affiche l'erreur réelle au lieu de "Pas encore soumis"
        <div className="flex items-center gap-2 text-red-400 text-xs py-1">
          <XCircle className="w-4 h-4" />
          <span>{fetchError}</span>
        </div>
      ) : !data ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <BarChart2 className="w-4 h-4" />
          <span>Pas encore soumis</span>
        </div>
      ) : (
        <div className="space-y-3 mt-1">
          <div className="flex items-center gap-3">
            <ScoreCircle percentage={data.percentage} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {data.score ?? "—"} / {data.totalQuestions ?? "—"} bonnes réponses
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Soumis le {formatDate(data.submittedAt)}
              </p>
             
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/ResponsableMetier/list-entretien/${candidatureId}/quiz-result`);
            }}
            className="w-full mt-1 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-3.5 h-3.5" />
            Voir détails
          </button>
        </div>
      )}
    </DetailCard>
  );
}

function FicheResultCard({ candidatureId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!candidatureId) { setLoading(false); return; }
    getFicheSubmissionsByCandidature(candidatureId)
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const submitted = list.find((s) => s.status === "SUBMITTED") ?? list[0] ?? null;
        setData(submitted);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [candidatureId]);
  return (
    <DetailCard label="Fiche de renseignement">
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>
      ) : !data ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1"><ClipboardList className="w-4 h-4" /><span>Non remplie</span></div>
      ) : (
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${data.status === "SUBMITTED" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300"}`}>
              {data.status === "SUBMITTED" ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
              {data.status === "SUBMITTED" ? "Soumise" : "En cours"}
            </span>
            {data.status === "SUBMITTED" && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(data.finishedAt)}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/ResponsableMetier/list-entretien/${candidatureId}/fiche-result`); }}
            className="w-full mt-1 px-3 py-2 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold text-xs hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-3.5 h-3.5" />Voir détails
          </button>
        </div>
      )}
    </DetailCard>
  );
}

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

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchInterviews = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getMyInterviews({ page, limit: LIMIT, status: statusFilter, search: debouncedSearch.trim() });
      const filteredInterviews = (data.interviews || []).filter((iv) => isRHTechInterview(iv.interviewType));
      setInterviews(filteredInterviews);
      setTotal(filteredInterviews.length);
      setTotalPages(Math.ceil(filteredInterviews.length / LIMIT) || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try { const data = await getMyInterviewsStats(); setStats(data.data || {}); }
    catch (_) { setStats(null); }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const pendingCount = (stats?.PENDING_CONFIRMATION ?? 0) + (stats?.PENDING_MANAGER_CONFIRMATION ?? 0);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Mes Entretiens</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Entretiens RH + Tech assignés</p>
          </div>
        </div>

        <PendingAlert count={pendingCount} onClick={() => setStatusFilter("PENDING_CONFIRMATION")} />

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

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {STATUS_FILTERS.map((s) => {
              const cfg = s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
              const isActive = statusFilter === s;
              if (s === "PENDING_MANAGER_CONFIRMATION" && !stats?.PENDING_MANAGER_CONFIRMATION) return null;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs font-semibold transition-colors ${isActive ? "bg-[#6CB33F] hover:bg-[#4E8F2F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"}`}>
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

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Chargement de vos entretiens...</p>
            </div>
          </div>
        )}

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

        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="flex flex-col items-center justify-center gap-4">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">Aucun entretien trouvé</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {search ? "Aucun résultat pour cette recherche." : statusFilter !== "ALL" ? "Aucun entretien pour ce statut." : "Vous n'avez pas d'entretiens RH + Tech assignés."}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1180px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["Candidat", "Poste", "Type", "Date & heure", "Statut", ""].map((h) => (
                      <th key={h} className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {interviews.map((iv) => {
                    const isExpanded = expandedRow === iv._id;
                    const statusCfg = STATUS_CONFIG[iv.status] || { short: iv.status, color: "text-gray-600 border-gray-200 bg-gray-50", dot: "bg-gray-400" };
                    const typeCfg = TYPE_CONFIG[iv.interviewType] || TYPE_CONFIG.RH;
                    const isCancelled = iv.status === "CANCELLED";
                    const displayDate = iv.confirmedDate || iv.proposedDate || iv.date || iv.scheduledDate || iv.slotDate || iv.createdAt;
                    const displayTime = iv.confirmedDate ? iv.confirmedTime : iv.proposedTime || iv.time || iv.slotTime;
                    const needsConfirmation = iv.status === "PENDING_CONFIRMATION" || iv.status === "PENDING_MANAGER_CONFIRMATION" || iv.status === "CANDIDATE_REQUESTED_RESCHEDULE";

                    // ✅ FIX : candidatureId peut être stocké sous différents noms selon l'API
                    const candidatureId =
                      iv.candidatureId ||
                      iv.candidature_id ||
                      iv.candidature?._id ||
                      iv.candidature?.id ||
                      null;

                    return (
                      <React.Fragment key={iv._id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : iv._id)}
                          className={`hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${isExpanded ? "bg-green-50/30 dark:bg-gray-700/30" : ""} ${isCancelled ? "opacity-60" : ""}`}
                        >
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={iv.candidateName} />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{iv.candidateName || "—"}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{iv.candidateEmail || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{iv.jobTitle || "—"}</span>
                            </span>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <Badge label={typeCfg.label} className={`${typeCfg.cls} border text-xs`} />
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
                                <Calendar className="w-4 h-4 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
                                {formatDate(displayDate)}
                              </span>
                              {displayTime && (
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs ml-6">
                                  <Clock3 className="w-3.5 h-3.5" />{displayTime}
                                </span>
                              )}
                              {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs ml-6 font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>{formatDate(iv.candidateProposedDate)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            <Badge label={statusCfg.short || iv.status} className={`${statusCfg.color || ""} text-xs`} dotClass={statusCfg.dot || ""} />
                          </td>
                          <td className="px-6 lg:px-8 py-5 text-right">
                            <ChevronDown className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 lg:px-8 pb-6 bg-green-50/20 dark:bg-gray-900/20">
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4">
                                <DetailCard label="Poste" value={iv.jobTitle} />
                                {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                  <>
                                    <DetailCard label="Date proposée par le candidat" value={`${formatDate(iv.candidateProposedDate)} ${iv.candidateProposedTime || ""}`} />
                                    <DetailCard label="Raison du report" value={iv.candidateRescheduleReason || "Non précisée"} />
                                  </>
                                )}
                                {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                  <DetailCard label="Votre nouvelle date (en attente admin)" value={`${formatDate(iv.responsableProposedDate)} ${iv.responsableProposedTime || ""}`} />
                                )}
                                {isRHTechInterview(iv.interviewType) && (iv.status === "CONFIRMED" || iv.status === "PENDING_CANDIDATE_CONFIRMATION") && (
                                  <DetailCard label="Évaluation">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); router.push(`/ResponsableMetier/interviews/${iv._id}/evaluation`); }}
                                      className="w-full px-3 py-2 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold text-sm hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <FileText className="w-4 h-4" />Fiche d'évaluation
                                    </button>
                                  </DetailCard>
                                )}
                                {/* ✅ FIX : on passe le candidatureId résolu */}
                                <QuizResultCard candidatureId={candidatureId} />
                                <FicheResultCard candidatureId={candidatureId} />
                              </div>
                              <div className="mt-5 flex flex-wrap gap-3">
                                {needsConfirmation && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/ResponsableMetier/confirm-interview/${iv.confirmationToken}`); }}
                                    className="px-4 py-2 rounded-full bg-[#E9F5E3] dark:bg-emerald-950/30 border border-[#cfe4c4] dark:border-emerald-700 text-[#4E8F2F] dark:text-emerald-300 font-semibold text-sm hover:bg-[#d7ebcf] dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-2"
                                  >
                                    <Send className="w-4 h-4" />
                                    {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" ? "Répondre" : "Confirmer"}
                                  </button>
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
          <div className="mt-8 px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">Page {page} sur {totalPages} — Total : {total} entretien{total > 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm disabled:opacity-50 transition-colors">← Préc.</button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full border font-bold text-sm transition-colors ${p === page ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm disabled:opacity-50 transition-colors">Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}