"use client";

import { useEffect, useMemo, useState } from "react";
import { getJobs } from "../services/job.api";
import Link from "next/link";
import Pagination from "../components/Pagination";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

/* ================= PAGE ================= */
export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [expandedJobs, setExpandedJobs] = useState({});

  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    getJobs().then((res) => setJobs(res.data || []));
  }, []);

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  }

  // ✅ Filtrer les offres NON expirées
  const activeJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      if (!job.dateCloture) return true; // si pas de date, on affiche
      return new Date(job.dateCloture) >= now;
    });
  }, [jobs]);

  const totalPages = Math.max(1, Math.ceil(activeJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activeJobs.slice(start, start + pageSize);
  }, [jobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* ================= HEADER ================= */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Offres d’emploi
          </h1>

          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
            Rejoignez une équipe dynamique et participez à l’aventure de demain.
            Découvrez nos opportunités actuelles.
          </p>
        </div>

        {/* ================= JOBS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpired =
              job.dateCloture && new Date(job.dateCloture) < new Date();

            const isExpanded = !!expandedJobs[job._id];
            const hasLongDescription = (job.description || "").length > 160;

            return (
              <div
                key={job._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition"
              >
                {/* ===== TOP CONTENT ===== */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {job.titre}
                  </h3>

                  {/* DESCRIPTION */}
                  <p
                    className={`text-gray-600 dark:text-gray-300 text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""
                      }`}
                  >
                    {job.description}
                  </p>

                  {/* Lire la suite / Réduire */}
                  {hasLongDescription && (
                    <button
                      type="button"
                      onClick={() => toggleReadMore(job._id)}
                      className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                    </button>
                  )}

                  {/* TECHNOLOGIES */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {job.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ===== LIEU ===== */}
                {job.lieu && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2 mb-1">
                    <span>📍</span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">{job.lieu}</span>
                  </div>
                )}

          {/* ===== DIVIDER ===== */}
                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* ===== BOTTOM BAR ===== */}
                <div className="flex items-center justify-between">
                  {/* DATE */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>

                    <span>Clôture : {formatDate(job.dateCloture)}</span>
                  </div>

                  {/* ACTION */}
                  {isExpired ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    >
                      Offre expirée
                    </button>
                  ) : (
                    <Link href={`/jobs/${job._id}/apply`}>
                      <button
                        className="px-5 py-2 rounded-full text-sm font-medium transition bg-[#6CB33F] dark:bg-emerald-600 text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 shadow"
                      >
                        Postuler
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {/* ===== EMPTY STATE ===== */}
          {activeJobs.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune offre disponible.</p>
          )}
        </div>

        {/* ✅ PAGINATION FOOTER */}
        {jobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>
              Total: {activeJobs.length} offre(s)
              — Page {page} / {totalPages}
            </p>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}