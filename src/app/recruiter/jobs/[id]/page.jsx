"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  getJobById,
  updateJob,
  deleteJob,
  confirmJob,
  rejectJob,
  reactivateJob,
  publishJobToLinkedIn,
} from "../../../services/job.api";

import { getUsers } from "../../../services/ResponsableMetier.api";

import JobModal from "../JobModal";
import DeleteJobModal from "../DeleteJobModal";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Calendar,
  CalendarClock,
  MapPin,
  Linkedin,
  Share2,
  Briefcase,
  Loader2,
  Clock,
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

// ✅ robust: compare "date only" (avoid timezone surprises)
function isExpired(job) {
  if (!job?.dateCloture) return false;

  const d = new Date(job.dateCloture);
  if (Number.isNaN(d.getTime())) return false;

  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return end < new Date();
}

/* ================= UI CONFIG ================= */
const STATUS_UI = {
  CONFIRMEE: {
    label: "Confirmée",
    pill: "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  EN_ATTENTE: {
    label: "En attente",
    pill: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  REJETEE: {
    label: "Rejetée",
    pill: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};

const EXPIRED_UI = {
  label: "Expirée",
  pill: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600",
};

function Pill({ className, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border ${className}`}
    >
      {children}
    </span>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl grid place-items-center bg-[#E9F5E3] dark:bg-emerald-900/25 text-[#4E8F2F] dark:text-emerald-400">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [job, setJob] = useState(null);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [newClosingDate, setNewClosingDate] = useState("");

  const [liOpen, setLiOpen] = useState(false);
  const [liText, setLiText] = useState("");
  const [liError, setLiError] = useState("");
  const [liSuccess, setLiSuccess] = useState("");

  const status = useMemo(() => getJobStatus(job), [job]);
  const expired = useMemo(() => isExpired(job), [job]);
  const canPublishLinkedIn = status === "CONFIRMEE" && !expired;

  const ui = STATUS_UI[status] || STATUS_UI.EN_ATTENTE;
  const StatusIcon = ui.icon;
  const LinkedinIcon = Linkedin || Share2;

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getJobById(id);
      setJob(res?.data || null);
    } catch (e) {
      console.error("Erreur chargement offre:", e);
      setJob(null);
    } finally {
      setLoading(false);
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
    load();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function buildDefaultLinkedInText(j) {
    const title = (j?.titre || "").trim();
    const lieu = (j?.lieu || "").trim();
    const desc = (j?.description || "").trim();

    const hard = Array.isArray(j?.hardSkills) ? j.hardSkills : [];
    const soft = Array.isArray(j?.softSkills) ? j.softSkills : [];

    const publicLink = `${window.location.origin}/jobs/${j?._id}`;

    let t = `🚀 ${title || "Offre d'emploi"}`;
    if (lieu) t += `\n📍 ${lieu}`;
    if (desc) t += `\n\n${desc.slice(0, 900)}`;
    if (hard.length) t += `\n\n🧩 Hard skills: ${hard.slice(0, 12).join(", ")}`;
    if (soft.length) t += `\n🤝 Soft skills: ${soft.slice(0, 12).join(", ")}`;
    t += `\n\n👉 Postuler: ${publicLink}`;
    t += `\n\n#recrutement #emploi`;
    return t;
  }

  /* ================= ACTIONS ================= */
  async function onConfirm() {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await confirmJob(job._id);
      await load();
    } catch (e) {
      console.error("Erreur confirmation:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function onReject() {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await rejectJob(job._id, rejectReason || undefined);
      setRejectOpen(false);
      setRejectReason("");
      await load();
    } catch (e) {
      console.error("Erreur rejet:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(data) {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await updateJob(job._id, data);
      setEditOpen(false);
      await load();
    } catch (e) {
      console.error("Erreur update:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await deleteJob(job._id);
      setDeleteOpen(false);
      router.push("/recruiter/jobs"); // ✅ KEEP YOUR ROUTE
    } catch (e) {
      console.error("Erreur suppression:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    if (!job?._id || !newClosingDate) return;
    setActionLoading(true);
    try {
      await reactivateJob(job._id, newClosingDate);
      setReactivateOpen(false);
      setNewClosingDate("");
      await load();
    } catch (err) {
      console.error("Erreur réactivation:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function onPublishLinkedIn() {
    if (!job?._id) return;

    setLiError("");
    setLiSuccess("");
    setActionLoading(true);

    try {
      await publishJobToLinkedIn(job._id, liText);
      setLiSuccess("Publié sur LinkedIn ✅");
      await load();
    } catch (e) {
      console.error("Publish LinkedIn error:", e);
      setLiError("Échec de publication LinkedIn. Vérifie la connexion/permissions.");
    } finally {
      setActionLoading(false);
    }
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
          <Link
            href="/recruiter/jobs" // ✅ KEEP YOUR ROUTE
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
            <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold">
              Offre introuvable
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              L&apos;ID est invalide ou l&apos;offre a été supprimée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        {/* ======= TOP HEADER ======= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/recruiter/jobs" // ✅ KEEP YOUR ROUTE
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            <Pill className={ui.pill}>
              <StatusIcon size={14} />
              {ui.label}
            </Pill>

            {status === "CONFIRMEE" && expired && (
              <Pill className={EXPIRED_UI.pill}>{EXPIRED_UI.label}</Pill>
            )}

            <button
              onClick={() => setDeleteOpen(true)}
              disabled={actionLoading}
              title="Supprimer"
              className="h-10 w-10 rounded-full grid place-items-center
                         text-red-500 dark:text-red-400
                         bg-white/70 dark:bg-gray-800/60 backdrop-blur
                         border border-gray-100 dark:border-gray-700
                         hover:bg-red-50 dark:hover:bg-red-900/30
                         transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>

            <button
              onClick={() => setEditOpen(true)}
              disabled={actionLoading}
              title="Modifier"
              className="h-10 w-10 rounded-full grid place-items-center
                         text-[#4E8F2F] dark:text-emerald-400
                         bg-white/70 dark:bg-gray-800/60 backdrop-blur
                         border border-gray-100 dark:border-gray-700
                         hover:bg-green-50 dark:hover:bg-emerald-900/30
                         transition-colors disabled:opacity-50"
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        {/* ======= HERO CARD ======= */}
        <div className="mt-6 rounded-[32px] border border-gray-100 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              {job.titre}
            </h1>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard icon={MapPin} label="Lieu" value={job.lieu || "—"} />
              <InfoCard icon={Calendar} label="Créée" value={formatDate(job.createdAt)} />
              <InfoCard
                icon={CalendarClock}
                label="Clôture"
                value={formatDate(job.dateCloture)}
              />
            </div>
          </div>
        </div>

        {/* ======= DESCRIPTION + ACTIONS ======= */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description (takes 2/3) */}
          <div className="lg:col-span-2">
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description
              </h2>
              <p className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                {job.description || "—"}
              </p>
            </div>
          </div>

          {/* Actions (takes 1/3) */}
          <div>
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actions
              </h3>

              <div className="mt-5 flex flex-col gap-3">
                {status === "EN_ATTENTE" && (
                  <>
                    <button
                      onClick={onConfirm}
                      disabled={actionLoading}
                      className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                                 bg-[#6CB33F] hover:bg-[#4E8F2F]
                                 dark:bg-emerald-600 dark:hover:bg-emerald-500
                                 text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} />
                      Confirmer
                    </button>

                    <button
                      onClick={() => setRejectOpen(true)}
                      disabled={actionLoading}
                      className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                                 bg-red-500 hover:bg-red-600
                                 dark:bg-red-600 dark:hover:bg-red-500
                                 text-white transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Rejeter
                    </button>
                  </>
                )}

                {expired && (
                  <button
                    onClick={() => setReactivateOpen(true)}
                    disabled={actionLoading}
                    className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center
                               bg-blue-100 dark:bg-blue-900/30
                               text-blue-700 dark:text-blue-300
                               hover:bg-blue-200 dark:hover:bg-blue-800/40
                               transition-colors disabled:opacity-50"
                  >
                    Réactiver
                  </button>
                )}

                <button
                  onClick={() => {
                    setLiError("");
                    setLiSuccess("");
                    setLiText(buildDefaultLinkedInText(job));
                    setLiOpen(true);
                  }}
                  disabled={!canPublishLinkedIn || actionLoading}
                  className={`h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-colors
                    ${
                      canPublishLinkedIn
                        ? "bg-[#0A66C2] hover:bg-[#0856a3] text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  title={
                    canPublishLinkedIn
                      ? "Publier sur LinkedIn"
                      : expired
                      ? "Offre expirée (réactive-la d'abord)"
                      : "Disponible après confirmation"
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <LinkedinIcon size={18} />
                    Publier LinkedIn
                  </span>
                </button>
              </div>

              {status === "CONFIRMEE" && expired && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Cette offre est expirée. Utilise{" "}
                  <span className="font-semibold">Réactiver</span> pour définir une
                  nouvelle date.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ ======= SKILLS FULL WIDTH (occupy space under description + actions) ======= */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hard Skills */}
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Hard skills
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Array.isArray(job.hardSkills) ? job.hardSkills : []).map((s, i) => (
                <span
                  key={i}
                  className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400
                             text-xs font-semibold px-3 py-1 rounded-full
                             border border-[#d7ebcf] dark:border-gray-600"
                >
                  {s}
                </span>
              ))}
              {!job?.hardSkills?.length && (
                <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
              )}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Soft skills
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Array.isArray(job.softSkills) ? job.softSkills : []).map((s, i) => (
                <span
                  key={i}
                  className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300
                             text-xs font-semibold px-3 py-1 rounded-full
                             border border-blue-100 dark:border-blue-900"
                >
                  {s}
                </span>
              ))}
              {!job?.softSkills?.length && (
                <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
              )}
            </div>
          </div>
        </div>

        {/* ================= MODALS ================= */}
        <JobModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          initialData={job}
          users={users}
        />

        <DeleteJobModal
          open={deleteOpen}
          job={job}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirmed}
        />

        {/* REJECT MODAL */}
        {rejectOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setRejectOpen(false);
            }}
          >
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
              <div className="px-8 pt-7 pb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Rejeter l&apos;offre
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {job?.titre}
                  </p>
                </div>
                <button
                  onClick={() => setRejectOpen(false)}
                  className="h-10 w-10 rounded-full grid place-items-center
                             text-gray-500 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="px-8 py-6">
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Motif du rejet (optionnel)
                </label>

                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500 resize-none
                             focus:border-red-400 dark:focus:border-red-500
                             focus:ring-4 focus:ring-red-500/10 outline-none transition-colors"
                />

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => setRejectOpen(false)}
                    className="h-12 px-8 rounded-full border border-gray-200 dark:border-gray-600
                               text-gray-800 dark:text-gray-200 font-semibold
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={onReject}
                    disabled={actionLoading}
                    className="h-12 px-8 rounded-full bg-red-500 hover:bg-red-600
                               dark:bg-red-600 dark:hover:bg-red-500 text-white font-semibold
                               shadow-md shadow-red-500/30 transition-colors disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REACTIVATE MODAL */}
        {reactivateOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setReactivateOpen(false);
            }}
          >
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
              <div className="px-8 pt-7 pb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Réactiver l&apos;offre
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choisis une nouvelle date de clôture.
                  </p>
                </div>
                <button
                  onClick={() => setReactivateOpen(false)}
                  className="h-10 w-10 rounded-full grid place-items-center
                             text-gray-500 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="px-8 py-6 space-y-4">
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Nouvelle date de clôture
                </label>

                <input
                  type="date"
                  value={newClosingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNewClosingDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                             focus:border-[#6CB33F] dark:focus:border-emerald-500
                             focus:ring-4 focus:ring-[#6CB33F]/10 outline-none transition-colors"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setReactivateOpen(false)}
                    className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-600
                               text-gray-800 dark:text-gray-200 font-semibold
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={handleReactivate}
                    disabled={!newClosingDate || actionLoading}
                    className="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700
                               text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    Réactiver
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINKEDIN MODAL */}
        {liOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setLiOpen(false);
            }}
          >
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden">
              <div className="px-8 pt-8 pb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Publier sur LinkedIn
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {job?.titre}
                  </p>
                </div>
                <button
                  onClick={() => setLiOpen(false)}
                  className="h-10 w-10 rounded-full grid place-items-center
                             text-gray-500 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-white
                             hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="px-8 py-6 space-y-4">
                <textarea
                  rows={8}
                  value={liText}
                  onChange={(e) => setLiText(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500 resize-none
                             focus:border-[#6CB33F] dark:focus:border-emerald-500
                             focus:ring-4 focus:ring-[#6CB33F]/10 outline-none transition-colors"
                />

                {liError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{liError}</p>
                )}
                {liSuccess && (
                  <p className="text-sm text-green-700 dark:text-emerald-400">
                    {liSuccess}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setLiOpen(false)}
                    className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-600
                               text-gray-800 dark:text-gray-200 font-semibold
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={onPublishLinkedIn}
                    disabled={!liText.trim() || actionLoading}
                    className="h-11 px-6 rounded-full bg-[#0A66C2] hover:bg-[#0856a3]
                               text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    Publier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}