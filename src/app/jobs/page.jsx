"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getJobs } from "../services/job.api";
import Pagination from "../components/Pagination";
import {
  Briefcase,
  Calendar,
  CalendarClock,
  MapPin,
  Send,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function JobsPublicPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home"); // home | emploi | stage
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    getJobs()
      .then((res) => setJobs(res?.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const emploiJobs = useMemo(
    () => jobs.filter((j) => !j.typeOffre || j.typeOffre === "EMPLOI"),
    [jobs]
  );
  const stageJobs = useMemo(
    () => jobs.filter((j) => j.typeOffre === "STAGE"),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    if (activeTab === "emploi") return emploiJobs;
    if (activeTab === "stage") return stageJobs;
    return [];
  }, [activeTab, emploiJobs, stageJobs]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  useEffect(() => setPage(1), [activeTab]);

  // ======= HOME SCREEN =======
  if (activeTab === "home") {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
        {/* HERO */}
        <div className="bg-gradient-to-br from-[#e8f5e2] to-[#f5fff5] dark:from-gray-900 dark:to-gray-950 px-6 py-20 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Carrière
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">
            Consultez nos offres d&apos;emploi ou envoyez une candidature spontanée.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Candidature spontanée */}
            <Link href="/jobs/spontaneous">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:border-[#6CB33F] hover:text-[#6CB33F] transition-all shadow-sm text-sm">
                <Send size={16} />
                Candidature spontanée
              </button>
            </Link>

            {/* Offres d'emploi */}
            <button
              onClick={() => setActiveTab("offres")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white font-semibold transition-all shadow-md text-sm"
            >
              <Briefcase size={16} />
              Offres d&apos;emploi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= OFFRES SELECTION SCREEN =======
  if (activeTab === "offres") {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <button
            onClick={() => setActiveTab("home")}
            className="mb-8 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            ← Retour
          </button>

          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Offres d&apos;emploi
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Découvrez nos opportunités actuelles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Recrutement */}
            <button
              onClick={() => setActiveTab("emploi")}
              className="group bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#6CB33F] dark:hover:border-emerald-500 p-8 text-left shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#E9F5E3] dark:bg-emerald-950/40 grid place-items-center mb-5 group-hover:scale-110 transition-transform">
                <Briefcase size={26} className="text-[#6CB33F]" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                Recrutement
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Postes CDI, CDD, CIVP et autres contrats
              </p>
              <div className="flex items-center gap-1 text-[#6CB33F] font-semibold text-sm">
                <span>{emploiJobs.length} offre(s)</span>
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Stage */}
            <button
              onClick={() => setActiveTab("stage")}
              className="group bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 p-8 text-left shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 grid place-items-center mb-5 group-hover:scale-110 transition-transform">
                <GraduationCap size={26} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                Stages
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                PFE, stage d&apos;été, alternance
              </p>
              <div className="flex items-center gap-1 text-blue-500 font-semibold text-sm">
                <span>{stageJobs.length} offre(s)</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======= LIST (emploi ou stage) =======
  const isStageTab = activeTab === "stage";
  const accentColor = isStageTab ? "blue" : "green";

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* NAV BACK */}
        <button
          onClick={() => setActiveTab("offres")}
          className="mb-8 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Retour aux catégories
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`h-12 w-12 rounded-2xl grid place-items-center ${
              isStageTab
                ? "bg-blue-50 dark:bg-blue-950/40"
                : "bg-[#E9F5E3] dark:bg-emerald-950/40"
            }`}
          >
            {isStageTab ? (
              <GraduationCap size={22} className="text-blue-500" />
            ) : (
              <Briefcase size={22} className="text-[#6CB33F]" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {isStageTab ? "Stages" : "Recrutement"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredJobs.length} offre(s) disponible(s)
            </p>
          </div>
        </div>

        {/* JOBS GRID */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            Chargement…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedJobs.map((job) => (
                <div
                  key={job._id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${
                    isStageTab
                      ? "border-blue-100 dark:border-blue-900/40"
                      : "border-emerald-100 dark:border-emerald-900/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {job.titre}
                    </h3>
                    {isStageTab && (
                      <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Stage
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 whitespace-pre-line">
                    {job.description || "—"}
                  </p>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

                  <div className="mt-1 flex items-end justify-between gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
                      {job.lieu && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{job.lieu}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-gray-400" />
                        <span>Clôture : {formatDate(job.dateCloture)}</span>
                      </div>
                    </div>

                    <Link href={`/jobs/${job._id}`} className="shrink-0">
                      <button
                        className={`h-10 px-5 rounded-full font-semibold text-sm inline-flex items-center gap-1.5 text-white transition-colors ${
                          isStageTab
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-[#6CB33F] hover:bg-[#4E8F2F]"
                        }`}
                      >
                        Voir détails
                      </button>
                    </Link>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
                  {isStageTab ? (
                    <GraduationCap className="mx-auto w-10 h-10 text-gray-400" />
                  ) : (
                    <Briefcase className="mx-auto w-10 h-10 text-gray-400" />
                  )}
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    Aucune offre disponible pour le moment.
                  </p>
                </div>
              )}
            </div>

            {filteredJobs.length > pageSize && (
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
          </>
        )}
      </div>
    </div>
  );
}