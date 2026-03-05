"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { getApplicationById, updateApplicationStatus } from "../../../services/application.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getCvUrl(cvUrl) {
  if (!cvUrl) return null;
  if (cvUrl.startsWith("http")) return cvUrl;
  return `${API_URL}${cvUrl}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
    icon: Clock,
  },
  VU: {
    label: "Vu",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    icon: Eye,
  },
  RETENU: {
    label: "Retenu",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700",
    icon: CheckCircle2,
  },
  REJETE: {
    label: "Rejeté",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
    icon: XCircle,
  },
};

const STATUS_ACTIONS = [
  { key: "VU", label: "Marquer comme vu", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { key: "RETENU", label: "Retenir", color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { key: "REJETE", label: "Rejeter", color: "bg-red-500 hover:bg-red-600 text-white" },
];

export default function SpontaneousDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplicationById(id)
      .then((res) => setApp(res?.data || null))
      .catch(() => setError("Impossible de charger la candidature."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(status) {
    if (!app) return;
    setUpdating(true);
    try {
      await updateApplicationStatus(id, status);
      setApp((prev) => ({ ...prev, status }));
    } catch {
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-red-500">{error || "Candidature introuvable."}</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;
  const StatusIcon = statusCfg.icon;
  const isStage = app.type === "STAGIAIRE";

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </button>

        {/* CARD PRINCIPALE */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden">

          {/* HEADER coloré */}
          <div className={`px-8 py-6 ${isStage ? "bg-blue-50 dark:bg-blue-950/30" : "bg-[#F0FAF0] dark:bg-emerald-950/20"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar initiales */}
                <div className={`h-16 w-16 rounded-2xl grid place-items-center text-xl font-extrabold text-white shrink-0 ${isStage ? "bg-blue-500" : "bg-[#6CB33F]"}`}>
                  {(app.prenom?.[0] || "?").toUpperCase()}{(app.nom?.[0] || "").toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {app.prenom} {app.nom}
                  </h1>
                  {app.posteRecherche && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {isStage ? (
                        <GraduationCap size={14} className="text-blue-500" />
                      ) : (
                        <Briefcase size={14} className="text-[#6CB33F]" />
                      )}
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {app.posteRecherche}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <span className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                <StatusIcon size={14} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          <div className="px-8 py-8 space-y-8">

            {/* INFOS DE CONTACT */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Informations de contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="h-9 w-9 rounded-xl bg-white dark:bg-gray-700 shadow-sm grid place-items-center shrink-0">
                    <Mail size={16} className="text-[#6CB33F]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{app.email}</p>
                  </div>
                </div>

                {app.telephone && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-gray-700 shadow-sm grid place-items-center shrink-0">
                      <Phone size={16} className="text-[#6CB33F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Téléphone</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{app.telephone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="h-9 w-9 rounded-xl bg-white dark:bg-gray-700 shadow-sm grid place-items-center shrink-0">
                    <Calendar size={16} className="text-[#6CB33F]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Date de réception</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatDate(app.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="h-9 w-9 rounded-xl bg-white dark:bg-gray-700 shadow-sm grid place-items-center shrink-0">
                    <User size={16} className="text-[#6CB33F]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Type</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {isStage ? "Demande de stage" : "Candidature spontanée"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MESSAGE */}
            {app.message && (
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                  <MessageSquare size={13} />
                  Message de motivation
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5">
                  <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {app.message}
                  </p>
                </div>
              </div>
            )}

            {/* CV */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                <FileText size={13} />
                CV
              </h2>
              {app.cvUrl ? (
                <a
                  href={getCvUrl(app.cvUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 font-semibold text-sm hover:bg-[#d4edca] dark:hover:bg-emerald-950/60 transition-colors border border-[#6CB33F]/30"
                >
                  <FileText size={16} />
                  Télécharger le CV
                </a>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Aucun CV joint à cette candidature.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* ACTIONS STATUT */}
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Changer le statut
              </h2>
              <div className="flex flex-wrap gap-3">
                {STATUS_ACTIONS.filter((a) => a.key !== app.status).map((action) => (
                  <button
                    key={action.key}
                    onClick={() => handleStatusChange(action.key)}
                    disabled={updating}
                    className={`h-10 px-6 rounded-full font-semibold text-sm transition-colors ${action.color} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {updating ? "..." : action.label}
                  </button>
                ))}
                {app.status !== "EN_ATTENTE" && (
                  <button
                    onClick={() => handleStatusChange("EN_ATTENTE")}
                    disabled={updating}
                    className="h-10 px-6 rounded-full font-semibold text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
                  >
                    Remettre en attente
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}