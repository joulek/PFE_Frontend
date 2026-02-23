"use client";
// components/InterviewEventModal.jsx — v2
// ─────────────────────────────────────────────────────────────────────────────
// S'ouvre quand l'utilisateur clique sur une date dans le calendrier.
// Si candidateData est fourni → pré-rempli avec les infos candidat (Entretien RH)
// Si candidateData est null   → formulaire vide (Nouvel événement standard)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import api from "../services/api.js";

export default function InterviewEventModal({ candidateData, selectedDate, onClose, onCreated }) {
  const isInterview = !!candidateData;

  const {
    candidateName  = "",
    candidateEmail = "",
    jobTitle       = "",
    candidatureId  = "",
  } = candidateData || {};

  // Titre par défaut
  const defaultTitle = isInterview
    ? `Entretien RH — ${candidateName}`
    : "";

  const [title,    setTitle]    = useState(defaultTitle);
  const [date,     setDate]     = useState(selectedDate || "");
  const [timeFrom, setTimeFrom] = useState("10:00");
  const [timeTo,   setTimeTo]   = useState("11:00");
  const [location, setLocation] = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Date lisible
  const dateFR = date
    ? new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  // Auto-calcul heure de fin (+1h)
  function handleTimeFromChange(val) {
    setTimeFrom(val);
    const [h, m] = val.split(":").map(Number);
    const endH = (h + 1) % 24;
    setTimeTo(`${String(endH).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  }

  async function handleSubmit() {
    if (!date || !timeFrom) { setError("Date et heure requises"); return; }
    if (!title.trim())      { setError("Titre requis"); return; }
    setSaving(true); setError("");

    const start = `${date}T${timeFrom}:00`;
    const end   = `${date}T${timeTo}:00`;

    try {
      if (isInterview) {
        // ── Entretien RH → route spéciale (Outlook + DB + email candidat) ──
        const r = await api.post("/api/calendar/events/interview", {
          candidatureId,
          candidateName,
          candidateEmail,
          jobTitle,
          start,
          end,
          notes: location || notes || "",
          sendEmailToCandidate: true,
        });
        console.log("📧 emailSent:", r.data?.emailSent, "| error:", r.data?.emailError);
        if (!r.data?.emailSent && r.data?.emailError) {
          // Email failed but event created - notify user
          console.error("❌ Email failed:", r.data.emailError);
          setError(`Entretien créé mais email non envoyé : ${r.data.emailError}`);
          setSaving(false);
          return; // Don't call onCreated so user sees the error
        }
      } else {
        // ── Événement normal → route standard ──────────────────────────────
        await api.post("/calendar/events", {
          title: title.trim(),
          start,
          end,
          location: location || null,
          description: notes || null,
        });
      }
      onCreated();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Erreur lors de la création");
    }
    setSaving(false);
  }

  const headerGradient = isInterview
    ? "from-violet-600 to-purple-700"
    : "from-green-600 to-emerald-700";

  const accentRing = isInterview
    ? "focus:ring-violet-400"
    : "focus:ring-green-400";

  const btnColor = isInterview
    ? "from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800"
    : "from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} px-6 py-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
                {isInterview ? "Nouvel entretien RH" : "Nouvel événement"}
              </p>
              <h2 className="text-white font-extrabold text-xl leading-tight truncate">
                {isInterview ? candidateName : "Créer un événement"}
              </h2>
              {isInterview && jobTitle && (
                <p className="text-white/70 text-sm mt-0.5 truncate">{jobTitle}</p>
              )}
              {/* Date sélectionnée dans le header */}
              {dateFR && (
                <p className="text-white/80 text-sm mt-1.5 font-semibold capitalize">
                  📅 {dateFR}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors mt-0.5"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Candidat pill (si entretien RH) */}
          {isInterview && (
            <div className="flex items-center gap-2.5 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm flex-shrink-0">
                {candidateName?.[0]?.toUpperCase() || "C"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{candidateName}</p>
                {candidateEmail && (
                  <p className="text-xs text-gray-400 truncate">{candidateEmail}</p>
                )}
              </div>
            </div>
          )}

          {/* Titre (uniquement pour événement standard) */}
          {!isInterview && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de l'événement"
                autoFocus
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${accentRing}`}
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              📅 Date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setDate(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${accentRing}`}
            />
          </div>

          {/* Heures */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                🕐 De
              </label>
              <input
                type="time"
                value={timeFrom}
                onChange={e => handleTimeFromChange(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${accentRing}`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                À
              </label>
              <input
                type="time"
                value={timeTo}
                onChange={e => setTimeTo(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${accentRing}`}
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              📍 Lieu / Lien Teams <span className="text-gray-300 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Bureau RH / https://teams.microsoft.com/..."
              className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${accentRing}`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              📝 Notes <span className="text-gray-300 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder={isInterview ? "Points à aborder, instructions..." : "Description de l'événement..."}
              className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 ${accentRing}`}
            />
          </div>

          {/* Info email candidat */}
          {isInterview && candidateEmail && (
            <div className="flex items-start gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                Email envoyé à <strong>{candidateEmail}</strong> avec lien pour confirmer ou proposer une autre date.
              </p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !date || !timeFrom || !title.trim()}
              className={`flex-[2] py-3 rounded-xl bg-gradient-to-r ${btnColor} text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md`}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Création...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {isInterview ? "Créer l'entretien" : "Créer l'événement"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}