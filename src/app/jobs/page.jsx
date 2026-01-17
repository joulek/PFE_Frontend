"use client";

import { useEffect, useState } from "react";
import { getJobs } from "../services/job.api";
import Link from "next/link";

/* ================= UTILS ================= */
function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR");
}

/* ================= PAGE ================= */
export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getJobs().then((res) => setJobs(res.data));
  }, []);

  return (
    /* 🌿 BACKGROUND GLOBAL */
    <div className="min-h-screen bg-green-50">
      {/* 📦 CONTAINER */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ================= HEADER ================= */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Offres d’emploi
          </h1>

          <p className="text-gray-600 max-w-2xl mb-6">
            Rejoignez une équipe dynamique et participez à l’aventure de demain.
            Découvrez nos opportunités actuelles.
          </p>
        </div>

        {/* ================= JOBS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const isExpired =
              job.dateCloture && new Date(job.dateCloture) < new Date();

            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl shadow p-6
                           flex flex-col hover:shadow-lg transition"
              >
                {/* ===== TOP CONTENT ===== */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {job.titre}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  {/* TECHNOLOGIES */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="bg-[#E9F5E3] text-[#4E8F2F]
                                   text-xs font-medium px-3 py-1 rounded-full"
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
                  {/* DATE */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2
                           2 0 002-2V7a2 2 0 00-2-2H5a2
                           2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>

                    <span>
                      Clôture : {formatDate(job.dateCloture)}
                    </span>
                  </div>

                  {/* ACTION */}
                  {isExpired ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-full text-sm font-medium
                                 bg-gray-200 text-gray-400 cursor-not-allowed"
                    >
                      Offre expirée
                    </button>
                  ) : (
                    <Link href={`/jobs/${job._id}/apply`}>
                      <button
                        className="px-5 py-2 rounded-full text-sm font-medium transition
                                   bg-[#6CB33F] text-white hover:bg-[#4E8F2F] shadow"
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
          {jobs.length === 0 && (
            <p className="text-gray-500 text-sm">
              Aucune offre disponible.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
