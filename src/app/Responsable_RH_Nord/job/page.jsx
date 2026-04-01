"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/Pagination";

import {
  createJob,
  getMyOffers,
  updateMyJob,
} from "../../services/job.api";

import {
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CalendarClock,
  CalendarCheck,
  MapPin,
  Tag,
  BrainCircuit,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
}

function getJobStatus(job) {
  const s = (job?.status || "").toString().toUpperCase().trim();
  if (["CONFIRMEE", "REJETEE", "EN_ATTENTE", "VALIDEE"].includes(s)) return s;
  return "EN_ATTENTE";
}

const CONTRACT_OPTIONS = [
  { value: "", label: "Type de contrat" },
  { value: "CDD", label: "CDD" },
  { value: "CDI", label: "CDI" },
  { value: "CIVP", label: "CIVP" },
];

const STAGE_CONTRAT_OPTIONS = [
  { value: "", label: "Type de stage" },
  { value: "STAGE_PFE", label: "Stage PFE" },
  { value: "STAGE_ETE", label: "Stage d'été" },
  { value: "STAGE_INITIATION", label: "Stage d'initiation" },
  { value: "ALTERNANCE", label: "Alternance" },
];

const MOTIF_OPTIONS = [
  { value: "", label: "Motif" },
  { value: "NOUVEAU", label: "Nouveau poste" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "RENFORT", label: "Renfort" },
];

const SEXE_OPTIONS = [
  { value: "", label: "Genre" },
  { value: "H", label: "H" },
  { value: "F", label: "F" },
  { value: "HF", label: "H/F" },
];

const DUREE_STAGE_OPTIONS = [
  { value: "", label: "Durée du stage" },
  { value: "1_MOIS", label: "1 mois" },
  { value: "2_MOIS", label: "2 mois" },
  { value: "3_MOIS", label: "3 mois" },
  { value: "4_MOIS", label: "4 mois" },
  { value: "5_MOIS", label: "5 mois" },
  { value: "6_MOIS", label: "6 mois" },
];

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG = {
  CONFIRMEE: {
    label: "Publiée",
    bg: "bg-green-100 dark:bg-emerald-900/30",
    text: "text-green-700 dark:text-emerald-400",
    border: "border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
    cardBorder: "border-green-200 dark:border-emerald-800",
  },
  VALIDEE: {
    label: "Validée",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
    cardBorder: "border-blue-200 dark:border-blue-800",
  },
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    cardBorder: "border-amber-700 dark:border-amber-500/40",
  },
  REJETEE: {
    label: "Rejetée",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    icon: XCircle,
    cardBorder: "border-red-300 dark:border-red-700",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

/* ================= TYPE OFFRE BADGE ================= */
function TypeOffreBadge({ typeOffre }) {
  const isStage = (typeOffre || "").toUpperCase() === "STAGE";
  return isStage ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      Stage
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      Emploi
    </span>
  );
}

/* ================= FILTERS ================= */
const STATUS_TABS = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "VALIDEE", label: "Validées" },
  { key: "CONFIRMEE", label: "Publiées" },
  { key: "REJETEE", label: "Rejetées" },
];

const TYPE_OFFRE_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "JOB", label: "Recrutement" },
  { key: "STAGE", label: "Stages" },
];

/* =================================================================
   PAGE
================================================================= */
export default function RHNordJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [typeOffreFilter, setTypeOffreFilter] = useState("all");
  const [expandedJobs, setExpandedJobs] = useState({});

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getMyOffers();
      const data = Array.isArray(res?.data) ? res.data : [];
      const sorted = data
        .map((j) => ({ ...j, _status: getJobStatus(j) }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setJobs(sorted);
    } catch (e) {
      console.error("Erreur chargement offres:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const detailsBase = "/Responsable_RH_Nord/job";

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  }

  const counts = useMemo(() => {
    const c = { all: jobs.length, EN_ATTENTE: 0, VALIDEE: 0, CONFIRMEE: 0, REJETEE: 0 };
    for (const j of jobs) {
      const s = j._status || getJobStatus(j);
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [jobs]);

  const typeOffreCounts = useMemo(() => {
    const t = { all: jobs.length, JOB: 0, STAGE: 0 };
    for (const j of jobs) {
      const type = (j.typeOffre || "JOB").toUpperCase();
      if (type === "STAGE") t.STAGE++;
      else t.JOB++;
    }
    return t;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let arr = [...jobs];
    if (typeOffreFilter !== "all") {
      arr = arr.filter((j) => {
        const type = (j.typeOffre || "JOB").toUpperCase();
        return typeOffreFilter === "STAGE" ? type === "STAGE" : type !== "STAGE";
      });
    }
    if (activeTab !== "all") {
      arr = arr.filter((j) => (j._status || getJobStatus(j)) === activeTab);
    }
    return arr;
  }, [jobs, activeTab, typeOffreFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => { setPage(1); }, [activeTab, typeOffreFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  async function handleCreate(payload) {
    await createJob(payload);
    setModalOpen(false);
    setEditingJob(null);
    await loadData();
  }

  async function handleUpdate(payload) {
    await updateMyJob(editingJob?._id, payload);
    setModalOpen(false);
    setEditingJob(null);
    await loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-4 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-16">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Mes Offres d'emploi
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">
              Gérez vos offres créées
            </p>
            <div className="mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-300">
              <p>Total : <span className="font-extrabold text-[#6CB33F]">{jobs.length}</span> offre(s)</p>
            </div>
          </div>

          <button
            onClick={() => { setEditingJob(null); setModalOpen(true); }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-extrabold shadow transition-colors
                       flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap"
          >
            <Plus size={16} /> Nouvelle offre
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl mb-8 overflow-hidden shadow-sm">

          {/* ROW 1 — Type d'offre */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 border-b border-gray-100 dark:border-gray-700/60 px-3 md:px-0">
            <div className="md:px-5 md:py-3.5 md:border-r border-gray-100 dark:border-gray-700/60 md:shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Type
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-0 md:px-4 py-3 md:py-2.5 flex-wrap">
              {TYPE_OFFRE_FILTERS.map((f) => {
                const active = typeOffreFilter === f.key;
                const count = f.key === "all" ? typeOffreCounts.all : typeOffreCounts[f.key] || 0;
                const colorActive =
                  f.key === "JOB"
                    ? "bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900"
                    : f.key === "STAGE"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-900 dark:bg-white text-white dark:text-gray-900";
                return (
                  <button
                    key={f.key}
                    onClick={() => setTypeOffreFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-150 flex-shrink-0 ${
                      active
                        ? colorActive
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {f.key === "JOB" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    )}
                    {f.key === "STAGE" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    )}
                    {f.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      active
                        ? "bg-white/20 dark:bg-black/20 text-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROW 2 — Statut */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 px-3 md:px-0">
            <div className="md:px-5 md:py-3.5 md:border-r border-gray-100 dark:border-gray-700/60 md:shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Statut
              </span>
            </div>
            <div className="flex items-center gap-1 md:gap-1 px-0 md:px-4 py-3 md:py-2.5 flex-wrap overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-150 flex-shrink-0 ${
                  activeTab === "all"
                    ? "bg-[#6CB33F] dark:bg-emerald-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Tous
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === "all"
                    ? "bg-white/25 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {counts.all}
                </span>
              </button>

              <span className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.key;
                const colorMap = {
                  EN_ATTENTE: active ? "bg-amber-500 text-white" : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
                  VALIDEE: active ? "bg-blue-500 text-white" : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  CONFIRMEE: active ? "bg-green-600 text-white" : "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
                  REJETEE: active ? "bg-red-500 text-white" : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                };
                const badgeColor = {
                  EN_ATTENTE: active ? "bg-white/25 text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                  VALIDEE: active ? "bg-white/25 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  CONFIRMEE: active ? "bg-white/25 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                  REJETEE: active ? "bg-white/25 text-white" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-150 flex-shrink-0 ${colorMap[tab.key]}`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${badgeColor[tab.key]}`}>
                      {counts[tab.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* JOBS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {paginatedJobs.map((job) => {
            const status = job._status || getJobStatus(job);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDesc = (job.description || "").length > 160;

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${cfg.cardBorder}`}
              >
                <div className="flex items-start justify-between gap-2 md:gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white truncate">
                      {job.titre || "Sans titre"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
                      <TypeOffreBadge typeOffre={job.typeOffre} />
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </div>

                {status === "REJETEE" && job.rejectionReason && (
                  <div className="rounded-lg md:rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 md:p-3 mb-3">
                    <p className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase mb-1">Motif du rejet</p>
                    <p className="text-xs md:text-sm text-red-700 dark:text-red-300 line-clamp-2">{job.rejectionReason}</p>
                  </div>
                )}

                <p className={`text-gray-700 dark:text-gray-200 text-xs md:text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}>
                  {job.description || "—"}
                </p>

                {hasLongDesc && (
                  <button
                    type="button"
                    onClick={() => toggleReadMore(job._id)}
                    className="text-xs md:text-sm text-[#4E8F2F] dark:text-emerald-400 font-extrabold hover:underline self-start mb-2"
                  >
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 my-3 md:my-4" />

                <div className="mt-auto relative">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 space-y-1 pr-28 md:pr-32">
                    {job.lieu && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="truncate">{job.lieu}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0 md:w-4 md:h-4" />
                      <span className="truncate">Créé : {formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0 md:w-4 md:h-4" />
                      <span className="truncate">Clôture : {formatDate(job.dateCloture)}</span>
                    </div>
                    {job.confirmedAt && (
                      <div className="flex items-center gap-2">
                        <CalendarCheck size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0 md:w-4 md:h-4" />
                        <span className="truncate">Confirmée : {formatDate(job.confirmedAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Link
                      href={`${detailsBase}/${job._id}`}
                      className="h-9 md:h-11 px-4 md:px-7 rounded-full font-extrabold text-xs md:text-sm inline-flex items-center justify-center
                                 bg-[#6CB33F] hover:bg-[#4E8F2F]
                                 dark:bg-emerald-600 dark:hover:bg-emerald-500
                                 text-white shadow-md shadow-green-500/20 transition-colors whitespace-nowrap"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-8 md:p-12 text-center">
              <Briefcase className="mx-auto w-8 md:w-10 h-8 md:h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold text-sm md:text-base">Aucune offre pour ce filtre.</p>
              <button
                onClick={() => { setEditingJob(null); setModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm
                           bg-[#6CB33F] hover:bg-[#4E8F2F]
                           dark:bg-emerald-600 dark:hover:bg-emerald-500
                           text-white font-extrabold transition-colors"
              >
                <Plus size={16} /> Proposer une offre
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 md:mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-300">
            <p>Total : {filteredJobs.length} — Page {page} / {totalPages}</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal */}
      <JobOfferModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingJob(null); }}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
      />
    </div>
  );
}


/* =================================================================
   MODAL — Create / Edit Job Offer
================================================================= */
function JobOfferModal({ open, onClose, onSubmit, initialData }) {
  const isEditing = !!initialData;

  const emptyForm = {
    typeOffre: "JOB",
    titre: "",
    description: "",
    lieu: "",
    dateCloture: "",
    salaire: "",
    nombrePostes: "",
    typeDiplome: "",
    typeContrat: "",
    motif: "",
    sexe: "",
    typeStage: "",
    dureeStage: "",
    hardSkills: "",
    softSkills: "",
    scores: {
      skillsFit: 30,
      experienceFit: 30,
      projectsFit: 20,
      educationFit: 10,
      communicationFit: 10,
    },
  };

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [numQuestions, setNumQuestions] = useState(25);

  const SCORE_ITEMS_MODAL = [
    { key: "skillsFit", label: "Skills Fit" },
    { key: "experienceFit", label: "Professional Experience Fit" },
    { key: "projectsFit", label: "Projects Fit & Impact" },
    { key: "educationFit", label: "Education / Certifications" },
    { key: "communicationFit", label: "Communication / Clarity signals" },
  ];

  const isStage = form.typeOffre === "STAGE";

  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      if (initialData) {
        setForm({
          typeOffre: initialData.typeOffre || "JOB",
          titre: initialData.titre || "",
          description: initialData.description || "",
          lieu: initialData.lieu || "",
          dateCloture: initialData.dateCloture ? String(initialData.dateCloture).slice(0, 10) : "",
          salaire: initialData.salaire || "",
          nombrePostes: initialData.nombrePostes || "",
          typeDiplome: initialData.typeDiplome || "",
          typeContrat: initialData.typeContrat || "",
          motif: initialData.motif || "",
          sexe: initialData.sexe || "",
          typeStage: initialData.typeStage || "",
          dureeStage: initialData.dureeStage || "",
          hardSkills: Array.isArray(initialData.hardSkills) ? initialData.hardSkills.join(", ") : initialData.hardSkills || "",
          softSkills: Array.isArray(initialData.softSkills) ? initialData.softSkills.join(", ") : initialData.softSkills || "",
          scores: {
            skillsFit: initialData?.scores?.skillsFit ?? 30,
            experienceFit: initialData?.scores?.experienceFit ?? 30,
            projectsFit: initialData?.scores?.projectsFit ?? 20,
            educationFit: initialData?.scores?.educationFit ?? 10,
            communicationFit: initialData?.scores?.communicationFit ?? 10,
          },
        });
        setGenerateQuiz(initialData.generateQuiz !== false);
        setNumQuestions(typeof initialData.numQuestions === "number" ? initialData.numQuestions : 25);
      } else {
        setForm(emptyForm);
        setGenerateQuiz(true);
        setNumQuestions(25);
      }
      setFormError("");
      setSubmitting(false);
    });
  }, [open, initialData]);

  if (!open) return null;

  const totalWeights = Object.values(form.scores || {}).reduce((sum, v) => sum + Number(v || 0), 0);
  const isValidTotal = totalWeights === 100;

  function setWeight(key, value) {
    setFormError("");
    let v = Number(value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: v } }));
  }

  function handleNumQuestions(val) {
    let n = parseInt(val, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 30) n = 30;
    setNumQuestions(n);
  }

  function parseSkills(str) {
    return String(str || "").split(",").map((t) => t.trim()).filter(Boolean);
  }

  function handleTypeOffreChange(type) {
    setForm((prev) => ({
      ...prev,
      typeOffre: type,
      typeContrat: "",
      motif: "",
      typeStage: "",
      dureeStage: "",
      salaire: "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.titre.trim()) return setFormError("❌ Le titre du poste est obligatoire.");
    if (!form.description.trim()) return setFormError("❌ La description est obligatoire.");
    if (!form.lieu.trim()) return setFormError("❌ Le lieu du poste est obligatoire.");
    if (!form.dateCloture) return setFormError("❌ La date de clôture est obligatoire.");
    if (!isStage && !isValidTotal) {
      return setFormError("❌ La somme des pondérations doit être égale à 100%.");
    }

    const payload = {
      typeOffre: form.typeOffre,
      titre: form.titre.trim(),
      description: form.description.trim(),
      lieu: form.lieu.trim(),
      dateCloture: form.dateCloture,
      hardSkills: parseSkills(form.hardSkills),
      softSkills: parseSkills(form.softSkills),
      ...(form.nombrePostes && { nombrePostes: form.nombrePostes }),
      ...(form.typeDiplome && { typeDiplome: form.typeDiplome }),
      ...(form.sexe && { sexe: form.sexe }),
      ...(form.typeOffre === "JOB" && {
        salaire: form.salaire || undefined,
        typeContrat: form.typeContrat || undefined,
        motif: form.motif || undefined,
        scores: {
          skillsFit: Number(form.scores.skillsFit) || 0,
          experienceFit: Number(form.scores.experienceFit) || 0,
          projectsFit: Number(form.scores.projectsFit) || 0,
          educationFit: Number(form.scores.educationFit) || 0,
          communicationFit: Number(form.scores.communicationFit) || 0,
        },
        generateQuiz: !isEditing && generateQuiz,
        numQuestions: !isEditing && generateQuiz ? numQuestions : 0,
      }),
      ...(form.typeOffre === "STAGE" && {
        typeStage: form.typeStage || undefined,
        dureeStage: form.dureeStage || undefined,
      }),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      console.error("Erreur submit modal:", err);
      setFormError("❌ Une erreur est survenue. Vérifie les champs et réessaie.");
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 rounded-lg sm:rounded-xl md:rounded-full " +
    "border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 " +
    "text-gray-800 dark:text-gray-100 text-sm " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:border-[#6CB33F] dark:focus:border-emerald-500 " +
    "focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 " +
    "outline-none transition-colors";

  const selectBase =
    "w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 rounded-lg sm:rounded-xl md:rounded-full " +
    "border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 " +
    "text-gray-800 dark:text-gray-100 text-sm " +
    "focus:border-[#6CB33F] dark:focus:border-emerald-500 " +
    "focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 " +
    "outline-none transition-colors cursor-pointer appearance-none";

  const labelBase =
    "block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-3 sm:p-4 md:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col transition-colors duration-300">

        {/* HEADER */}
        <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 md:pt-7 pb-3 sm:pb-4 md:pb-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {isEditing ? "Modifier l'offre" : "Ajouter une offre"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tous les champs marqués <span className="text-red-500">*</span> sont obligatoires.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center
                         text-gray-500 dark:text-gray-400
                         hover:text-gray-800 dark:hover:text-white
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         transition-colors text-lg"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-7">
            <div className="space-y-4 sm:space-y-5 md:space-y-6">

              {formError && (
                <div className="rounded-lg md:rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* TYPE D'OFFRE */}
              <div>
                <label className={labelBase}>
                  Type d'offre <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeOffreChange("JOB")}
                    className={`h-11 sm:h-12 rounded-xl sm:rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                      !isStage
                        ? "bg-[#6CB33F] border-[#6CB33F] text-white shadow-md"
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#6CB33F]/50"
                    }`}
                  >
                    <Briefcase size={16} />
                    Offre d'emploi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeOffreChange("STAGE")}
                    className={`h-11 sm:h-12 rounded-xl sm:rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                      isStage
                        ? "bg-blue-500 border-blue-500 text-white shadow-md"
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400/50"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    Stage
                  </button>
                </div>
              </div>

              {/* TITRE */}
              <div>
                <label className={labelBase}>
                  Titre du poste <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className={inputBase}
                  placeholder={isStage ? "Ex: Stage PFE Développeur React" : "Ex: Fullstack Developer (React/Node)"}
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className={labelBase}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-2xl md:rounded-3xl text-sm
                             border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700
                             text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500
                             resize-none
                             focus:border-[#6CB33F] dark:focus:border-emerald-500
                             focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20
                             outline-none transition-colors"
                  placeholder={
                    isStage
                      ? "Décrivez le sujet du stage, les missions, technologies utilisées..."
                      : "Décrivez la mission, le profil recherché, responsabilités..."
                  }
                />
              </div>

              {/* LIEU */}
              <div>
                <label className={labelBase}>
                  Lieu du poste <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none select-none text-base">
                    📍
                  </span>
                  <input
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    placeholder="Ex: Tunis, Sfax, Télétravail, Hybride..."
                    className="w-full h-10 sm:h-11 md:h-12 pl-9 sm:pl-10 md:pl-12 pr-3 sm:pr-4 md:pr-5 rounded-lg sm:rounded-xl md:rounded-full text-sm
                               border border-gray-200 dark:border-gray-600
                               bg-white dark:bg-gray-700
                               text-gray-800 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:border-[#6CB33F] dark:focus:border-emerald-500
                               focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20
                               outline-none transition-colors"
                  />
                </div>
              </div>

              {/* DATE DE CLÔTURE */}
              <div>
                <label className={labelBase}>
                  Date de clôture <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateCloture}
                  onChange={(e) => setForm({ ...form, dateCloture: e.target.value })}
                  min={new Date().toISOString().slice(0, 10)}
                  className={inputBase}
                />
              </div>

              {/* JOB-ONLY FIELDS */}
              {!isStage && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label className={labelBase}>Salaire</label>
                      <input value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} placeholder="Ex: 2000 TND / 2000-2500" className={inputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Nombre de postes</label>
                      <input value={form.nombrePostes} onChange={(e) => setForm({ ...form, nombrePostes: e.target.value })} placeholder="Ex: 2, 5, 10..." className={inputBase} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label className={labelBase}>Type de diplôme</label>
                      <input value={form.typeDiplome} onChange={(e) => setForm({ ...form, typeDiplome: e.target.value })} placeholder="Ex: Licence, Master, Ingénieur..." className={inputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Type de contrat</label>
                      <div className="relative">
                        <select value={form.typeContrat} onChange={(e) => setForm({ ...form, typeContrat: e.target.value })} className={selectBase}>
                          {CONTRACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label className={labelBase}>Motif</label>
                      <div className="relative">
                        <select value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} className={selectBase}>
                          {MOTIF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Genre</label>
                      <div className="relative">
                        <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })} className={selectBase}>
                          {SEXE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STAGE-ONLY FIELDS */}
              {isStage && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label className={labelBase}>Nombre de postes</label>
                      <input value={form.nombrePostes} onChange={(e) => setForm({ ...form, nombrePostes: e.target.value })} placeholder="Ex: 2, 5, 10..." className={inputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Type de diplôme</label>
                      <input value={form.typeDiplome} onChange={(e) => setForm({ ...form, typeDiplome: e.target.value })} placeholder="Ex: Licence, Master, Ingénieur..." className={inputBase} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <div>
                      <label className={labelBase}>Type de stage</label>
                      <div className="relative">
                        <select value={form.typeStage} onChange={(e) => setForm({ ...form, typeStage: e.target.value })} className={selectBase}>
                          {STAGE_CONTRAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Durée du stage</label>
                      <div className="relative">
                        <select value={form.dureeStage} onChange={(e) => setForm({ ...form, dureeStage: e.target.value })} className={selectBase}>
                          {DUREE_STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Genre</label>
                    <div className="relative">
                      <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })} className={selectBase}>
                        {SEXE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                    </div>
                  </div>
                </>
              )}

              {/* SKILLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <div>
                  <label className={labelBase}>Hard Skills</label>
                  <input value={form.hardSkills} onChange={(e) => setForm({ ...form, hardSkills: e.target.value })} placeholder="React, Node.js, SQL, Docker..." className={inputBase} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Compétences techniques — séparées par une virgule.</p>
                </div>
                <div>
                  <label className={labelBase}>Soft Skills</label>
                  <input value={form.softSkills} onChange={(e) => setForm({ ...form, softSkills: e.target.value })} placeholder="Communication, Leadership, Esprit..." className={inputBase} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Compétences comportementales — séparées par une virgule.</p>
                </div>
              </div>

              {/* QUIZ */}
              {!isEditing && !isStage && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-2xl p-4 sm:p-5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" checked={generateQuiz} onChange={(e) => setGenerateQuiz(e.target.checked)} className="sr-only" />
                      <div className={`w-10 h-6 sm:w-11 rounded-full transition-colors duration-200 ${generateQuiz ? "bg-[#6CB33F] dark:bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${generateQuiz ? "translate-x-5 sm:translate-x-6" : "translate-x-1"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-[#6CB33F] dark:text-emerald-400" />
                        <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">Générer un quiz technique</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Un quiz IA sera créé automatiquement à la publication.</p>
                    </div>
                  </label>

                  {generateQuiz && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pl-0 sm:pl-14">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Nombre de questions</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleNumQuestions(numQuestions - 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0">−</button>
                        <input type="number" min={1} max={30} value={numQuestions} onChange={(e) => handleNumQuestions(e.target.value)} className="w-14 h-8 sm:w-16 sm:h-9 text-center rounded-lg sm:rounded-xl text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#6CB33F]/20 outline-none transition-colors" />
                        <button type="button" onClick={() => handleNumQuestions(numQuestions + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0">+</button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(max 30)</span>
                      </div>
                    </div>
                  )}

                  {!generateQuiz && (
                    <p className="pl-0 sm:pl-14 text-xs text-gray-400 dark:text-gray-500 italic">Aucun quiz ne sera généré. Vous pourrez en créer un manuellement plus tard.</p>
                  )}
                </div>
              )}

              {/* PONDÉRATIONS */}
              {!isStage && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 sm:pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">Pondérations (0 – 100)</h3>
                    <span className={`text-xs sm:text-sm font-extrabold ${isValidTotal ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      Total : {totalWeights}%
                    </span>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {SCORE_ITEMS_MODAL.map((it) => {
                      const v = form.scores[it.key] ?? 0;
                      return (
                        <div key={it.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <p className="sm:flex-1 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{it.label}</p>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <input type="number" min={0} max={100} value={v} onChange={(e) => setWeight(it.key, e.target.value)} className="w-20 sm:w-24 h-9 sm:h-11 px-2 sm:px-4 rounded-lg sm:rounded-xl md:rounded-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 outline-none transition-colors" />
                            <span className="text-xs sm:text-sm font-extrabold text-[#4E8F2F] dark:text-emerald-400 w-6">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!isValidTotal && (
                    <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">La somme doit être égale à 100%.</p>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="mt-6 sm:mt-7 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2.5 sm:gap-4">
              <button
                type="submit"
                disabled={submitting || (!isStage && !isValidTotal)}
                className={`flex-1 h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl md:rounded-full font-semibold text-sm transition-colors shadow-sm ${
                  (isStage || isValidTotal) && !submitting
                    ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {submitting ? "Enregistrement..." : isEditing ? "Mettre à jour" : !isStage && generateQuiz ? "Créer + Quiz" : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={() => { setForm(emptyForm); setFormError(""); setGenerateQuiz(true); setNumQuestions(25); onClose(); }}
                disabled={submitting}
                className="flex-1 h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl md:rounded-full font-semibold text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}