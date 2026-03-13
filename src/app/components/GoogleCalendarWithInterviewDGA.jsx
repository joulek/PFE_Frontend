"use client";
// components/GoogleCalendarWithInterviewDGA.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Calendrier Google pour planification entretien DGA
//
// Flux : list_interview → bouton "Planifier DGA"
//   URL : /recruiter/calendar?type=entretien_dga
//         &candidateName=...&candidateEmail=...
//         &jobTitle=...&interviewId=...
// → Bannière verte + clic sur date → InterviewEventModalDGA
// → POST /api/interviews/:interviewId/schedule-dga
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../services/api.js";
import GoogleCalendar from "./Googlecalendar";
import InterviewEventModalDGA from "./InterviewEventModalDGA";

export default function GoogleCalendarWithInterviewDGA() {
  const searchParams = useSearchParams();

  const [candidateCtx, setCandidateCtx] = useState(null);
  const [clickedDate,  setClickedDate]  = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [created,      setCreated]      = useState(false);
  const [dgaUsers,     setDgaUsers]     = useState([]);

  // ── Lire les params URL → stocker le contexte candidat ──────────────────
  useEffect(() => {
    const type  = searchParams.get("type");
    if (type !== "entretien_dga") return;

    const name        = searchParams.get("candidateName")  || "";
    const email       = searchParams.get("candidateEmail") || "";
    const job         = searchParams.get("jobTitle")        || "";
    const interviewId = searchParams.get("interviewId")     || "";

    if (name || email || interviewId) {
      setCandidateCtx({ candidateName: name, candidateEmail: email, jobTitle: job, interviewId, dgaUsers: [] });
      window.history.replaceState({}, "", window.location.pathname);

      // Charger les DGA
      loadDgaUsers().then(users => {
        setCandidateCtx(prev => prev ? { ...prev, dgaUsers: users } : null);
      });
    }
  }, [searchParams]);

  async function loadDgaUsers() {
    try {
      const { data } = await api.get("/users?role=DGA");
      const raw  = data?.users || data?.data || data || [];
      const list = Array.isArray(raw) ? raw : [];
      return list.filter(u => String(u.role || "").toUpperCase().includes("DGA"));
    } catch {
      return [];
    }
  }

  // ── Clic sur une date du calendrier ──────────────────────────────────────
  function handleDateSelect(date) {
    const dateStr =
      date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : String(date).split("T")[0];
    setClickedDate(dateStr);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setClickedDate(null);
  }

  function handleCreated() {
    setShowModal(false);
    setClickedDate(null);
    setCandidateCtx(null);
    setCreated(true);
    setTimeout(() => setCreated(false), 6000);
    window.dispatchEvent(new CustomEvent("calendar:refresh"));
  }

  return (
    <div className="relative">

      {/* ── Bannière : candidat DGA en attente ────────────────────────────── */}
    

      {/* ── Calendrier Google ──────────────────────────────────────────────── */}
      <GoogleCalendar
        onDateSelect={candidateCtx ? handleDateSelect : undefined}
      />

      {/* ── Modal DGA ─────────────────────────────────────────────────────── */}
      {showModal && candidateCtx && (
        <InterviewEventModalDGA
          candidateData={candidateCtx}
          selectedDate={clickedDate}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}

      {/* ── Toast succès ──────────────────────────────────────────────────── */}
      {created && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#4E8F2F] text-white px-5 py-4 rounded-2xl shadow-2xl">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">Entretien DGA planifié dans Google Calendar !</p>
            <p className="text-xs text-green-100">✉️ Emails envoyés au candidat et au DGA</p>
          </div>
          <button onClick={() => setCreated(false)} className="ml-2 text-green-200 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
