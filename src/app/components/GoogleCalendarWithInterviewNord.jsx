"use client";
// components/GoogleCalendarWithInterviewNord.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Calendrier Google pour RESPONSABLE_RH_NORD — séparé du recruteur
//
// Flux : PreInterviewNordList → bouton "Entretien Nord"
//   URL : ?newEvent=1&type=entretien_nord&candidateName=...&candidateEmail=...
//         &jobTitle=...&candidatureId=...
// → Bannière verte + clic sur date → InterviewEventModalNord
// → POST /calendar/events/interview-nord (email automatique au candidat)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GoogleCalendar from "./Googlecalendar";
import InterviewEventModalNord from "./InterviewEventModalNord";

export default function GoogleCalendarWithInterviewNord() {
  const searchParams = useSearchParams();

  const [candidateCtx, setCandidateCtx] = useState(null);
  const [clickedDate,  setClickedDate]  = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [created,      setCreated]      = useState(false);

  // ── Lire les params URL → stocker le contexte candidat ──────────────────
  useEffect(() => {
    const name  = searchParams.get("candidateName");
    const email = searchParams.get("candidateEmail");
    const job   = searchParams.get("jobTitle");
    const cid   = searchParams.get("candidatureId");
    const type  = searchParams.get("type");

    if (name || email) {
      setCandidateCtx({
        candidateName:  name  || "",
        candidateEmail: email || "",
        jobTitle:       job   || "",
        candidatureId:  cid   || "",
        type:           type  || "entretien_nord",   // ← spécifique NORD
      });
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // ── Clic sur une date du calendrier ────────────────────────────────────
  function handleDateSelect(date) {
    const dateStr =
      date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : String(date).split("T")[0];
    setClickedDate(dateStr);
    setShowModal(true);
  }

  // ── Fermer la modal sans créer ──────────────────────────────────────────
  function handleClose() {
    setShowModal(false);
    setClickedDate(null);
  }

  // ── Entretien créé avec succès ──────────────────────────────────────────
  function handleCreated() {
    setShowModal(false);
    setClickedDate(null);
    setCandidateCtx(null);
    setCreated(true);
    setTimeout(() => setCreated(false), 6000);
    // Rafraîchir le calendrier
    window.dispatchEvent(new CustomEvent("calendar:refresh"));
  }

  return (
    <div className="relative">

      

      {/* ── Calendrier Google — onDateSelect actif seulement si candidat présent ── */}
      <GoogleCalendar
        onDateSelect={candidateCtx ? handleDateSelect : undefined}
      />

      {/* ── Modal création entretien NORD ── */}
      {showModal && candidateCtx && (
        <InterviewEventModalNord
          candidateData={candidateCtx}
          selectedDate={clickedDate}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}

      {/* ── Toast succès ── */}
      {created && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">Entretien Nord créé dans Google Calendar !</p>
            <p className="text-xs text-green-100">✉️ Email de confirmation envoyé au candidat</p>
          </div>
          <button
            onClick={() => setCreated(false)}
            className="ml-2 text-green-200 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}