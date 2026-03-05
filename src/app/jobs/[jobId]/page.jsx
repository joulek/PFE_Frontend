"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getJobById } from "../../services/job.api";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Send,
  FileText,
  GraduationCap,
  Users,
  Briefcase,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR");
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.filter(Boolean).length > 0;
  return true;
}

function prettyContrat(v) {
  const s = String(v || "").toUpperCase().trim();
  if (!s) return "";
  const map = {
    CDD: "CDD", CDI: "CDI", STAGE: "Stage", FREELANCE: "Freelance",
    ALTERNANCE: "Alternance", INTERIM: "Intérim",
    STAGE_INITIATION: "Stage d'initiation", STAGE_ETE: "Stage d'été",
    PFE: "PFE",
  };
  return map[s] || v;
}

function prettySexe(v) {
  const s = String(v || "").toUpperCase().trim();
  if (!s) return "";
  const map = { H: "H", F: "F", HF: "HF" };
  return map[s] || v;
}

function DetailCard({ icon: Icon, label, value, isStage }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-2xl grid place-items-center ${
          isStage
            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-300"
            : "bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300"
        }`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    getJobById(jobId)
      .then((res) => setJob(res?.data || null))
      .catch((e) => {
        setJob(null);
        setError(e?.response?.data?.message || "Impossible de charger l'offre.");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const isStage = job?.typeOffre === "STAGE";

  const hardSkills = useMemo(
    () => (Array.isArray(job?.hardSkills) ? job.hardSkills.filter(Boolean) : []),
    [job]
  );
  const softSkills = useMemo(
    () => (Array.isArray(job?.softSkills) ? job.softSkills.filter(Boolean) : []),
    [job]
  );

  const details = useMemo(() => {
    if (!job) return [];
    return [
      hasValue(job?.typeContrat) && {
        icon: FileText,
        label: "Type de contrat",
        value: prettyContrat(job.typeContrat),
      },
      hasValue(job?.typeDiplome) && {
        icon: GraduationCap,
        label: "Type de diplôme",
        value: String(job.typeDiplome).trim(),
      },
      hasValue(job?.sexe) && {
        icon: Users,
        label: "Genre",
        value: prettySexe(job.sexe),
      },
    ].filter(Boolean);
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Chargement…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error || "Offre introuvable."}</p>
      </div>
    );
  }

  const cloture = formatDate(job?.dateCloture);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">

          {/* BADGE TYPE */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              isStage
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                : "bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}>
              {isStage ? <GraduationCap size={12} /> : <Briefcase size={12} />}
              {isStage ? "Stage" : "Emploi"}
            </span>
          </div>

          {/* TITRE */}
          {hasValue(job?.titre) && (
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              {job.titre}
            </h1>
          )}

          {/* LIEU + DATE */}
          {(hasValue(job?.lieu) || hasValue(cloture)) && (
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-300 mb-8">
              {hasValue(job?.lieu) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{job.lieu}</span>
                </div>
              )}
              {hasValue(cloture) && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Clôture : {cloture}</span>
                </div>
              )}
            </div>
          )}

          {/* DESCRIPTION */}
          {hasValue(job?.description) && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {/* DETAILS */}
          {details.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Détails du poste
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.map((d, i) => (
                  <DetailCard key={i} icon={d.icon} label={d.label} value={d.value} isStage={isStage} />
                ))}
              </div>
            </div>
          )}

          {/* HARD SKILLS */}
          {hardSkills.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Hard Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill, i) => (
                  <span key={i} className="bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 text-xs font-medium px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOFT SKILLS */}
          {softSkills.length > 0 && (
            <div className="mb-2">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, i) => (
                  <span key={i} className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-2xl text-sm font-semibold transition bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          {/* ✅ STAGE → /postuler | EMPLOI → /apply */}
          <Link href={isStage ? `/jobs/${job._id}/postuler` : `/jobs/${job._id}/apply`}>
            <button className={`px-8 py-3 rounded-2xl text-sm font-semibold transition shadow flex items-center gap-2 text-white ${
              isStage
                ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                : "bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500"
            }`}>
              {isStage ? <GraduationCap className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {isStage ? "Postuler pour ce stage" : "Postuler"}
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
