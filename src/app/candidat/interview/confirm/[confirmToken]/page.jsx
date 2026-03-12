"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getConfirmInfo,
  confirmInterview,
} from "../../../../services/calendar.api.js";
import {
  CalendarDays,
  Clock,
  MapPin,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

function formatDateFR(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ConfirmInterviewPage() {
  const { confirmToken } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [iv, setIv] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!confirmToken) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMsg("");

        const res = await getConfirmInfo(confirmToken);

        if (!mounted) return;
        setIv(res?.data?.data || res?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Lien invalide ou expiré.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [confirmToken]);

  const alreadyConfirmed = useMemo(() => {
    const s = String(iv?.status || "").toUpperCase();
    return s === "CONFIRMED";
  }, [iv]);

  async function handleConfirm() {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMsg("");

      const res = await confirmInterview(confirmToken);

      const msg = res?.data?.message || "Entretien confirmé !";
      setSuccessMsg(msg);

      try {
        const ref = await getConfirmInfo(confirmToken);
        setIv(ref?.data?.data || ref?.data || null);
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.error || "Impossible de confirmer. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F8F1] dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[28px] shadow-[0_12px_40px_rgba(16,24,40,0.08)] border border-[#E4EBDC] dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-[#6FB43F] px-6 sm:px-8 py-8 sm:py-10 text-center">
          <div className="text-white text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-none">
            Optylab
          </div>
          <div className="text-white/95 mt-2 text-[17px] sm:text-[18px] font-medium">
            Les experts de la vision
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Loading */}
          {loading && (
            <div className="text-gray-600 dark:text-gray-300">
              Chargement...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-5 py-4 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Success */}
          {!loading && successMsg && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              {successMsg}
            </div>
          )}

          {/* Infos */}
          {!loading && iv && !error && (
            <>
              <div >
                <h1 className="text-[30px] sm:text-[30px] font-extrabold text-[#4E9A2F] dark:text-[#8FD168] leading-[1.15]">
                  Invitation à un entretien RH
                </h1>

                <p className="mt-5 text-[18px] text-gray-700 dark:text-gray-200">
                  Bonjour{" "}
                  <span className="font-semibold text-[#1F2937] dark:text-white">
                    {iv?.candidateName || "Candidat"}
                  </span>
                  ,
                </p>
              </div>

              <div className="mt-8 ">
                <div className="text-gray-500 dark:text-gray-400 text-[15px]">
                  Poste
                </div>
                <div className="mt-2 text-[26px] sm:text-[27px] font-extrabold text-[#4E9A2F] dark:text-[#8FD168] leading-tight break-words">
                  {iv?.jobTitle || "Poste à définir"}
                </div>
              </div>

              <div className="mt-8 rounded-[26px] bg-[#F2F8EE] dark:bg-emerald-950/20 border border-[#CFE5C6] dark:border-emerald-900/40 p-5 sm:p-6 space-y-4">
                <InfoRow
                  icon={<CalendarDays className="w-5 h-5" />}
                  label="Date"
                  value={formatDateFR(iv?.date || iv?.proposedDate)}
                />
                <InfoRow
                  icon={<Clock className="w-5 h-5" />}
                  label="Heure"
                  value={iv?.time || "10:00"}
                />
                <InfoRow
                  icon={<MapPin className="w-5 h-5" />}
                  label="Lieu"
                  value={iv?.location || "Optylab / Teams"}
                />
                <InfoRow
                  icon={<Briefcase className="w-5 h-5" />}
                  label="Type"
                  value={iv?.typeLabel || "Entretien RH"}
                />
              </div>

              <div className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
                En confirmant, le recruteur sera notifié dans l’application et
                par email.
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleConfirm}
                  disabled={loading || submitting || alreadyConfirmed || !iv}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 min-w-[220px] font-semibold text-base
                             bg-[#6FB43F] text-white shadow-sm transition-all duration-200
                             hover:bg-[#639F39]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  title={alreadyConfirmed ? "Déjà confirmé" : "Confirmer l'entretien"}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {alreadyConfirmed
                    ? "Confirmé"
                    : submitting
                    ? "Confirmation..."
                    : "Confirmer"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start sm:items-center gap-4">
      <div className="mt-0.5 sm:mt-0 text-[#5AA233] dark:text-[#8FD168] shrink-0">
        {icon}
      </div>

      <div className="w-20 shrink-0 text-gray-600 dark:text-gray-300 font-medium">
        {label}
      </div>

      <div className="font-bold text-gray-900 dark:text-gray-100 break-words">
        {value}
      </div>
    </div>
  );
}