"use client";

import { useState } from "react";
import OutlookCalendar from "../Outlookcalendar";
import api from "../../services/api"; // نفس api اللي تستعملو في مشروعك
import { CalendarClock, Loader2, CheckCircle2, XCircle } from "lucide-react";

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-emerald-100 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-emerald-500 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                Responsable Métier
              </p>
              <h2 className="text-white font-extrabold text-xl leading-tight">
                Proposer une autre date
              </h2>
              {dateFR && (
                <p className="text-white/90 text-sm mt-1 font-semibold capitalize">
                  📅 {dateFR}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-gray-900 dark:text-white">
                Choisir l&apos;heure
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Vous choisissez un créneau selon votre agenda Outlook.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2">
              🕐 Heure
            </label>
            <input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white"
            />
          </div>

          {ok ? (
            <div className="flex gap-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Nouvelle date envoyée ✅
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="text-sm font-bold text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          ) : null}

          <button
            onClick={() => onSubmit(timeFrom)}
            disabled={!date || !timeFrom || loading || ok}
            className="w-full rounded-2xl px-5 py-3 font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Envoi..." : "Envoyer la nouvelle date"}
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
          Optylab · Recrutement & RH
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
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")}`
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
      // ✅ Backend: responsable propose
      await api.post(`/api/calendar/rh-tech/manager/propose/${token}`, {
        proposedDate: clickedDate,
        proposedTime: time,
      });

      setOk(true);
      // refresh calendar display if needed
      window.dispatchEvent(new CustomEvent("calendar:refresh"));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Banner */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
          <span className="relative flex-shrink-0 w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
            <span className="relative block w-3 h-3 rounded-full bg-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold">
              Cliquez sur une date dans votre calendrier pour proposer un créneau
            </p>
            <p className="text-xs text-emerald-100 truncate">
              (Selon votre disponibilité Outlook)
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Outlook calendar mta Responsable */}
      <OutlookCalendar onDateSelect={handleDateSelect} />

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