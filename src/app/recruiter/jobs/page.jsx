"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getJobs,
  getAllJobs,
  createJob, // اختياري (Nouvelle offre)
  updateJob, // اختياري (Nouvelle offre)
} from "../../services/job.api";
import JobModal from "./JobModal"; // اختياري (Nouvelle offre)
import { getUsers } from "../../services/ResponsableMetier.api"; // اختياري
import Pagination from "../../components/Pagination";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  CalendarClock,
  MapPin,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getJobStatus(job) {
  const s = (job.status || "").toString().toUpperCase().trim();
  if (s === "CONFIRMEE" || s === "REJETEE" || s === "EN_ATTENTE") return s;
  return "EN_ATTENTE";
}

// ✅ robust (date-only) باش ما تتلخبطش بالtimezone
function isExpired(job) {
  if (!job?.dateCloture) return false;

  const d = new Date(job.dateCloture);
  if (Number.isNaN(d.getTime())) return false;

  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return end < new Date();
}

function isInactive(job) {
  return isExpired(job);
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

// ✅ badge Expirée (couleur différente)
const EXPIRED_BADGE = {
  label: "Expirée",
  bg: "bg-gray-100 dark:bg-gray-700",
  text: "text-gray-700 dark:text-gray-200",
  border: "border-gray-300 dark:border-gray-600",
};

function StatusBadges({ status, expired }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
  const Icon = config.icon;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border
        ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon size={13} />
        {config.label}
      </span>

      {/* ✅ show Expirée only when CONFIRMEE + expired */}
      {status === "CONFIRMEE" && expired && (
        <span
          className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border
          ${EXPIRED_BADGE.bg} ${EXPIRED_BADGE.text} ${EXPIRED_BADGE.border}`}
        >
          {EXPIRED_BADGE.label}
        </span>
      )}
    </div>
  );
}

/* ================= TABS (filters) ================= */
const TABS = [
  { key: "all", label: "Toutes" },
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "CONFIRMEE", label: "Confirmées" },
  { key: "REJETEE", label: "Rejetées" },
  { key: "INACTIVE", label: "Inactives" },
];

/* ================= PAGE ================= */
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);

  // (اختياري) Nouvelle offre
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // users اختياري
  const [users, setUsers] = useState([]);

  // filters
  const [activeTab, setActiveTab] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function loadJobs() {
    try {
      const res = await getAllJobs();
      setJobs(res.data || []);
    } catch {
      try {
        const res = await getJobs();
        setJobs(res.data || []);
      } catch (err) {
        console.error("Impossible de charger les offres", err);
        setJobs([]);
      }
    }
  }

  async function loadUsers() {
    try {
      const res = await getUsers();
      const list = Array.isArray(res?.data)
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
      await loadUsers(); // اختياري
    })();
  }, []);

  // (اختياري) create/update للـ Nouvelle offre
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

  const normalizedJobs = useMemo(() => {
    return jobs.map((j) => ({
      ...j,
      _normalizedStatus: getJobStatus(j),
      _expired: isExpired(j),
    }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeTab === "all") return normalizedJobs;

    if (activeTab === "INACTIVE") {
      return normalizedJobs.filter((j) => isInactive(j));
    }

    return normalizedJobs.filter((j) => j._normalizedStatus === activeTab);
  }, [normalizedJobs, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  const counts = useMemo(() => {
    const c = {
      all: normalizedJobs.length,
      EN_ATTENTE: 0,
      CONFIRMEE: 0,
      REJETEE: 0,
      INACTIVE: 0,
    };

    normalizedJobs.forEach((j) => {
      if (c[j._normalizedStatus] !== undefined) c[j._normalizedStatus]++;
      if (isInactive(j)) c.INACTIVE++;
    });

    return c;
  }, [normalizedJobs]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages || 1);
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Offres d&apos;emploi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez toutes les offres et confirmez celles en attente
            </p>
          </div>

          {/* ✅ (اختياري) Nouvelle offre */}
          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-6 py-3 rounded-xl font-semibold shadow transition-colors"
          >
            Nouvelle offre
          </button>
        </div>

        {/* FILTERS (TABS) */}
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
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
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

        {/* JOBS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const status = job._normalizedStatus;
            const expired = job._expired;

            return (
              <div
                key={job._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300"
              >
                {/* title + badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {job.titre}
                  </h3>
                  <StatusBadges status={status} expired={expired} />
                </div>

                {/* description short */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 whitespace-pre-line">
                  {job.description || "—"}
                </p>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* meta + details button aligned */}
                <div className="mt-1 flex items-end justify-between gap-4">
                  {/* LEFT: infos */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    {job.lieu && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{job.lieu}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>Créée : {formatDate(job.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span>Clôture : {formatDate(job.dateCloture)}</span>
                    </div>
                  </div>

                  {/* RIGHT: button */}
                  <Link
                    href={`/recruiter/jobs/${job._id}`}
                    className="h-10 px-6 rounded-full font-semibold text-sm
                               inline-flex items-center justify-center shrink-0
                               bg-[#6CB33F] hover:bg-[#4E8F2F]
                               dark:bg-emerald-600 dark:hover:bg-emerald-500
                               text-white transition-colors"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Aucune offre dans cette catégorie.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {/* ✅ (اختياري) JobModal */}
      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
        users={users}
      />
    </div>
  );
}