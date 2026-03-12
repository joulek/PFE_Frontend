"use client";
// components/InterviewEventModalDGA.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal affiché après sélection d'une date dans GoogleCalendar pour planifier
// un entretien DGA. Appelle POST /api/interviews/:interviewId/schedule-dga
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react";
import api from "../services/api.js";

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30",
];

export default function InterviewEventModalDGA({
  candidateData,   // { candidateName, candidateEmail, jobTitle, interviewId, dgaUsers[] }
  selectedDate,    // "YYYY-MM-DD"
  onClose,
  onCreated,
}) {
  const {
    candidateName  = "",
    candidateEmail = "",
    jobTitle       = "",
    interviewId    = "",
    dgaUsers       = [],
  } = candidateData || {};

  const [time,     setTime]     = useState("10:00");
  const [dgaId,    setDgaId]    = useState("");
  const [dgaEmail, setDgaEmail] = useState("");
  const [dgaName,  setDgaName]  = useState("");
  const [location, setLocation] = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const dateFR = useMemo(() => {
    if (!selectedDate) return "";
    return new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }, [selectedDate]);

  // Quand on sélectionne un DGA dans la liste
  function handleSelectDga(e) {
    const id = e.target.value;
    setDgaId(id);
    if (!id) { setDgaEmail(""); setDgaName(""); return; }
    const user = dgaUsers.find(u => String(u._id) === id);
    if (user) {
      const name = [user.prenom, user.nom].filter(Boolean).join(" ") || user.name || user.email;
      setDgaEmail(user.email || "");
      setDgaName(name);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!dgaEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dgaEmail)) {
      setError("Veuillez sélectionner un DGA ou saisir un email valide.");
      return;
    }
    if (!selectedDate || !time) {
      setError("Date et heure requises.");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/interviews/${interviewId}/schedule-dga`, {
        dgaDate:  selectedDate,
        dgaTime:  time,
        dgaEmail,
        dgaName:  dgaName || "DGA",
        location,
        notes,
      });
      onCreated?.();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Erreur lors de la planification"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6CB33F] to-[#4E8F2F] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Planifier l'entretien DGA</h2>
            <p className="text-xs text-white/75 mt-0.5">
              {candidateName} · {jobTitle || "Poste"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info band */}
        <div className="bg-[#F1FAF4] dark:bg-emerald-950/20 border-b border-gray-100 dark:border-gray-700 px-6 py-2.5 flex items-center gap-2 text-xs text-[#388E3C] dark:text-emerald-400 font-medium">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Un email informatif sera envoyé automatiquement au candidat et au DGA.
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-3 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 rounded-2xl px-4 py-3 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Date sélectionnée (non modifiable ici, retourner au calendrier pour changer) */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F1FAF4] dark:bg-emerald-950/20 rounded-2xl border border-[#d7ebcf] dark:border-emerald-800">
            <svg className="w-5 h-5 text-[#6CB33F] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
              <path strokeLinecap="round" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Date sélectionnée</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{dateFR}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-xs text-[#6CB33F] hover:underline font-semibold"
            >
              Modifier
            </button>
          </div>

          {/* Heure */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Heure <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    time === t
                      ? "bg-[#6CB33F] border-[#6CB33F] text-white shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#6CB33F]/50 hover:text-[#4E8F2F] hover:bg-[#F1FAF4] dark:hover:bg-emerald-950/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="mt-1 w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
            />
          </div>

          {/* Sélecteur DGA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sélectionner un DGA <span className="text-red-400">*</span>
            </label>
            {dgaUsers.length > 0 ? (
              <select
                value={dgaId}
                onChange={handleSelectDga}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors cursor-pointer"
              >
                <option value="">— Choisir un DGA —</option>
                {dgaUsers.map(u => {
                  const name = [u.prenom, u.nom].filter(Boolean).join(" ") || u.name || u.email;
                  return <option key={u._id} value={String(u._id)}>{name} ({u.email})</option>;
                })}
              </select>
            ) : (
              <p className="text-xs text-gray-400 italic px-1">Aucun DGA en base — saisie manuelle ci-dessous</p>
            )}

            {/* Avatar DGA sélectionné */}
            {dgaId && dgaEmail && (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F1FAF4] dark:bg-emerald-950/20 border border-[#d7ebcf] dark:border-emerald-800">
                <div className="w-7 h-7 rounded-full bg-[#6CB33F] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {(dgaName || dgaEmail)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{dgaName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dgaEmail}</p>
                </div>
              </div>
            )}

            {/* Saisie manuelle si pas de DGA sélectionné */}
            {!dgaId && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Nom DGA"
                  value={dgaName}
                  onChange={e => setDgaName(e.target.value)}
                  className="w-2/5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                />
                <input
                  type="email"
                  placeholder="email@dga.com"
                  value={dgaEmail}
                  onChange={e => setDgaEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                />
              </div>
            )}
          </div>

          {/* Lieu */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Lieu / Salle <span className="text-gray-300 dark:text-gray-600">(optionnel)</span>
            </label>
            <input
              type="text"
              placeholder="Ex : Salle Direction, 3ème étage"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Notes <span className="text-gray-300 dark:text-gray-600">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex : Merci d'apporter vos diplômes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-sm transition-colors disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Planifier & Notifier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
