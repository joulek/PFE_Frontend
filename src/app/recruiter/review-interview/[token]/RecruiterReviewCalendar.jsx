"use client";
// app/recruiter/review-interview/[token]/RecruiterReviewCalendar.jsx

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  User,
  Briefcase,
  XCircle,
  Info,
  ArrowLeftRight,
} from "lucide-react";
import OutlookCalendar from "../../../components/Googlecalendar";
import api from "../../../services/api";

/* ── Modal détails entretien ───────────────────────────────────────────── */
function InterviewDetailsModal({
  open,
  interview,
  onClose,
  onAccept,
  accepting,
  acceptErr,
}) {
  if (!open || !interview) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-[28px] bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 sm:px-8 py-6 bg-[#6CB33F]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/75 text-[11px] font-bold uppercase tracking-[0.16em]">
                Entretien RH + Technique
              </p>
              <h2 className="mt-1 text-white text-2xl font-extrabold">
                Détails de la proposition
              </h2>
              <p className="mt-1 text-white/85 text-sm">
                Vérifiez les informations puis acceptez cette date si elle vous convient.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard
              icon={<User className="w-4 h-4" />}
              label="Candidat"
              value={interview.candidateName || "—"}
            />
            <InfoCard
              icon={<Briefcase className="w-4 h-4" />}
              label="Poste"
              value={interview.jobTitle || "—"}
            />
            <InfoCard
              icon={<Calendar className="w-4 h-4" />}
              label="Date proposée"
              value={interview.date || "—"}
            />
            <InfoCard
              icon={<Clock className="w-4 h-4" />}
              label="Heure"
              value={interview.time || "—"}
            />
          </div>

          {acceptErr && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{acceptErr}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Fermer
            </button>

            <button
              onClick={onAccept}
              disabled={accepting}
              className="px-5 py-3 rounded-xl bg-[#6CB33F] hover:bg-[#5AA531] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {accepting ? "Acceptation..." : "Accepter cette date"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#DCE7D5] dark:border-gray-800 bg-[#F8FBF6] dark:bg-gray-800/60 px-4 py-4">
      <div className="flex items-center gap-2 text-[#5C9E35] dark:text-emerald-400 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-[17px] font-extrabold text-[#0F172A] dark:text-white break-words">
        {value}
      </p>
    </div>
  );
}

/* ── Modal choix heure après clic sur date ─────────────────────────────── */
function TimePickModal({ open, date, onClose, onSubmit, loading, error, ok }) {
  const [time, setTime] = useState("10:00");

  useEffect(() => {
    if (open) {
      setTime("10:00");
    }
  }, [open]);

  if (!open) return null;

  const dateFR = date
    ? new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[28px] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-5 bg-[#6CB33F] text-white">
          <p className="text-white/75 text-[11px] font-bold uppercase tracking-[0.16em] mb-1">
            Contre-proposition
          </p>
          <h2 className="text-white font-extrabold text-xl">
            Proposer ce créneau
          </h2>
          {dateFR && (
            <p className="text-white/85 text-sm mt-1 font-semibold capitalize">
              {dateFR}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Heure de début
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold outline-none focus:ring-2 focus:ring-[#6CB33F]"
            />
            <p className="mt-2 text-xs text-gray-400">
              Durée estimée : 1 heure
            </p>
          </div>

          {ok && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                Contre-proposition envoyée au responsable
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onSubmit(time)}
              disabled={!date || !time || loading || ok}
              className="flex-[2] py-3 rounded-xl bg-[#6CB33F] hover:bg-[#5AA531] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {loading ? "Envoi..." : "Proposer ce créneau"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */
export default function RecruiterReviewCalendar({ token }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoAccept = searchParams.get("action") === "accept";

  const [interview, setInterview] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState(null);

  const [accepting, setAccepting] = useState(false);
  const [acceptOk, setAcceptOk] = useState(false);
  const [acceptErr, setAcceptErr] = useState(null);

  const [clickedDate, setClickedDate] = useState(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposeOk, setProposeOk] = useState(false);
  const [proposeErr, setProposeErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        let data;
        try {
          const res = await api.get(
            `/api/calendar/rh-tech/recruiter/review/${token}`
          );
          data = res.data;
        } catch (e) {
          if (e?.response?.status === 404) {
            const res2 = await api.get(
              `/api/calendar/interview/recruiter-review/${token}`
            );
            data = res2.data;
          } else {
            throw e;
          }
        }
        setInterview(data.interview);
      } catch (e) {
        setInfoError(
          e?.response?.data?.message || "Lien invalide ou expiré"
        );
      } finally {
        setLoadingInfo(false);
      }
    }
    load();
  }, [token]);

  useEffect(() => {
    if (autoAccept && interview && !acceptOk && !accepting) {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAccept, interview]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptErr(null);
    try {
      try {
        await api.post(`/api/calendar/rh-tech/recruiter/accept/${token}`);
      } catch (e) {
        if (e?.response?.status === 404) {
          await api.get(
            `/api/calendar/interview/recruiter-confirm-slot/${token}?redirect=/recruiter/calendar`
          );
        } else {
          throw e;
        }
      }
      setAcceptOk(true);
      setTimeout(() => router.push("/recruiter/calendar?accepted=1"), 2500);
    } catch (e) {
      setAcceptErr(e?.response?.data?.message || "Erreur serveur");
    } finally {
      setAccepting(false);
    }
  }

  function handleDateSelect(date) {
    const d = date instanceof Date ? date : new Date(date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

    setClickedDate(dateStr);
    setProposeOk(false);
    setProposeErr(null);
    setTimeModalOpen(true);
  }

  async function handlePropose(time) {
    if (!clickedDate || !time) return;
    setProposing(true);
    setProposeErr(null);
    try {
      try {
        await api.post(`/api/calendar/rh-tech/recruiter/propose/${token}`, {
          proposedDate: clickedDate,
          proposedTime: time,
        });
      } catch (e) {
        if (e?.response?.status === 404) {
          const startISO = `${clickedDate}T${time}:00`;
          await api.post(
            `/api/calendar/interview/recruiter-propose-from-review/${token}`,
            { startISO }
          );
        } else {
          throw e;
        }
      }

      setProposeOk(true);
      setTimeout(() => {
        setTimeModalOpen(false);
        router.push("/recruiter/calendar?proposed=1");
      }, 2200);
    } catch (e) {
      setProposeErr(e?.response?.data?.message || "Erreur serveur");
    } finally {
      setProposing(false);
    }
  }

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-[#F2FAEF] dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#6CB33F]" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (infoError) {
    return (
      <div className="min-h-screen bg-[#F2FAEF] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            Lien invalide
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {infoError}
          </p>
        </div>
      </div>
    );
  }

  if (acceptOk) {
    return (
      <div className="min-h-screen bg-[#F2FAEF] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
            Date acceptée
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            L'événement a été créé dans Outlook et un email a été envoyé au candidat.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Redirection vers votre calendrier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2FAEF] dark:bg-gray-950">
      <div className="w-full px-4 sm:px-6 py-6">
        {/* Bandeau léger */}
        <div className="max-w-[1700px] mx-auto mb-4">
          <div className="rounded-[28px] bg-white dark:bg-gray-900 border border-[#DCE7D5] dark:border-gray-800 shadow-[0_6px_18px_rgba(15,23,42,0.05)] px-5 sm:px-6 py-4">

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6CB33F]">
                  Entretien RH + Technique — Action requise
                </p>

                <h1 className="mt-1 text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] dark:text-white leading-tight">
                  Nouvelle date proposée
                </h1>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xl">
                  Le calendrier reste visible sur toute la page. Les détails et la validation sont déplacés dans un modal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 xl:justify-end">

                <button
                  onClick={() => setDetailsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6CB33F] hover:bg-[#5AA531] text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <Info className="w-4 h-4" />
                  Voir les détails
                </button>

                <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE7D5] dark:border-gray-700 bg-[#F8FBF6] dark:bg-gray-800 text-[#0F172A] dark:text-white text-sm font-medium">
                  <ArrowLeftRight className="w-4 h-4 text-[#6CB33F]" />
                  Cliquez sur le calendrier
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Erreur acceptation légère */}
        {acceptErr && (
          <div className="max-w-[1700px] mx-auto mb-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {acceptErr}
              </p>
            </div>
          </div>
        )}

        {/* Calendrier plein largeur */}
        <div className="max-w-[1700px] mx-auto">
          <div className="rounded-[30px] overflow-hidden border border-[#DCE7D5] dark:border-gray-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] bg-white dark:bg-gray-900">
            <OutlookCalendar onDateSelect={handleDateSelect} />
          </div>
        </div>
      </div>

      {/* Modal détails + accepter */}
      <InterviewDetailsModal
        open={detailsModalOpen}
        interview={interview}
        onClose={() => setDetailsModalOpen(false)}
        onAccept={handleAccept}
        accepting={accepting}
        acceptErr={acceptErr}
      />

      {/* Modal contre-proposition */}
      <TimePickModal
        open={timeModalOpen}
        date={clickedDate}
        onClose={() => setTimeModalOpen(false)}
        onSubmit={handlePropose}
        loading={proposing}
        error={proposeErr}
        ok={proposeOk}
      />
    </div>
  );
}