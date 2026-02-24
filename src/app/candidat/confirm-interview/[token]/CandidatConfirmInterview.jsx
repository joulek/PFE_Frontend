"use client";
// app/candidat/confirm-interview/[token]/CandidatConfirmInterview.jsx
// Page ouverte par le candidat depuis l'email.
// Le candidat confirme → Outlook mis à jour "✅ Confirmé" + email recruteur

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, Calendar, Clock, Briefcase, User, ArrowRight } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function CandidatConfirmInterview({ token }) {
  const [status, setStatus]   = useState("loading"); // loading | info | confirming | success | error
  const [interview, setInterview] = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");

  // ── 1. Charger les infos de l'entretien ──────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/calendar/rh-tech/candidate/info/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.message || "Lien invalide ou expiré.");
          setStatus("error");
          return;
        }
        setInterview(data.interview);
        setStatus("info");
      } catch {
        setErrorMsg("Impossible de contacter le serveur.");
        setStatus("error");
      }
    }
    load();
  }, [token]);

  // ── 2. Confirmer ────────────────────────────────────────────────────────
  async function handleConfirm() {
    setStatus("confirming");
    try {
      const res = await fetch(`${API_BASE}/api/calendar/rh-tech/candidate/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.message || "Erreur lors de la confirmation.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#4E8F2F]" />
        <p className="text-sm text-gray-500">Chargement de votre entretien...</p>
      </div>
    </div>
  );

  // ── Erreur ───────────────────────────────────────────────────────────────
  if (status === "error") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  );

  // ── Succès ───────────────────────────────────────────────────────────────
  if (status === "success") return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4E8F2F]/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#4E8F2F]/5 rounded-full" />
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-11 h-11 text-[#4E8F2F]" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Entretien confirmé ! 🎉</h2>
          <p className="text-sm text-gray-500 mb-1">
            Votre entretien RH+Technique est maintenant confirmé.
          </p>
          {interview && (
            <div className="mt-4 p-4 bg-[#F0FAF0] rounded-2xl border border-[#4E8F2F]/20 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
                <span className="font-semibold text-gray-700">{interview.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
                <span className="font-semibold text-gray-700">{interview.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
                <span className="text-gray-600">{interview.jobTitle}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Un email de confirmation vous a été envoyé. À bientôt !
          </p>
        </div>
      </div>
    </div>
  );

  // ── Info + Confirmer ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
              Entretien RH + Technique — Confirmation requise
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {interview?.candidateName || "Bonjour !"}
            </h1>
            {interview?.jobTitle && (
              <p className="text-white/70 text-sm mt-1">{interview.jobTitle}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          <p className="text-sm text-gray-600 leading-relaxed">
            Votre entretien RH+Technique a été planifié. Veuillez confirmer votre présence :
          </p>

          {/* Infos entretien */}
          {interview && (
            <div className="space-y-3 p-4 bg-[#F0FAF0] rounded-2xl border border-[#4E8F2F]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4E8F2F]/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#4E8F2F]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-bold text-gray-800">{interview.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4E8F2F]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#4E8F2F]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Heure</p>
                  <p className="text-sm font-bold text-gray-800">{interview.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4E8F2F]/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-[#4E8F2F]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Poste</p>
                  <p className="text-sm font-bold text-gray-800">{interview.jobTitle}</p>
                </div>
              </div>
              {interview.recruiterName && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4E8F2F]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#4E8F2F]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recruteur</p>
                    <p className="text-sm font-bold text-gray-800">{interview.recruiterName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={status === "confirming"}
            className="w-full py-4 rounded-2xl bg-[#4E8F2F] hover:bg-[#3d7524] text-white font-extrabold text-base flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-[#4E8F2F]/25 transition-all"
          >
            {status === "confirming" ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Confirmation...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Confirmer ma présence</>
            )}
          </button>

          {/* Lien proposer autre date */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">Cette date ne vous convient pas ?</p>
            <Link
              href={`/candidat/reschedule-interview/${token}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4E8F2F] hover:text-[#3d7524] transition-colors"
            >
              Proposer une autre date
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}