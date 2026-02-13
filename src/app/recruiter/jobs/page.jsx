"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getJobs,
  getAllJobs,
  getPendingJobs,
  createJob,
  updateJob,
  deleteJob,
  confirmJob,
  rejectJob,
} from "../../services/job.api";
import JobModal from "./JobModal";
import { getUsers } from "../../services/ResponsableMetier.api";
import DeleteJobModal from "./DeleteJobModal";
import Pagination from "../../components/Pagination";
import {
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

/**
 * ✅ Normaliser le status — les anciennes offres sans champ "status"
 * sont traitées comme EN_ATTENTE
 */
function getJobStatus(job) {
  if (job.status === "CONFIRMEE" || job.status === "REJETEE") return job.status;
  return "EN_ATTENTE";
}

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG = {
  CONFIRMEE: {
    label: "Confirmée",
    bg: "bg-green-100 dark:bg-emerald-900/30",
    text: "text-green-700 dark:text-emerald-400",
    border: "border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  REJETEE: {
    label: "Rejetée",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    icon: XCircle,
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

/* ================= TABS ================= */
const TABS = [
  { key: "all", label: "Toutes" },
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "CONFIRMEE", label: "Confirmées" },
  { key: "REJETEE", label: "Rejetées" },
];

/* ================= PAGE ================= */
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedJobs, setExpandedJobs] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [jobToReject, setJobToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ✅ Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  /* ---- loaders ---- */
  async function loadJobs() {
    try {
      const res = await getAllJobs();
      setJobs(res.data || []);
    } catch {
      const res = await getJobs();
      setJobs(res.data || []);
    }
  }

  async function loadUsers() {
    try {
      const res = await getUsers();

      const list =
        Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.users)
            ? res.data.users
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data?.data?.users)
                ? res.data.data.users
                : [];

      setUsers(list);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    (async () => {
      await loadJobs();
      await loadUsers();
    })();
  }, []);

  /* ---- handlers ---- */
  async function handleCreate(data) {
    await createJob(data);
    setModalOpen(false);
    loadJobs();
  }

  async function handleUpdate(data) {
    await updateJob(editingJob._id, data);
    setEditingJob(null);
    setModalOpen(false);
    loadJobs();
  }

  async function handleConfirm(jobId) {
    setActionLoading(jobId);
    try {
      await confirmJob(jobId);
      await loadJobs();
    } catch (err) {
      console.error("Erreur confirmation:", err);
    }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!jobToReject) return;
    setActionLoading(jobToReject._id);
    try {
      await rejectJob(jobToReject._id, rejectReason || undefined);
      await loadJobs();
    } catch (err) {
      console.error("Erreur rejet:", err);
    }
    setActionLoading(null);
    setRejectModalOpen(false);
    setJobToReject(null);
    setRejectReason("");
  }

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  }

  /* ---- ✅ Normalize all jobs with getJobStatus ---- */
  const normalizedJobs = useMemo(() => {
    return jobs.map((j) => ({
      ...j,
      _normalizedStatus: getJobStatus(j),
    }));
  }, [jobs]);

  /* ---- filtered + paginated ---- */
  const filteredJobs = useMemo(() => {
    if (activeTab === "all") return normalizedJobs;
    return normalizedJobs.filter((j) => j._normalizedStatus === activeTab);
  }, [normalizedJobs, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  // ✅ counts per status (using normalized)
  const counts = useMemo(() => {
    const c = { all: normalizedJobs.length, EN_ATTENTE: 0, CONFIRMEE: 0, REJETEE: 0 };
    normalizedJobs.forEach((j) => {
      if (c[j._normalizedStatus] !== undefined) c[j._normalizedStatus]++;
    });
    return c;
  }, [normalizedJobs]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  /* ---- helper: get creator name ---- */
  function getCreatorName(job) {
    if (!job.createdBy) return null;
    const creatorId =
      typeof job.createdBy === "string"
        ? job.createdBy
        : job.createdBy.toString?.() || job.createdBy._id;
    const u = users.find(
      (user) => user._id === creatorId || user._id?.toString() === creatorId
    );
    if (u) return `${u.prenom || ""} ${u.nom || ""}`.trim() || u.email;
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Offres d&apos;emploi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez toutes les offres et confirmez celles en attente
            </p>
          </div>

          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-6 py-3 rounded-xl
                       font-semibold shadow transition-colors"
          >
            Nouvelle offre
          </button>
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#6CB33F] dark:bg-emerald-600 text-white shadow-md shadow-green-500/20"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#6CB33F] dark:hover:border-emerald-500"
                  }`}
              >
                {tab.label}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= JOBS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDescription = (job.description || "").length > 160;
            const status = job._normalizedStatus;
            const isPending = status === "EN_ATTENTE";
            const isLoading = actionLoading === job._id;
            const creatorName = getCreatorName(job);

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow
                           p-6 flex flex-col
                           hover:shadow-lg transition-all duration-300
                           border ${
                             isPending
                               ? "border-amber-300 dark:border-amber-700"
                               : "border-transparent dark:border-gray-700"
                           }`}
              >
                {/* ===== TOP: TITLE + STATUS ===== */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {job.titre}
                  </h3>
                  <StatusBadge status={status} />
                </div>

                {/* CREATOR INFO */}
                {creatorName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Créée par :{" "}
                    <span className="font-semibold">{creatorName}</span>
                  </p>
                )}

                {/* DESCRIPTION */}
                <p
                  className={`text-gray-600 dark:text-gray-300 text-sm mb-2 whitespace-pre-line ${
                    !isExpanded ? "line-clamp-3" : ""
                  }`}
                >
                  {job.description}
                </p>

                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={() => toggleReadMore(job._id)}
                    className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-semibold hover:underline self-start"
                  >
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                {/* TECHNOLOGIES */}
                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  {job.technologies?.map((tech, i) => (
                    <span
                      key={i}
                      className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400
                                 text-xs font-medium
                                 px-3 py-1 rounded-full
                                 border border-[#d7ebcf] dark:border-gray-600
                                 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* ===== DIVIDER ===== */}
                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* ===== BOTTOM BAR ===== */}
                <div className="flex items-center justify-between mt-auto">
                  {/* DATES */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Créée : {formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏳</span>
                      <span>Clôture : {formatDate(job.dateCloture)}</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2">
                    {/* ✅ CONFIRM / REJECT — visible pour EN_ATTENTE */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleConfirm(job._id)}
                          disabled={isLoading}
                          title="Confirmer cette offre"
                          className="h-10 w-10 rounded-full grid place-items-center
                                     bg-green-100 dark:bg-emerald-900/30
                                     text-green-700 dark:text-emerald-400
                                     hover:bg-green-200 dark:hover:bg-emerald-800/50
                                     transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setJobToReject(job);
                            setRejectReason("");
                            setRejectModalOpen(true);
                          }}
                          disabled={isLoading}
                          title="Rejeter cette offre"
                          className="h-10 w-10 rounded-full grid place-items-center
                                     bg-red-100 dark:bg-red-900/30
                                     text-red-600 dark:text-red-400
                                     hover:bg-red-200 dark:hover:bg-red-800/50
                                     transition-colors disabled:opacity-50"
                        >
                          <XCircle size={20} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setModalOpen(true);
                      }}
                      title="Modifier"
                      className="h-9 w-9 rounded-full grid place-items-center
                                 text-[#4E8F2F] dark:text-emerald-400
                                 hover:bg-green-100 dark:hover:bg-emerald-900/30
                                 transition-colors"
                    >
                      <Edit2 size={17} />
                    </button>

                    <button
                      onClick={() => {
                        setJobToDelete(job);
                        setDeleteModalOpen(true);
                      }}
                      title="Supprimer"
                      className="h-9 w-9 rounded-full grid place-items-center
                                 text-red-500 dark:text-red-400
                                 hover:bg-red-100 dark:hover:bg-red-900/30
                                 transition-colors"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* EMPTY STATE */}
          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Aucune offre dans cette catégorie.
              </p>
            </div>
          )}
        </div>

        {/* ✅ PAGINATION FOOTER */}
        {filteredJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>
              Total: {filteredJobs.length} offre(s) — Page {page} / {totalPages}
            </p>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
        users={users}
      />

      <DeleteJobModal
        open={deleteModalOpen}
        job={jobToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          await deleteJob(jobToDelete._id);
          setDeleteModalOpen(false);
          loadJobs();
        }}
      />

      {/* ✅ REJECT MODAL — avec raison optionnelle */}
      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setRejectModalOpen(false);
              setJobToReject(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden transition-colors duration-300">
            {/* Header */}
            <div className="px-8 pt-7 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Rejeter l&apos;offre
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {jobToReject?.titre}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setJobToReject(null);
                  }}
                  className="h-10 w-10 rounded-full grid place-items-center
                             text-gray-500 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Body */}
            <div className="px-8 py-6">
              <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                Motif du rejet (optionnel)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi cette offre est rejetée..."
                className="w-full px-5 py-4 rounded-2xl
                           border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-700
                           text-gray-800 dark:text-gray-100
                           placeholder-gray-400 dark:placeholder-gray-500
                           resize-none
                           focus:border-red-400 dark:focus:border-red-500
                           focus:ring-4 focus:ring-red-500/10
                           outline-none transition-colors"
              />

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setJobToReject(null);
                  }}
                  className="h-12 px-8 rounded-full
                             border border-gray-200 dark:border-gray-600
                             text-gray-800 dark:text-gray-200 font-semibold
                             hover:bg-gray-50 dark:hover:bg-gray-700
                             transition-colors"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading === jobToReject?._id}
                  className="h-12 px-8 rounded-full
                             bg-red-500 hover:bg-red-600
                             dark:bg-red-600 dark:hover:bg-red-500
                             text-white font-semibold
                             shadow-md shadow-red-500/30
                             transition-colors disabled:opacity-50"
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}