"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle, ArrowRight, MessageSquare,
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
        // ✅ Redirect to list after approval
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
        // ✅ Redirect to list after rejection
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Not found ──
  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-4">{errorMessage || "Entretien introuvable"}</p>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium"
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-4">{doneMessage}</p>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium"
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">Demande de report</p>
          <h1 className="text-2xl font-semibold text-gray-900">Validation de report</h1>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">

          {/* Candidat */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
              {interview.candidateName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{interview.candidateName}</p>
              <p className="text-sm text-gray-400 truncate">{interview.candidateEmail}</p>
            </div>
            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg flex-shrink-0">
              Report demandé
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">

            {/* Dates comparison */}
            <div className="grid grid-cols-[1fr_20px_1fr] gap-2 items-center mb-4">
              {/* Date actuelle */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1.5">Date actuelle</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800 leading-tight">{formatDate(interview.proposedDate)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-600">{interview.proposedTime || "—"}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>

              {/* Nouvelle date */}
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600 mb-1.5">Nouvelle date</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-900 leading-tight">{formatDate(newDate)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-sm text-emerald-700">{newTime || "—"}</p>
                </div>
              </div>
            </div>

            {/* Motif */}
            {motif && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Motif</p>
                  <p className="text-sm text-gray-700">{motif}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!showReject ? (
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
              className="w-full py-3.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Refuser
            </button>
          </div>
        ) : (
          /* Reject form */
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="font-medium text-gray-900 mb-3">Raison du refus</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Optionnel — ex : date trop éloignée…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setShowReject(false); setErrorMessage(null); }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-[2] px-6 py-3 bg-red-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
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