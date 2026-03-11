"use client";
// components/InterviewEventModalNord.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal création d'entretien pour RESPONSABLE_RH_NORD
// Inspiré de InterviewEventModal.jsx (recruteur) — séparé et indépendant
// Appelle : POST /calendar/events/interview-nord
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import api from "../services/api";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);

const DURATIONS = [
  { label: "30 min",  value: 30  },
  { label: "45 min",  value: 45  },
  { label: "1 heure", value: 60  },
  { label: "1h30",    value: 90  },
  { label: "2 heures",value: 120 },
];

export default function InterviewEventModalNord({ candidateData, selectedDate, onClose, onCreated }) {
  const [form, setForm] = useState({
    title:    `Entretien Nord — ${candidateData?.candidateName || "Candidat"}`,
    date:     selectedDate || "",
    time:     "09:00",
    duration: 60,
    location: "",
    notes:    "",
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.time) {
      setError("Veuillez renseigner la date et l'heure.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/api/interviewNord/events/interview-nord", {
        title:          form.title,
        date:           form.date,
        time:           form.time,
        durationMinutes: form.duration,
        location:       form.location,
        notes:          form.notes,
        sendEmail:      form.sendEmail,
        // Données candidat
        candidateName:  candidateData?.candidateName  || "",
        candidateEmail: candidateData?.candidateEmail || "",
        jobTitle:       candidateData?.jobTitle       || "",
        candidatureId:  candidateData?.candidatureId  || "",
        type:           "entretien_nord",
      });

      onCreated();
    } catch (err) {
      console.error("❌ InterviewEventModalNord:", err?.message);
      setError(err?.response?.data?.error || "Erreur lors de la création de l'événement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-green-600 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Planifier un entretien Nord</h2>
            <p className="text-green-200 text-sm mt-0.5 truncate max-w-xs">
              {candidateData?.candidateName}
              {candidateData?.jobTitle ? ` · ${candidateData.jobTitle}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white flex-shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Titre de l&apos;événement
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Heure
              </label>
              <select
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Durée
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => set("duration", d.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.duration === d.value
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-500"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Lieu / Lien visio <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Ex : Google Meet, Salle A, Bureau Nord…"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Notes <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Instructions, documents à préparer…"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Email candidat */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set("sendEmail", !form.sendEmail)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                form.sendEmail ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.sendEmail ? "translate-x-5" : "translate-x-0"
              }`} />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Envoyer un email de confirmation au candidat
            </span>
          </label>

          {/* Résumé candidat */}
          <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-3 space-y-1">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">Candidat sélectionné</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{candidateData?.candidateName || "—"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{candidateData?.candidateEmail || "—"}</p>
            {candidateData?.jobTitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">🏢 {candidateData.jobTitle}</p>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Créer l&apos;entretien
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}