"use client";

import { useState } from "react";
import GoogleCalendar from "../Googlecalendar";
import api from "../../services/api";
import {
  CalendarClock,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
  X,
} from "lucide-react";

function TimePickModal({ open, date, onClose, onSubmit, loading, error, ok }) {
  const [timeFrom, setTimeFrom] = useState("11:00");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[860px] overflow-hidden rounded-[26px] bg-white dark:bg-[#0f172a] shadow-[0_35px_90px_rgba(0,0,0,0.35)] border border-gray-200 dark:border-gray-800">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-5">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#22a06b] dark:text-emerald-400">
              RESPONSABLE MÉTIER
            </p>
            <h2 className="mt-1 text-[28px] sm:text-[34px] font-extrabold leading-tight text-gray-900 dark:text-white">
              Proposer une autre date
            </h2>
            {dateFR ? (
              <p className="mt-1 text-sm font-semibold capitalize text-gray-500 dark:text-gray-400">
                {dateFR}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSubmit(timeFrom)}
              disabled={!date || !timeFrom || loading || ok}
              className="inline-flex items-center justify-center rounded-2xl bg-[#7AC142] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#69ad38] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </span>
              ) : ok ? (
                "Envoyé"
              ) : (
                "Enregistrer"
              )}
            </button>

            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 sm:px-8 py-7">
          <div className="space-y-6">
            {/* Bloc info */}
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22a06b] shadow-[0_10px_26px_rgba(34,160,107,0.28)]">
                <CalendarClock className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                  Choisir l&apos;heure
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Choisissez un créneau selon votre agenda.
                </p>
              </div>
            </div>

            {/* Champ heure style modal Google */}
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Heure
                </label>

                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#111827]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    <Clock3 className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  </div>

                  <input
                    type="time"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-lg font-bold tracking-wide text-gray-900 outline-none transition focus:border-[#22a06b] focus:ring-4 focus:ring-emerald-500/15 dark:border-gray-700 dark:bg-[#0f172a] dark:text-white"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Astuce : choisissez une heure entre <b>10:00</b> et <b>12:00</b> si possible.
                </p>
              </div>
            </div>

            {/* Alertes */}
            {ok ? (
              <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  Nouvelle date envoyée
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <XCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="text-sm font-extrabold text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 sm:px-8 py-4 sm:flex-row sm:items-center dark:border-gray-800 dark:bg-[#0b1220]">
          <button
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-[#111827] dark:text-white dark:hover:bg-gray-800"
          >
            Annuler
          </button>

          <button
            onClick={() => onSubmit(timeFrom)}
            disabled={!date || !timeFrom || loading || ok}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#7AC142] px-6 text-sm font-extrabold text-white transition hover:bg-[#69ad38] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {loading ? "Envoi..." : "Envoyer la nouvelle date"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResponsableRescheduleCalendar({ token }) {
  const [clickedDate, setClickedDate] = useState(null);
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  function handleDateSelect(date) {
    const dateStr =
      date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`
        : String(date).split("T")[0];

    setClickedDate(dateStr);
    setOk(false);
    setError("");
    setOpen(true);
  }

  async function submit(time) {
    if (!token || !clickedDate || !time) return;

    setLoading(true);
    setError("");

    try {
      await api.post(`/api/calendar/rh-tech/manager/propose/${token}`, {
        proposedDate: clickedDate,
        proposedTime: time,
      });

      setOk(true);
      window.dispatchEvent(new CustomEvent("calendar:refresh"));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen overflow-hidden bg-transparent">
      <div className="w-full h-[calc(100vh-140px)] min-h-[700px]">
        <GoogleCalendar onDateSelect={handleDateSelect} />
      </div>

      <TimePickModal
        open={open}
        date={clickedDate}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        loading={loading}
        error={error}
        ok={ok}
      />
    </div>
  );
}