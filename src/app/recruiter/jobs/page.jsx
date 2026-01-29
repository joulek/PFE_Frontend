"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
} from "../../services/job.api";
import JobModal from "./JobModal";
import DeleteJobModal from "./DeleteJobModal";
import Pagination from "../../components/Pagination";
import { Trash2, Edit2 } from "lucide-react";
/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

/* ================= PAGE ================= */
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // ✅ stocker les cartes ouvertes (par id)
  const [expandedJobs, setExpandedJobs] = useState({});

  // ✅ Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6; // 🔥 change comme tu veux (ex: 4, 6, 8)

  async function loadJobs() {
    const res = await getJobs();
    setJobs(res.data || []);
  }

  useEffect(() => {
    loadJobs();
  }, []);

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

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  }

  // ✅ Pagination logic
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return jobs.slice(start, start + pageSize);
  }, [jobs, page]);

  // إذا نقص عدد الjobs بعد delete، رجّع page لآخر صفحة موجودة
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    /* 🌿 BACKGROUND GLOBAL */
    <div className="min-h-screen bg-green-50">
      {/* 📦 CONTAINER */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Offres d’emploi</h1>

          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F]
                       text-white px-6 py-3 rounded-xl
                       font-semibold shadow transition"
          >
            Nouvelle offre
          </button>
        </div>

        {/* ================= JOBS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDescription = (job.description || "").length > 160;

            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl shadow
                           p-6 flex flex-col
                           hover:shadow-lg transition"
              >
                {/* ===== TOP CONTENT ===== */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {job.titre}
                  </h3>

                  {/* DESCRIPTION */}
                  <p
                    className={`text-gray-600 text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""
                      }`}
                  >
                    {job.description}
                  </p>

                  {/* Lire la suite / Réduire */}
                  {hasLongDescription && (
                    <button
                      type="button"
                      onClick={() => toggleReadMore(job._id)}
                      className="text-sm text-[#4E8F2F] font-semibold hover:underline"
                    >
                      {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                    </button>
                  )}

                  {/* TECHNOLOGIES */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {job.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="bg-[#E9F5E3] text-[#4E8F2F]
                                   text-xs font-medium
                                   px-3 py-1 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ===== DIVIDER ===== */}
                <div className="border-t border-gray-100 my-4" />

                {/* ===== BOTTOM BAR ===== */}
                <div className="flex items-center justify-between">
                  {/* DATES */}
                  <div className="text-sm text-gray-500 space-y-1">
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
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setModalOpen(true);
                      }}
                      className="text-[#4E8F2F] font-medium hover:underline"
                    >
                      <Edit2 className="inline mb-1 mr-1" />
                    </button>

                    <button
                      onClick={() => {
                        setJobToDelete(job);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-500 hover:underline"
                    >
                      <Trash2 className="inline mb-1 mr-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* EMPTY STATE */}
          {jobs.length === 0 && (
            <p className="text-gray-500 text-sm">Aucune offre disponible.</p>
          )}
        </div>

        {/* ✅ PAGINATION FOOTER */}
        {jobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500">
            <p>
              Total: {jobs.length} offre(s) — Page {page} / {totalPages}
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
        onClose={() => {
          setModalOpen(false);
          setEditingJob(null); // ✅ مهم
        }}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
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
    </div>
  );
}
