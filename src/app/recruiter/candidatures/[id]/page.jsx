"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare
} from "lucide-react";

import {
  getApplicationById,
  updateApplicationStatus
} from "../../../services/application.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    year: "numeric"
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  const digits = phone.replace(/\s+/g, "");
  if (/^\+216\d{8}$/.test(digits))
    return `+216 ${digits.slice(4, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  if (/^\d{8}$/.test(digits))
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: "En attente",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock
  },
  VU: {
    label: "Vu",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Eye
  },
  RETENU: {
    label: "Retenu",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle2
  },
  REJETE: {
    label: "Rejeté",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle
  }
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    getApplicationById(id)
      .then((res) => setApp(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status) {
    setUpdating(true);
    await updateApplicationStatus(id, status);
    setApp((prev) => ({ ...prev, status }));
    setUpdating(false);
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FAF0] dark:bg-gray-950">
        <div className="animate-spin h-6 w-6 border-2 border-[#6CB33F] border-t-transparent rounded-full" />
      </div>
    );

  if (!app) return null;

  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.EN_ATTENTE;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">



        <div className="bg-[#E9F5E3] dark:bg-emerald-950/20 rounded-3xl p-8 shadow flex items-center justify-between">

          <div className="flex items-center gap-5">

            <div className="h-16 w-16 rounded-full bg-[#6CB33F] text-white flex items-center justify-center font-bold text-xl">
              {app.prenom?.[0]}
              {app.nom?.[0]}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {app.prenom} {app.nom}
              </h1>

              <p className="text-[#6CB33F] font-medium">
                {app.posteRecherche}
              </p>


            </div>
          </div>

          <span
            className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold ${status.color}`}
          >
            <StatusIcon size={14} />
            {status.label}
          </span>

        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <div className="grid sm:grid-cols-2 gap-4">

              <InfoCard
                icon={<Mail size={16} />}
                label={<span className="font-bold text-gray-900 dark:text-white">E-mail</span>}
                value={app.email}
              />

              <InfoCard
                icon={<Phone size={16} />}
                label={<span className="font-bold text-gray-900 dark:text-white">Téléphone</span>}
                value={formatPhone(app.telephone)}
              />

              <InfoCard
                icon={<Calendar size={16} />}
                label={<span className="font-bold text-gray-900 dark:text-white">Date</span>}
                value={formatDate(app.createdAt)}
              />

              <InfoCard
                icon={<User size={16} />}
                label={<span className="font-bold text-gray-900 dark:text-white">Type</span>}
                value={
                  app.type === "STAGIAIRE"
                    ? "Stage de fin d'études"
                    : "Candidature"
                }
              />

            </div>

            {app.message && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">

                <h3 className="font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
                  <MessageSquare size={16} />
                  Message de motivation
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {app.message}
                </p>

              </div>
            )}

          </div>

          <div className="space-y-6">

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow text-center">

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 mb-5">

                <FileText
                  size={40}
                  className="mx-auto text-[#6CB33F]"
                />

                <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">
                  CV_{app.nom}.pdf
                </p>

                <p className="text-xs text-gray-400">
                  PDF
                </p>

              </div>

              <a
                href={getCvUrl(app.cvUrl)}
                target="_blank"
                className="inline-flex items-center gap-2 bg-[#6CB33F] text-white px-5 py-3 rounded-full font-semibold hover:bg-[#5aa631] transition"
              >
                <Download size={16} />
                Voir le CV
              </a>

            </div>


          </div>

        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow flex flex-wrap justify-between items-center gap-4">

          <div className="flex gap-3">

            <button
              onClick={() => updateStatus("VU")}
              disabled={updating} data-cy="btn-vu"
              className="px-5 py-2 rounded-full border text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Marquer comme vu
            </button>

            <button
              onClick={() => updateStatus("EN_ATTENTE")}
              disabled={updating}  data-cy="btn-reset"
              className="px-5 py-2 rounded-full border text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Réinitialiser
            </button>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() => updateStatus("REJETE")}
              disabled={updating} data-cy="btn-refuser"
              className="px-5 py-2 rounded-full bg-red-100 text-red-600 font-semibold"
            >
              Refuser
            </button>

            <button
              onClick={() => updateStatus("RETENU")}
              disabled={updating} data-cy="btn-accepter"
              className="px-5 py-2 rounded-full bg-[#6CB33F] text-white font-semibold"
            >
              Accepter la candidature
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex items-center gap-3">

      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#F0FAF0] dark:bg-gray-700 text-[#6CB33F]">
        {icon}
      </div>

      <div>
        <p className="text-xs uppercase text-gray-400">{label}</p>

        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {value}
        </p>
      </div>

    </div>
  );
}