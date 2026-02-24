"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  getJobById,
  updateJob,
  deleteJob,
  confirmJob,
  rejectJob,
  reactivateJob,
  publishJobOnLinkedIn,
  getLinkedInAuthUrl,
  checkLinkedInStatus,
  exchangeLinkedInCode,
  validateJob
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
  AlertTriangle,
  ExternalLink,
  Link2,
  Unlink,
  Send,
  ImageIcon,

} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getJobStatus(job) {
  const s = (job?.status || "").toString().toUpperCase().trim();
  if (["CONFIRMEE", "REJETEE", "EN_ATTENTE", "VALIDEE"].includes(s)) return s;
  return "EN_ATTENTE";
}

function isExpired(job) {
  if (!job?.dateCloture) return false;
  const d = new Date(job.dateCloture);
  if (Number.isNaN(d.getTime())) return false;
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return end < new Date();
}

/* ================= UI CONFIG ================= */
const STATUS_UI = {
  EN_ATTENTE: {
    label: "En attente",
    pill: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  VALIDEE: {
    label: "Validée",
    pill: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
  },
  CONFIRMEE: {
    label: "Publiée", // 👈 IMPORTANT
    pill: "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
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
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border ${className}`}>
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
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function IconActionButton({ onClick, disabled, title, className = "", children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-10 w-10 rounded-full grid place-items-center bg-white/70 dark:bg-gray-800/60 backdrop-blur border border-gray-100 dark:border-gray-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ================= LINKEDIN STATUS BADGE ================= */
function LinkedInBadge({ connected }) {
  if (connected === null) return null;
  if (connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 border border-[#0A66C2]/20">
        <span className="h-2 w-2 rounded-full bg-[#0A66C2] animate-pulse" />
        <span className="text-xs font-semibold text-[#0A66C2]">LinkedIn connecté</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
      <Unlink size={11} className="text-amber-600 dark:text-amber-400" />
      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Non connecté</span>
    </div>
  );
}

export default function RecruiterJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id;

  const [job, setJob] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [newClosingDate, setNewClosingDate] = useState("");

  // LinkedIn state
  const [liOpen, setLiOpen] = useState(false);
  const [liText, setLiText] = useState("");
  const [liConnected, setLiConnected] = useState(null); // null=chargement, true/false
  const [liConnecting, setLiConnecting] = useState(false);
  const [liJustConnected, setLiJustConnected] = useState(false);

  const status = useMemo(() => getJobStatus(job), [job]);
  const expired = useMemo(() => isExpired(job), [job]);
  const canPublishLinkedIn = status === "CONFIRMEE" && !expired;

  const ui = STATUS_UI[status] || STATUS_UI.EN_ATTENTE;
  const StatusIcon = ui.icon;
  const [liImage, setLiImage] = useState(null);
  const [liImagePreview, setLiImagePreview] = useState(null);
  const [liSuccess, setLiSuccess] = useState("");
  const [liError, setLiError] = useState("");
  const alreadyPublished = !!job?.linkedinLastPublishedAt;
  const onValidate = async () => {
  try {
    setActionLoading(true);
    await validateJob(job._id);
    await load();
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || "Erreur validation");
  } finally {
    setActionLoading(false);
  }
};


  // ✅ هل العرض متبوست قبل
  /* ================= LOAD ================= */
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
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.users) ? res.data.users
          : Array.isArray(res?.data?.data) ? res.data.data
            : [];
      setUsers(list);
    } catch { setUsers([]); }
  }

  function normalizeAdminStatus(raw) {
    const s = String(raw || "").toUpperCase().trim();
    if (["EN_ATTENTE", "VALIDEE", "PUBLIEE", "REJETEE"].includes(s)) return s;
    // legacy
    if (s === "CONFIRMEE") return "PUBLIEE";
    return "EN_ATTENTE";
  }

  function AdminStatusPill({ status }) {
    const s = normalizeAdminStatus(status);

    const map = {
      EN_ATTENTE: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      VALIDEE: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
      PUBLIEE: "bg-green-100 text-green-700 border-green-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      REJETEE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    };

    const label = {
      EN_ATTENTE: "En attente",
      VALIDEE: "Validée (interne)",
      PUBLIEE: "Publiée (public)",
      REJETEE: "Rejetée",
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${map[s]}`}>
        {label[s]}
      </span>
    );
  }
  // Vérifier statut LinkedIn
  async function checkLinkedIn() {
    try {
      const res = await checkLinkedInStatus();
      const connected = res?.data?.connected === true;
      setLiConnected(connected);
      return connected;
    } catch {
      setLiConnected(false);
      return false;
    }
  }

  // ✅ Gérer le retour OAuth LinkedIn
  // Note: le token est DÉJÀ sauvegardé par POST /linkedin/exchange-code (appelé sur la page liste)
  // Donc ici on juste affiche le toast de succès et on nettoie l'URL
  const handleLinkedInCallback = useCallback(() => {
    const linkedinParam = searchParams?.get("linkedin");

    if (linkedinParam === "connected") {
      console.log("✅ LinkedIn connecté (token déjà sauvegardé)");
      setLiConnected(true);
      setLiJustConnected(true);
      router.replace(`/recruiter/jobs/${id}`);
      setTimeout(() => setLiJustConnected(false), 4000);
    } else if (linkedinParam === "error") {
      setLiConnected(false);
      router.replace(`/recruiter/jobs/${id}`);
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    load();
    loadUsers();
    handleLinkedInCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Charger le statut LinkedIn au mount
  useEffect(() => {
    checkLinkedIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildDefaultLinkedInText(j) {
    const title = (j?.titre || "").trim();
    const lieu = (j?.lieu || "").trim();
    const desc = (j?.description || "").trim();
    const hard = Array.isArray(j?.hardSkills) ? j.hardSkills : [];
    const soft = Array.isArray(j?.softSkills) ? j.softSkills : [];

    typeof window !== "undefined"
      ? `${window.location.origin}/jobs/${j?._id}`
      : "";

    let t = "";

    /* 🔥 HEADER */
    t += `🚀 Nous recrutons \n`;
    if (title) t += ` ${title}`;
    if (lieu) t += `\n📍 ${lieu}`;

    /* 📄 DESCRIPTION */
    if (desc) {
      t += `\n\n📝 À propos du poste\n`;
      t += `${desc.slice(0, 900)}${desc.length > 900 ? "…" : ""}`;
    }

    /* 🧩 HARD SKILLS */
    if (hard.length) {
      t += `\n\n🧩 Hard skills requis\n`;
      t += `• ${hard.slice(0, 12).join("\n• ")}`;
    }

    /* 🤝 SOFT SKILLS */
    if (soft.length) {
      t += `\n\n🤝 Soft skills appréciés\n`;
      t += `• ${soft.slice(0, 12).join("\n• ")}`;
    }



    /* 🏷️ HASHTAGS */
    t += `\n\n#recrutement #hiring #emploi #jobopportunity #carrière #talent`;

    return t;
  }

  /* ================= ACTIONS ================= */
  async function onConfirm() {
    if (!job?._id) return;
    setActionLoading(true);
    try { await confirmJob(job._id); await load(); }
    catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }

  async function onReject() {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await rejectJob(job._id, rejectReason || undefined);
      setRejectOpen(false); setRejectReason(""); await load();
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }

  async function handleUpdate(data) {
    if (!job?._id) return;
    setActionLoading(true);
    try { await updateJob(job._id, data); setEditOpen(false); await load(); }
    catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }

  async function handleDeleteConfirmed() {
    if (!job?._id) return;
    setActionLoading(true);
    try { await deleteJob(job._id); setDeleteOpen(false); router.push("/recruiter/jobs"); }
    catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }

  async function handleReactivate() {
    if (!job?._id || !newClosingDate) return;
    setActionLoading(true);
    try {
      await reactivateJob(job._id, newClosingDate);
      setReactivateOpen(false); setNewClosingDate(""); await load();
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }

  // ✅ BOUTON 1: Se connecter à LinkedIn (OAuth)
  // FIX: on passe l'id du job pour que le callback redirige vers cette page
  async function handleConnectLinkedIn() {
    setLiConnecting(true);
    try {
      const res = await getLinkedInAuthUrl(id);  // ✅ passe le jobId dans le state OAuth
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setLiConnecting(false);
      }
    } catch (e) {
      console.error("Erreur URL LinkedIn:", e);
      setLiConnecting(false);
    }
  }

  // ✅ BOUTON 2: Ouvrir la modal de publication (seulement si connecté)
  async function openPublishModal() {
    setLiError("");
    setLiSuccess("");

    if (!liConnected) {
      // Re-vérifier au cas où
      const connected = await checkLinkedIn();
      if (!connected) {
        // Afficher un message inline au lieu d'une modal
        return;
      }
    }
    setLiText(buildDefaultLinkedInText(job));
    setLiOpen(true);
  }

  // ✅ Publication effective
  async function onPublishLinkedIn() {
    try {
      setActionLoading(true);
      setLiError(null);
      setLiSuccess(null);

      const formData = new FormData();
      formData.append("text", liText);

      if (liImage) {
        formData.append("image", liImage); // 👈 مهم
      }

      await publishJobOnLinkedIn(job._id, formData);

      setLiSuccess("Publié sur LinkedIn avec succès ✅");
      setLiText("");
      setLiImage(null);
      setLiImagePreview(null);

    } catch (err) {
      console.error(err);
      setLiError("Erreur lors de la publication sur LinkedIn");
    } finally {
      setActionLoading(false);
    }
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="animate-spin" /> Chargement...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
          <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
            <ArrowLeft size={16} /> Retour
          </Link>
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
            <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold">Offre introuvable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

        {/* ✅ TOAST: LinkedIn connecté avec succès */}
        {liJustConnected && (
          <div className="fixed top-6 right-6 z-[100] bg-white dark:bg-gray-800 border border-[#0A66C2]/30 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0A66C2]/10 grid place-items-center flex-shrink-0">
              <Linkedin size={20} className="text-[#0A66C2]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">LinkedIn connecté ✅</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tu peux maintenant publier tes offres</p>
            </div>
          </div>
        )}

        {/* ======= TOP HEADER ======= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
            <ArrowLeft size={16} /> Retour
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={ui.pill}>
              <StatusIcon size={14} /> {ui.label}
            </Pill>
            {status === "CONFIRMEE" && expired && (
              <Pill className={EXPIRED_UI.pill}>{EXPIRED_UI.label}</Pill>
            )}
          </div>
        </div>

        {/* ======= HERO CARD ======= */}
        <div className="mt-6 rounded-[32px] border border-gray-100 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{job.titre}</h1>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard icon={MapPin} label="Lieu" value={job.lieu || "—"} />
              <InfoCard icon={Calendar} label="Créée" value={formatDate(job.createdAt)} />
              <InfoCard icon={CalendarClock} label="Clôture" value={formatDate(job.dateCloture)} />
            </div>
          </div>
        </div>

        {/* ======= DESCRIPTION + ACTIONS ======= */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Description */}
          <div className="lg:col-span-2">
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</h2>
              <p className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">{job.description || "—"}</p>
            </div>
          </div>

          {/* ======= ACTIONS CARD ======= */}
          <div>
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</h3>
                <div className="flex items-center gap-2">
                  <IconActionButton onClick={() => setEditOpen(true)} disabled={actionLoading} title="Modifier" className="text-[#4E8F2F] hover:bg-green-50 dark:hover:bg-emerald-900/30">
                    <Edit2 size={18} />
                  </IconActionButton>
                  <IconActionButton onClick={() => setDeleteOpen(true)} disabled={actionLoading} title="Supprimer" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 size={18} />
                  </IconActionButton>
                </div>
              </div>

              {/* Confirm / Reject */}
              {/* ✅ ADMIN DOUBLE CONFIRMATION: Valider / Publier / Rejeter */}
              {(status === "EN_ATTENTE" || status === "VALIDEE") && (
                <div className="flex flex-col gap-2">
                  {/* ÉTAPE 1: VALIDER (interne) */}
                  {status === "EN_ATTENTE" && (
                    <button
                      onClick={onValidate} // ✅ nouveau handler
                      disabled={actionLoading}
                      className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                   bg-sky-600 hover:bg-sky-700 text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Valider (étape 1)
                    </button>
                  )}

                  {/* ÉTAPE 2: PUBLIER (public candidats) */}
                  {status === "VALIDEE" && (
                    <button
                      onClick={onConfirm} // ✅ nouveau handler
                      disabled={actionLoading}
                      className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                   bg-[#6CB33F] hover:bg-[#4E8F2F] text-white transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Publier (étape 2)
                    </button>
                  )}

                  {/* REJETER (toujours possible avant publication) */}
                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={actionLoading}
                    className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                 bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                  >
                    <XCircle size={16} /> Rejeter
                  </button>
                </div>
              )}
              {/* Réactiver */}
              {expired && (
                <button onClick={() => setReactivateOpen(true)} disabled={actionLoading} className="h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors disabled:opacity-50">
                  Réactiver l&apos;offre
                </button>
              )}

              {/* ========================================
                  ✅ SECTION LINKEDIN — 2 BOUTONS SÉPARÉS
              ======================================== */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">

                {/* Titre section + badge statut */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Linkedin size={16} className="text-[#0A66C2]" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">LinkedIn</span>
                  </div>
                  <LinkedInBadge connected={liConnected} />
                </div>

                <div className="flex flex-col gap-2">

                  {/* ✅ BOUTON 1: Connexion LinkedIn */}
                  <button
                    onClick={handleConnectLinkedIn}
                    disabled={liConnecting}
                    className={`h-11 px-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-colors
                      ${liConnected
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        : "bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 text-[#0A66C2] border border-[#0A66C2]/30 hover:bg-[#0A66C2]/20"
                      } disabled:opacity-50`}
                    title={
                      !liConnected
                        ? "Connecte LinkedIn d'abord"
                        : !canPublishLinkedIn
                          ? expired ? "Offre expirée" : "Disponible après confirmation de l'offre"
                          : "Publier cette offre sur LinkedIn"
                    }                  >
                    {liConnecting
                      ? <Loader2 size={16} className="animate-spin" />
                      : liConnected
                        ? <Link2 size={16} />
                        : <ExternalLink size={16} />
                    }
                    {liConnecting ? "Redirection..." : liConnected ? "Reconnecter LinkedIn" : "Connecter LinkedIn"}
                  </button>

                  {/* ✅ BOUTON 2: Publier l'offre */}
                  <button
                    onClick={openPublishModal}
                    disabled={!canPublishLinkedIn || !liConnected || actionLoading}
                    className={`h-11 px-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-colors
                      ${canPublishLinkedIn && liConnected
                        ? "bg-[#0A66C2] hover:bg-[#0856a3] text-white shadow-md shadow-[#0A66C2]/20"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      } disabled:opacity-60`}
                    title={
                      !liConnected
                        ? "Connecte LinkedIn d'abord"
                        : !canPublishLinkedIn
                          ? expired ? "Offre expirée" : "Disponible après confirmation"
                          : "Publier cette offre sur LinkedIn"
                    }
                  >
                    <Send size={15} />
                    Publier l&apos;offre
                  </button>

                  {/* Message si pas connecté et veut publier */}
                  {!liConnected && canPublishLinkedIn && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 mt-1">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                      Connecte LinkedIn d&apos;abord pour pouvoir publier.
                    </p>
                  )}
                </div>
              </div>
              {/* END LINKEDIN SECTION */}

              {status === "CONFIRMEE" && expired && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cette offre est expirée. Utilise <span className="font-semibold">Réactiver</span> pour la remettre en ligne.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======= SKILLS ======= */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Hard Skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Array.isArray(job.hardSkills) ? job.hardSkills : []).map((s, i) => (
                <span key={i} className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-[#d7ebcf] dark:border-gray-600">{s}</span>
              ))}
              {!job?.hardSkills?.length && <span className="text-sm text-gray-500 dark:text-gray-400">—</span>}
            </div>
          </div>
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Soft Skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Array.isArray(job.softSkills) ? job.softSkills : []).map((s, i) => (
                <span key={i} className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">{s}</span>
              ))}
              {!job?.softSkills?.length && <span className="text-sm text-gray-500 dark:text-gray-400">—</span>}
            </div>
          </div>
        </div>

        {/* ================= MODALS ================= */}
        <JobModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate} initialData={job} users={users} />
        <DeleteJobModal open={deleteOpen} job={job} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirmed} />

        {/* REJECT MODAL */}
        {rejectOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setRejectOpen(false); }}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
              <div className="px-8 pt-7 pb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Rejeter l&apos;offre</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job?.titre}</p>
                </div>
                <button onClick={() => setRejectOpen(false)} className="h-10 w-10 rounded-full grid place-items-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">✕</button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="px-8 py-6">
                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">Motif du rejet (optionnel)</label>
                <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 outline-none transition-colors" />
                <div className="flex justify-end gap-4 pt-6">
                  <button onClick={() => setRejectOpen(false)} className="h-12 px-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
                  <button onClick={onReject} disabled={actionLoading} className="h-12 px-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-500/30 transition-colors disabled:opacity-50">Rejeter</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REACTIVATE MODAL */}
        {reactivateOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setReactivateOpen(false); }}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden">
              <div className="px-8 pt-7 pb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Réactiver l&apos;offre</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choisis une nouvelle date de clôture.</p>
                </div>
                <button onClick={() => setReactivateOpen(false)} className="h-10 w-10 rounded-full grid place-items-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">✕</button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="px-8 py-6 space-y-4 overflow-y-auto">                <label className="block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 uppercase">Nouvelle date de clôture</label>
                <input type="date" value={newClosingDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setNewClosingDate(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/10 outline-none transition-colors" />
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setReactivateOpen(false)} className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
                  <button onClick={handleReactivate} disabled={!newClosingDate || actionLoading} className="h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50">Réactiver</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {liOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setLiOpen(false);
            }}
          >
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">

              {/* HEADER */}
              <div className="px-8 pt-8 pb-5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#0A66C2]/10 grid place-items-center">
                    <Linkedin size={22} className="text-[#0A66C2]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">Publier sur LinkedIn</h2>
                    <p className="text-sm text-gray-500">{job?.titre}</p>
                  </div>
                </div>

                <button
                  onClick={() => setLiOpen(false)}
                  className="h-10 w-10 rounded-full grid place-items-center text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-gray-200" />

              {/* BODY */}
              <div className="px-8 py-6 space-y-4 overflow-y-auto">
                {/* SUCCESS / ERROR */}
                {liSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 text-green-700">
                    {liSuccess}
                  </div>
                )}
                {liError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600">
                    {liError}
                  </div>
                )}
                {/* TEXTE */}
                <label className="text-xs font-semibold uppercase text-gray-500">
                  Texte du post
                </label>

                <textarea
                  rows={8}
                  value={liText}
                  onChange={(e) => setLiText(e.target.value)}
                  className="
    w-full px-5 py-4 rounded-2xl resize-none
    border border-gray-200 dark:border-gray-600
    bg-gray-50 dark:bg-gray-900
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40
  "
                />

                <p className="text-xs text-right text-gray-400">
                  {liText.length} / 3000 caractères
                </p>

                {/* IMAGE — IDENTIQUE À LA CAPTURE */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-gray-500">
                    Image (optionnelle)
                  </label>

                  <label
                    className="relative flex items-center justify-center w-full h-28
                       border-2 border-dashed border-gray-300
                       rounded-2xl cursor-pointer
                       text-sm text-gray-500
                       hover:bg-gray-50 transition"
                  >
                    {!liImagePreview && (
                      <span>Cliquez pour ajouter une image</span>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLiImage(file);
                        setLiImagePreview(URL.createObjectURL(file));
                      }}
                    />

                    {liImagePreview && (
                      <>
                        <img
                          src={liImagePreview}
                          alt="Preview"
                          className="absolute inset-2 object-contain rounded-xl bg-white"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLiImage(null);
                            setLiImagePreview(null);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </label>
                </div>


              </div>

              {/* FOOTER */}
              <div className="px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setLiOpen(false)}
                  className="h-11 px-6 rounded-full border"
                >
                  Annuler
                </button>

                <button
                  onClick={onPublishLinkedIn}
                  disabled={alreadyPublished || !liText.trim() || actionLoading}
                  className="h-11 px-6 rounded-full bg-[#0A66C2] text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  {alreadyPublished ? "Déjà publié" : "Publier maintenant"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}