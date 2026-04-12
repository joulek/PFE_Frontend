"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle, ArrowRight, MessageSquare, CheckCircle2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function detectFromCandidate(iv) {
  if (!iv) return false;
  return !!(
    iv.candidateRescheduleReason ||
    iv.candidateRescheduleAt     ||
    iv.candidatePreferredSlot    ||
    iv.candidateProposedDate     ||
    iv.candidateProposedTime
  );
}

export default function AdminApproveInterviewPage() {
  const params      = useParams();
  const router      = useRouter();
  const interviewId = params?.interviewId;
  const urlAction   = params?.action;

  const [loading, setLoading]           = useState(true);
  const [interview, setInterview]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showReject, setShowReject]     = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [alreadyDone, setAlreadyDone]   = useState(false);
  const [doneMessage, setDoneMessage]   = useState("");

  const autoApproveTriggered = useRef(false);

  useEffect(() => {
    if (!interviewId) return;
    loadInterview();
  }, [interviewId]);

  useEffect(() => {
    if (!interview || alreadyDone) return;
    if (urlAction === "reject") {
      setShowReject(true);
    } else if (urlAction === "approve" && !submitting && !autoApproveTriggered.current) {
      autoApproveTriggered.current = true;
      handleApprove();
    }
  }, [urlAction, interview, alreadyDone]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/api/interviews/${interviewId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setInterview(data.data);
        if (data.data.status !== "PENDING_ADMIN_APPROVAL") {
          setAlreadyDone(true);
          setDoneMessage(
            data.data.status === "PENDING_CANDIDATE_CONFIRMATION"
              ? "Cette demande a déjà été approuvée. Un email a été envoyé au candidat."
              : data.data.status === "CONFIRMED"
              ? "Cet entretien est déjà confirmé."
              : `Statut actuel : ${data.data.status}`
          );
        }
      } else {
        setErrorMessage("Entretien introuvable");
      }
    } catch {
      setErrorMessage("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res  = await fetch(`${API_BASE}/api/interviews/admin/approve/${interviewId}`, {
        method:  "POST",
        headers: getAuthHeaders(),
        body:    JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/recruiter/list_interview");
      } else {
        setErrorMessage(data.message || "Erreur lors de l'approbation");
        autoApproveTriggered.current = false;
      }
    } catch {
      setErrorMessage("Erreur lors de l'approbation");
      autoApproveTriggered.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res  = await fetch(`${API_BASE}/api/interviews/admin/reject/${interviewId}`, {
        method:  "POST",
        headers: getAuthHeaders(),
        body:    JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/recruiter/list_interview");
      } else {
        setErrorMessage(data.message || "Erreur lors du rejet");
      }
    } catch {
      setErrorMessage("Erreur lors du rejet");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    });
  };

  const formatTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-[#6CB33F] dark:text-emerald-400" />
      </div>
    );
  }

  // ── Not found ──
  if (!interview) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow p-10 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-6">
            {errorMessage || "Entretien introuvable"}
          </p>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="w-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ── Already processed ──
  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow p-10 max-w-sm w-full text-center">
          <CheckCircle2 className="w-14 h-14 text-[#6CB33F] dark:text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-6">{doneMessage}</p>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="w-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Voir la liste
          </button>
        </div>
      </div>
    );
  }

  const isFromCandidate = detectFromCandidate(interview);
  const newDate = interview.candidatePreferredSlot || interview.responsableProposedDate;
  const newTime = interview.responsableProposedTime || (newDate ? formatTime(newDate) : null);
  const motif   = interview.candidateRescheduleReason || interview.responsableModificationNotes;

  // ── Main ──
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 py-10 transition-colors duration-300">
      <div className="w-full max-w-md space-y-4">

        {/* ── HEADER CARD ── */}
        <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow overflow-hidden">
          <div className="bg-[#6CB33F] dark:bg-emerald-700 px-7 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              Demande de report
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              Validation de report
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Examinez la demande et prenez une décision
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* ERROR */}
            {errorMessage && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Candidat */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-[#4E8F2F] dark:text-emerald-400 font-bold text-sm shrink-0">
                {interview.candidateName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {interview.candidateName}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 truncate">
                  {interview.candidateEmail}
                </p>
              </div>
              <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full shrink-0">
                Report demandé
              </span>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Dates comparison */}
            <div className="grid grid-cols-[1fr_20px_1fr] gap-2 items-center">

              {/* Date actuelle */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Date actuelle
                </p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                    {formatDate(interview.proposedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {interview.proposedTime || "—"}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              </div>

              {/* Nouvelle date */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4E8F2F] dark:text-emerald-500 mb-2">
                  Nouvelle date
                </p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6CB33F] dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                    {formatDate(newDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6CB33F] dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-[#4E8F2F] dark:text-emerald-400">
                    {newTime || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Motif */}
            {motif && (
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl p-3 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                    Motif
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{motif}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIONS ── */}
        {!showReject ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full py-3.5 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              {isFromCandidate
                ? "Approuver — notifier le candidat"
                : "Approuver — notifier le responsable"}
            </button>

            <button
              onClick={() => setShowReject(true)}
              disabled={submitting}
              className="w-full py-3.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Refuser
            </button>
          </div>
        ) : (
          /* ── Reject form ── */
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-2xl shadow px-6 py-5 space-y-4">
            <p className="font-semibold text-gray-900 dark:text-white">
              Raison du refus
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Optionnel — ex : date trop éloignée…"
              className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500 transition"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReject(false); setErrorMessage(null); }}
                className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-[2] py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                Confirmer le refus
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}