"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getJobById } from "../../services/job.api";
import { Calendar, MapPin, ArrowLeft, Send } from "lucide-react";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function JobDetailsPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    setError("");

    getJobById(jobId)
      .then((res) => setJob(res.data))
      .catch((e) => {
        setError(e?.response?.data?.message || "Impossible de charger l'offre.");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Chargement…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">
          {error || "Offre introuvable."}
        </p>
      </div>
    );
  }

  const hardSkills = Array.isArray(job.hardSkills) ? job.hardSkills : [];
  const softSkills = Array.isArray(job.softSkills) ? job.softSkills : [];
  const technologies = Array.isArray(job.technologies) ? job.technologies : [];

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
          {/* TITLE */}
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            {job.titre}
          </h1>

          {/* META */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-300 mb-8">
            {job.lieu && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{job.lieu}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Clôture : {formatDate(job.dateCloture)}</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
              {job.description || "—"}
            </p>
          </div>

          {/* TECHNOLOGIES */}
          {technologies.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {technologies.map((t, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HARD SKILLS */}
          {hardSkills.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Hard Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOFT SKILLS */}
          {softSkills.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ BOTTOM ACTIONS (Retour + Postuler) */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Link href="/jobs" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-semibold transition bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </Link>

          <Link href={`/jobs/${job._id}/apply`} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-semibold transition bg-[#6CB33F] dark:bg-emerald-600 text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 shadow flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Postuler
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}