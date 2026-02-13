"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createJob,
  getMyOffers,
} from "../../services/job.api";
import Pagination from "../../components/Pagination";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
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
    cardBorder: "border-amber-300 dark:border-amber-700",
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
   PAGE PRINCIPALE — ResponsableMetier/job/page.jsx
================================================================= */
export default function UserJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedJobs, setExpandedJobs] = useState({});

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  /* ---- loader ---- */
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

  /* ---- handlers ---- */
  async function handleCreate(data) {
    try {
      await createJob(data);
      setModalOpen(false);
      loadMyOffers();
    } catch (err) {
      console.error("Erreur création:", err);
    }
  }

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  }

  /* ---- normalize + filter + paginate ---- */
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
    normalizedJobs.forEach((j) => {
      if (c[j._status] !== undefined) c[j._status]++;
    });
    return c;
  }, [normalizedJobs]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

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

        {/* ========== HEADER ========== */}
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

          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-6 py-3 rounded-xl
                       font-semibold shadow transition-colors
                       flex items-center gap-2"
          >
            <Plus size={18} />
            Proposer une offre
          </button>
        </div>

        {/* ========== STATS ========== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: counts.all, color: "text-gray-800 dark:text-white", bg: "bg-white dark:bg-gray-800" },
            { label: "En attente", value: counts.EN_ATTENTE, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Confirmées", value: counts.CONFIRMEE, color: "text-green-700 dark:text-emerald-400", bg: "bg-green-50 dark:bg-emerald-900/20" },
            { label: "Rejetées", value: counts.REJETEE, color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-700`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ========== TABS ========== */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? "bg-[#6CB33F] dark:bg-emerald-600 text-white shadow-md shadow-green-500/20"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#6CB33F] dark:hover:border-emerald-500"
                  }`}
              >
                {tab.label}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ========== JOBS GRID ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDesc = (job.description || "").length > 160;
            const status = job._status;
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${statusConfig.cardBorder}`}
              >
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
                <p className={`text-gray-600 dark:text-gray-300 text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}>
                  {job.description}
                </p>
                {hasLongDesc && (
                  <button type="button" onClick={() => toggleReadMore(job._id)} className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-semibold hover:underline self-start">
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                {/* TECHNOLOGIES */}
                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  {job.technologies?.map((tech, i) => (
                    <span key={i} className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-medium px-3 py-1 rounded-full border border-[#d7ebcf] dark:border-gray-600">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* DATES */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mt-auto">
                  <div className="flex items-center gap-2">
                    <span>📅</span><span>Créée : {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏳</span><span>Clôture : {formatDate(job.dateCloture)}</span>
                  </div>
                  {job.confirmedAt && (
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>{status === "CONFIRMEE" ? "Confirmée" : "Traitée"} : {formatDate(job.confirmedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* EMPTY */}
          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {activeTab === "all" ? "Vous n'avez pas encore soumis d'offre." : "Aucune offre dans cette catégorie."}
              </p>
              {activeTab === "all" && (
                <button onClick={() => setModalOpen(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
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

      {/* ✅ MODAL — intégré dans le même fichier */}
      <JobOfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

/* =================================================================
   COMPOSANT MODAL — Proposer une offre
   ✅ TOUT DANS LE MÊME FICHIER — pas d'import séparé
================================================================= */
function JobOfferModal({ open, onClose, onSubmit }) {
  const emptyForm = {
    titre: "",
    description: "",
    technologies: "",
    dateCloture: "",
    scores: { skillsFit: 30, experienceFit: 30, projectsFit: 20, educationFit: 10, communicationFit: 10 },
  };

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setForm(emptyForm); setFormError(""); }
  }, [open]);

  if (!open) return null;

  function setWeight(key, value) {
    setFormError("");
    let v = Number(value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: v } }));
  }

  const totalWeights = Object.values(form.scores || {}).reduce((s, v) => s + Number(v || 0), 0);
  const isValidTotal = totalWeights === 100;

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
        scores: form.scores,
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
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">Proposer une offre</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Votre offre sera soumise à l&apos;administrateur pour confirmation.</p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 h-10 w-10 rounded-full grid place-items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Fermer">✕</button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="space-y-5 sm:space-y-6">
              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">{formError}</div>
              )}

              {/* INFO */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                <span className="text-amber-600 dark:text-amber-400 text-lg mt-0.5">⏳</span>
                <p className="text-sm text-amber-700 dark:text-amber-300">Votre offre sera en <strong>attente de confirmation</strong> par l&apos;administrateur avant d&apos;être publiée.</p>
              </div>

              {/* TITRE */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Titre du poste</label>
                <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Fullstack Developer (React/Node)"
                  className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Description</label>
                <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Décrivez la mission, le profil recherché, responsabilités..."
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

              {/* WEIGHTS */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">Pondérations (0 - 100)</h3>
                  <span className={`text-sm font-extrabold ${isValidTotal ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>Total: {totalWeights}%</span>
                </div>
                <div className="space-y-4">
                  {SCORE_ITEMS.map((it) => {
                    const v = form.scores[it.key] ?? 0;
                    return (
                      <div key={it.key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <p className="sm:flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{it.label}</p>
                        <div className="flex items-center gap-3">
                          <input type="number" min={0} max={100} value={v} onChange={(e) => setWeight(it.key, e.target.value)}
                            className="w-24 h-11 px-4 rounded-xl sm:rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors" />
                          <span className="text-sm font-extrabold text-[#4E8F2F] dark:text-emerald-400 w-10">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!isValidTotal && <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">La somme des pondérations doit être égale à 100% pour pouvoir enregistrer.</p>}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="submit" disabled={!isValidTotal || submitting}
                className={`sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold transition-colors shadow-sm ${isValidTotal && !submitting ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}>
                {submitting ? "Envoi en cours..." : "Soumettre l'offre"}
              </button>
              <button type="button" onClick={() => { setForm(emptyForm); setFormError(""); onClose(); }}
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
