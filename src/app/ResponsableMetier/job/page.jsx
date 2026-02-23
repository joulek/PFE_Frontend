"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createJob, getMyOffers, updateMyJob } from "../../services/job.api";
import Pagination from "../../components/Pagination";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Calendar,
  CalendarClock,
  CalendarCheck,
  MapPin,
  BrainCircuit,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getJobStatus(job) {
  const s = (job?.status || "").toString().toUpperCase().trim();
  if (s === "CONFIRMEE" || s === "REJETEE" || s === "EN_ATTENTE") return s;
  return "EN_ATTENTE";
}

function parseSkills(str) {
  return String(str || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG = {
  CONFIRMEE: {
    label: "Confirmée",
    bg: "bg-green-100 dark:bg-emerald-900/30",
    text: "text-green-700 dark:text-emerald-400",
    border: "border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
    cardBorder: "border-green-200 dark:border-emerald-800",
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

/* ================= TABS ================= */
const TABS = [
  { key: "all", label: "Toutes" },
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "CONFIRMEE", label: "Confirmées" },
  { key: "REJETEE", label: "Rejetées" },
];

/* ================= SCORE ITEMS ================= */
const SCORE_ITEMS = [
  { key: "skillsFit", label: "Skills Fit" },
  { key: "experienceFit", label: "Professional Experience Fit" },
  { key: "projectsFit", label: "Projects Fit & Impact" },
  { key: "educationFit", label: "Education / Certifications" },
  { key: "communicationFit", label: "Communication / Clarity signals" },
];

/* =================================================================
   PAGE — LISTE OFFRES
   ✅ Cards: titre + description + lieu + dates + badge + bouton détails
   ❌ sans hard/soft skills
================================================================= */
export default function UserJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [expandedJobs, setExpandedJobs] = useState({});

  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function loadMyOffers() {
    setLoading(true);
    try {
      const res = await getMyOffers();
      setJobs(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error("Erreur chargement offres:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(u);
    loadMyOffers();
  }, []);

  // ✅ base route details حسب role — ما نبدلوش routes
  const detailsBase =
    user?.role === "RECRUTEUR" || user?.role === "RECRUITER"
      ? "/recruiter/jobs"
      : "/ResponsableMetier/job";

  async function handleCreate(payload) {
    try {
      await createJob(payload);
      setModalOpen(false);
      setEditingJob(null);
      loadMyOffers();
    } catch (err) {
      console.error("Erreur création:", err);
    }
  }

  async function handleUpdate(payload) {
    try {
      await updateMyJob(editingJob?._id, payload);
      setModalOpen(false);
      setEditingJob(null);
      loadMyOffers();
    } catch (err) {
      console.error("Erreur modification:", err);
    }
  }

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  }

  const normalizedJobs = useMemo(
    () => (jobs || []).map((j) => ({ ...j, _status: getJobStatus(j) })),
    [jobs]
  );

  const counts = useMemo(() => {
    const c = { all: normalizedJobs.length, EN_ATTENTE: 0, CONFIRMEE: 0, REJETEE: 0 };
    normalizedJobs.forEach((j) => {
      if (c[j._status] !== undefined) c[j._status]++;
    });
    return c;
  }, [normalizedJobs]);

  const filteredJobs = useMemo(() => {
    if (activeTab === "all") return normalizedJobs;
    return normalizedJobs.filter((j) => j._status === activeTab);
  }, [normalizedJobs, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Mes offres d&apos;emploi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Rôle : {user?.role || "—"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {jobs.length} offre(s) soumise(s)
            </p>
          </div>

          {/* ✅ garder bouton ajouter */}
          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Nouvelle offre
          </button>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: counts.all,
              color: "text-gray-800 dark:text-white",
              bg: "bg-white dark:bg-gray-800",
            },
            {
              label: "En attente",
              value: counts.EN_ATTENTE,
              color: "text-amber-700 dark:text-amber-400",
              bg: "bg-amber-50 dark:bg-amber-900/20",
            },
            {
              label: "Confirmées",
              value: counts.CONFIRMEE,
              color: "text-green-700 dark:text-emerald-400",
              bg: "bg-green-50 dark:bg-emerald-900/20",
            },
            {
              label: "Rejetées",
              value: counts.REJETEE,
              color: "text-red-700 dark:text-red-400",
              bg: "bg-red-50 dark:bg-red-900/20",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-700`}
            >
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ===== TABS (garder filters!) ===== */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
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
                  {counts[tab.key] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== JOBS GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDesc = (job.description || "").length > 160;

            const status = job._status;
            const isPending = status === "EN_ATTENTE";
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${statusConfig.cardBorder}`}
              >
                {/* TITLE + STATUS */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {job.titre}
                  </h3>
                  <StatusBadge status={status} />
                </div>

                {/* REJECTION REASON */}
                {status === "REJETEE" && job.rejectionReason && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mb-3">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">
                      Motif du rejet
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {job.rejectionReason}
                    </p>
                  </div>
                )}

                {/* DESCRIPTION (only) */}
                <p
                  className={`text-gray-600 dark:text-gray-300 text-sm mb-2 whitespace-pre-line ${
                    !isExpanded ? "line-clamp-3" : ""
                  }`}
                >
                  {job.description || "—"}
                </p>

                {hasLongDesc && (
                  <button
                    type="button"
                    onClick={() => toggleReadMore(job._id)}
                    className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-semibold hover:underline self-start mb-2"
                  >
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* META + ACTIONS */}
                <div className="flex items-end justify-between mt-auto gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    {job.lieu && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {job.lieu}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                      <span>Créée : {formatDate(job.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarClock size={16} className="text-gray-400 dark:text-gray-500" />
                      <span>Clôture : {formatDate(job.dateCloture)}</span>
                    </div>

                    {job.confirmedAt && (
                      <div className="flex items-center gap-2">
                        <CalendarCheck size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Confirmée : {formatDate(job.confirmedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ Détails + Edit (edit uniquement si EN_ATTENTE) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`${detailsBase}/${job._id}`}
                      className="h-10 px-4 rounded-full font-semibold text-sm
                                 inline-flex items-center justify-center
                                 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                 text-gray-700 dark:text-gray-200
                                 hover:border-[#6CB33F] dark:hover:border-emerald-500
                                 transition-colors"
                    >
                      Détails
                    </Link>

                    {isPending && (
                      <button
                        onClick={() => {
                          setEditingJob(job);
                          setModalOpen(true);
                        }}
                        title="Modifier cette offre"
                        className="h-10 w-10 rounded-full grid place-items-center
                                   text-[#4E8F2F] dark:text-emerald-400
                                   hover:bg-green-100 dark:hover:bg-emerald-900/30
                                   transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ===== EMPTY STATE ===== */}
          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {activeTab === "all"
                  ? "Vous n'avez pas encore soumis d'offre."
                  : "Aucune offre dans cette catégorie."}
              </p>
              {activeTab === "all" && (
                <button
                  onClick={() => {
                    setEditingJob(null);
                    setModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  <Plus size={16} /> Proposer une offre
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== PAGINATION ===== */}
        {filteredJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>
              Total : {filteredJobs.length} offre(s) — Page {page} / {totalPages}
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* ✅ MODAL — création + modification */}
      <JobOfferModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingJob(null);
        }}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
      />
    </div>
  );
}

/* =================================================================
   MODAL — Proposer / Modifier une offre (complet)
================================================================= */
function JobOfferModal({ open, onClose, onSubmit, initialData }) {
  const emptyForm = {
    titre: "",
    description: "",
    hardSkills: "",
    softSkills: "",
    dateCloture: "",
    lieu: "",
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

  const isEditing = !!initialData;

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        description: initialData.description || "",
        hardSkills: Array.isArray(initialData.hardSkills)
          ? initialData.hardSkills.join(", ")
          : initialData.hardSkills || "",
        softSkills: Array.isArray(initialData.softSkills)
          ? initialData.softSkills.join(", ")
          : initialData.softSkills || "",
        dateCloture: initialData.dateCloture ? String(initialData.dateCloture).slice(0, 10) : "",
        lieu: initialData.lieu || "",
        scores: {
          skillsFit: initialData?.scores?.skillsFit ?? 30,
          experienceFit: initialData?.scores?.experienceFit ?? 30,
          projectsFit: initialData?.scores?.projectsFit ?? 20,
          educationFit: initialData?.scores?.educationFit ?? 10,
          communicationFit: initialData?.scores?.communicationFit ?? 10,
        },
      });
    } else {
      setForm(emptyForm);
      setGenerateQuiz(true);
      setNumQuestions(25);
    }

    setFormError("");
    setSubmitting(false);
  }, [open, initialData]);

  if (!open) return null;

  function setWeight(key, value) {
    setFormError("");
    let v = Number(value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setForm((p) => ({ ...p, scores: { ...p.scores, [key]: v } }));
  }

  const totalWeights = Object.values(form.scores || {}).reduce(
    (sum, v) => sum + Number(v || 0),
    0
  );
  const isValidTotal = totalWeights === 100;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.titre.trim()) return setFormError("❌ Le titre du poste est obligatoire.");
    if (!form.description.trim()) return setFormError("❌ La description est obligatoire.");
    if (!form.lieu.trim()) return setFormError("❌ Le lieu du poste est obligatoire.");
    if (!form.dateCloture) return setFormError("❌ La date de clôture est obligatoire.");
    if (!isValidTotal) return setFormError("❌ La somme des pondérations doit être égale à 100%.");

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      lieu: form.lieu.trim(),
      dateCloture: form.dateCloture,
      hardSkills: parseSkills(form.hardSkills),
      softSkills: parseSkills(form.softSkills),
      scores: {
        skillsFit: Number(form.scores.skillsFit) || 0,
        experienceFit: Number(form.scores.experienceFit) || 0,
        projectsFit: Number(form.scores.projectsFit) || 0,
        educationFit: Number(form.scores.educationFit) || 0,
        communicationFit: Number(form.scores.communicationFit) || 0,
      },
      generateQuiz: !!generateQuiz,
      numQuestions: Number(numQuestions) || 25,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (e2) {
      console.error("Erreur submit modal:", e2);
      setFormError("❌ Une erreur est survenue. Vérifie les champs et réessaie.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-7 pb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {isEditing ? "Modifier l’offre" : "Nouvelle offre"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Remplis les infos puis valide.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full grid place-items-center
                       text-gray-500 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-white
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {formError && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Titre du poste
            </label>
            <input
              value={form.titre}
              onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
              className="mt-2 w-full h-12 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                         focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
              placeholder="Ex: Développeur Full Stack"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Lieu
              </label>
              <input
                value={form.lieu}
                onChange={(e) => setForm((p) => ({ ...p, lieu: e.target.value }))}
                className="mt-2 w-full h-12 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                           focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
                placeholder="Ex: Tunis"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Date de clôture
              </label>
              <input
                type="date"
                value={form.dateCloture}
                onChange={(e) => setForm((p) => ({ ...p, dateCloture: e.target.value }))}
                className="mt-2 w-full h-12 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                           focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-2 w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none resize-none
                         focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
              placeholder="Décris le poste, responsabilités, mission..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Hard Skills (séparées par des virgules)
              </label>
              <input
                value={form.hardSkills}
                onChange={(e) => setForm((p) => ({ ...p, hardSkills: e.target.value }))}
                className="mt-2 w-full h-12 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                           focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
                placeholder="React, Node.js, MongoDB..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Soft Skills (séparées par des virgules)
              </label>
              <input
                value={form.softSkills}
                onChange={(e) => setForm((p) => ({ ...p, softSkills: e.target.value }))}
                className="mt-2 w-full h-12 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                           focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
                placeholder="Communication, Leadership..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-gray-500 dark:text-gray-300" size={18} />
                <p className="font-extrabold text-gray-800 dark:text-white">
                  Pondérations (total = 100%)
                </p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isValidTotal
                    ? "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-800"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                }`}
              >
                Total : {totalWeights}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCORE_ITEMS.map((it) => (
                <div key={it.key} className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {it.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.scores[it.key]}
                    onChange={(e) => setWeight(it.key, e.target.value)}
                    className="w-24 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none
                               focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
                  />
                </div>
              ))}
            </div>

            {!isValidTotal && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-semibold">
                ❌ Ajuste les valeurs pour que la somme fasse exactement 100%.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="font-extrabold text-gray-800 dark:text-white">
              Générer un quiz automatique ?
            </p>

            <div className="mt-3 flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={generateQuiz}
                  onChange={(e) => setGenerateQuiz(e.target.checked)}
                  className="h-5 w-5 accent-[#6CB33F]"
                />
                Oui, générer un quiz pour cette offre
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Questions
                </span>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={numQuestions}
                  disabled={!generateQuiz}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-24 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none disabled:opacity-50
                             focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 px-6 rounded-full border border-gray-200 dark:border-gray-600
                         text-gray-800 dark:text-gray-200 font-semibold
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting || !isValidTotal}
              className="h-12 px-7 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F]
                         dark:bg-emerald-600 dark:hover:bg-emerald-500
                         text-white font-extrabold transition-colors disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}