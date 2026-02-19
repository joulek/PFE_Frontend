"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createJob,
  getMyOffers,
  updateMyJob,
} from "../../services/job.api";
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
  BrainCircuit,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

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
    cardBorder: "border-green-200 dark:border-emerald-800",
  },
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    cardBorder: "border-amber-700 dark:border-amber-500/40"
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
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
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
   PAGE — ResponsableMetier/job/page.jsx
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
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(u);
    loadMyOffers();
  }, []);

  async function handleCreate(data) {
    try {
      await createJob(data);
      setModalOpen(false);
      setEditingJob(null);
      loadMyOffers();
    } catch (err) {
      console.error("Erreur création:", err);
    }
  }

  async function handleUpdate(data) {
    try {
      await updateMyJob(editingJob._id, data);
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
    () => jobs.map((j) => ({ ...j, _status: getJobStatus(j) })),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    if (activeTab === "all") return normalizedJobs;
    return normalizedJobs.filter((j) => j._status === activeTab);
  }, [normalizedJobs, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  const counts = useMemo(() => {
    const c = { all: normalizedJobs.length, EN_ATTENTE: 0, CONFIRMEE: 0, REJETEE: 0 };
    normalizedJobs.forEach((j) => { if (c[j._status] !== undefined) c[j._status]++; });
    return c;
  }, [normalizedJobs]);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);
  useEffect(() => { setPage(1); }, [activeTab]);

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

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Mes offres d&apos;emploi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rôle : {user?.role || "—"}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{jobs.length} offre(s) soumise(s)</p>
          </div>
          <button onClick={() => { setEditingJob(null); setModalOpen(true); }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow transition-colors flex items-center gap-2">
            <Plus size={18} /> Nouvelle offre
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: counts.all, color: "text-gray-800 dark:text-white", bg: "bg-white dark:bg-gray-800" },
            { label: "En attente", value: counts.EN_ATTENTE, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Confirmées", value: counts.CONFIRMEE, color: "text-green-700 dark:text-emerald-400", bg: "bg-green-50 dark:bg-emerald-900/20" },
            { label: "Rejetées", value: counts.REJETEE, color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-700`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${isActive ? "bg-[#6CB33F] dark:bg-emerald-600 text-white shadow-md shadow-green-500/20" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#6CB33F] dark:hover:border-emerald-500"}`}>
                {tab.label}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {counts[tab.key] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* JOBS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDesc = (job.description || "").length > 160;
            const status = job._status;
            const isPending = status === "EN_ATTENTE";
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;

            return (
              <div key={job._id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${statusConfig.cardBorder}`}>

                {/* TITLE + STATUS */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{job.titre}</h3>
                  <StatusBadge status={status} />
                </div>

                {/* REJECTION REASON */}
                {status === "REJETEE" && job.rejectionReason && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mb-3">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">Motif du rejet</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{job.rejectionReason}</p>
                  </div>
                )}

                {/* DESCRIPTION */}
                <p className={`text-gray-600 dark:text-gray-300 text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}>{job.description}</p>
                {hasLongDesc && (
                  <button type="button" onClick={() => toggleReadMore(job._id)} className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-semibold hover:underline self-start">
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                {/* TECHNOLOGIES */}
                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  {job.technologies?.map((tech, i) => (
                    <span key={i} className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-medium px-3 py-1 rounded-full border border-[#d7ebcf] dark:border-gray-600">{tech}</span>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* BOTTOM: DATES + EDIT BUTTON */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    {job.lieu && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{job.lieu}</span>
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
                        <span>{status === "CONFIRMEE" ? "Confirmée" : "Traitée"} : {formatDate(job.confirmedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ BOUTON MODIFIER — uniquement si EN_ATTENTE */}
                  {isPending && (
                    <button
                      onClick={() => { setEditingJob(job); setModalOpen(true); }}
                      title="Modifier cette offre"
                      className="h-10 w-10 rounded-full grid place-items-center
                                 text-[#4E8F2F] dark:text-emerald-400
                                 hover:bg-green-100 dark:hover:bg-emerald-900/30
                                 transition-colors "
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* EMPTY */}
          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {activeTab === "all" ? "Vous n'avez pas encore soumis d'offre." : "Aucune offre dans cette catégorie."}
              </p>
              {activeTab === "all" && (
                <button onClick={() => { setEditingJob(null); setModalOpen(true); }}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                  <Plus size={16} /> Proposer une offre
                </button>
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>Total : {filteredJobs.length} offre(s) — Page {page} / {totalPages}</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* ✅ MODAL — création + modification */}
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
   MODAL — Proposer / Modifier une offre
   ✅ Tout dans le même fichier
================================================================= */
function JobOfferModal({ open, onClose, onSubmit, initialData }) {
  const emptyForm = {
    titre: "", description: "", technologies: "", dateCloture: "", lieu: "",
    scores: { skillsFit: 30, experienceFit: 30, projectsFit: 20, educationFit: 10, communicationFit: 10 },
  };

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Quiz options
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [numQuestions, setNumQuestions] = useState(25);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        description: initialData.description || "",
        technologies: Array.isArray(initialData.technologies) ? initialData.technologies.join(", ") : initialData.technologies || "",
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

  const totalWeights = Object.values(form.scores || {}).reduce((s, v) => s + Number(v || 0), 0);
  const isValidTotal = totalWeights === 100;
  const isEditing = !!initialData;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!isValidTotal) { setFormError("❌ La somme des pondérations doit être égale à 100%"); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        titre: form.titre,
        description: form.description,
        dateCloture: form.dateCloture || null,
        technologies: String(form.technologies || "").split(",").map((t) => t.trim()).filter(Boolean),
        lieu: form.lieu || "",
        scores: form.scores,
        // ✅ Quiz metadata — stocké en base, utilisé à la confirmation admin
        ...(!isEditing && {
          generateQuiz,
          numQuestions: generateQuiz ? numQuestions : 0,
        }),
      });
    } catch { setFormError("Erreur lors de la soumission"); }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">

        {/* HEADER */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {isEditing ? "Modifier l'offre" : "Proposer une offre"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isEditing ? "Modifiez votre offre en attente." : "Votre offre sera soumise à l'administrateur pour confirmation."}
              </p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 h-10 w-10 rounded-full grid place-items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Fermer">✕</button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="space-y-5 sm:space-y-6">
              {formError && <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">{formError}</div>}

              {!isEditing && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                  <span className="text-amber-600 dark:text-amber-400 text-lg mt-0.5">⏳</span>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Votre offre sera en <strong>attente de confirmation</strong> par l&apos;administrateur avant d&apos;être publiée.</p>
                </div>
              )}

              {/* TITRE */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Titre du poste</label>
                <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Fullstack Developer (React/Node)"
                  className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Description</label>
                <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Décrivez la mission, le profil recherché..."
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
              </div>

              {/* TECH + DATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Technologies</label>
                  <input value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, Tailwind"
                    className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sépare avec une virgule.</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Date de clôture</label>
                  <input type="date" value={form.dateCloture} onChange={(e) => setForm({ ...form, dateCloture: e.target.value })}
                    className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
                </div>
              </div>

              {/* LIEU DU POSTE */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Lieu du poste</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none select-none">📍</span>
                  <input
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    placeholder="Ex: Alger, Oran, Télétravail, Hybride..."
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* ✅ QUIZ — uniquement en mode création */}
              {!isEditing && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                  {/* Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" checked={generateQuiz} onChange={(e) => setGenerateQuiz(e.target.checked)} className="sr-only" />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${generateQuiz ? "bg-[#6CB33F] dark:bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${generateQuiz ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-[#6CB33F] dark:text-emerald-400" />
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">Générer un quiz technique</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Le quiz sera généré automatiquement lors de la <strong>validation par l&apos;admin</strong>.
                      </p>
                    </div>
                  </label>

                  {/* Nombre de questions */}
                  {generateQuiz && (
                    <div className="flex items-center gap-4 pl-14">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Nombre de questions</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setNumQuestions(n => Math.max(1, n - 1))}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">−</button>
                        <input type="number" min={1} max={30} value={numQuestions}
                          onChange={(e) => { let n = parseInt(e.target.value, 10); if (isNaN(n) || n < 1) n = 1; if (n > 30) n = 30; setNumQuestions(n); }}
                          className="w-16 h-9 text-center rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#6CB33F]/20 outline-none transition-colors" />
                        <button type="button" onClick={() => setNumQuestions(n => Math.min(30, n + 1))}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">+</button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(max 30)</span>
                      </div>
                    </div>
                  )}

                  {!generateQuiz && (
                    <p className="pl-14 text-xs text-gray-400 dark:text-gray-500 italic">Aucun quiz ne sera généré. Vous pourrez en demander un plus tard.</p>
                  )}
                </div>
              )}

              {/* WEIGHTS */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">Pondérations (0 - 100)</h3>
                  <span className={`text-sm font-extrabold ${isValidTotal ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>Total: {totalWeights}%</span>
                </div>
                <div className="space-y-4">
                  {SCORE_ITEMS.map((it) => (
                    <div key={it.key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <p className="sm:flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{it.label}</p>
                      <div className="flex items-center gap-3">
                        <input type="number" min={0} max={100} value={form.scores[it.key] ?? 0} onChange={(e) => setWeight(it.key, e.target.value)}
                          className="w-24 h-11 px-4 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
                        <span className="text-sm font-extrabold text-[#4E8F2F] dark:text-emerald-400 w-10">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {!isValidTotal && <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">La somme des pondérations doit être égale à 100%.</p>}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="submit" disabled={!isValidTotal || submitting}
                className={`sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold transition-colors shadow-sm ${isValidTotal && !submitting ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}>
                {submitting ? "Envoi..." : isEditing ? "Enregistrer" : generateQuiz ? `Soumettre (quiz: ${numQuestions} questions)` : "Soumettre l'offre"}
              </button>
              <button type="button" onClick={onClose}
                className="sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}