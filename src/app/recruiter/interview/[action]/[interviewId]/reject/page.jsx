"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
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

export default function RescheduleInterviewPage() {
  const { interviewId } = useParams();
  const router = useRouter();

  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ================= FETCH SLOTS =================
  const fetchSlots = async (date) => {
    try {
      setLoadingSlots(true);
      setErrorMessage(null);

      const res = await fetch(
        `${API_BASE}/api/interviews/available-slots?date=${date}`,
        { method: "GET", headers: getAuthHeaders() }
      );

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Réponse inattendue du serveur (status ${res.status})`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Erreur chargement créneaux");

      setSlots(data.slots || []);
    } catch (err) {
      setErrorMessage(err.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ================= HANDLE DATE =================
  const handleDateChange = (e) => {
    const value = e.target.value;
    setNewDate(value);
    setSelectedSlot("");
    if (value) fetchSlots(value);
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    try {
      if (!newDate || !selectedSlot) {
        return setErrorMessage("Veuillez choisir une date et un créneau.");
      }

      setSubmitting(true);
      setErrorMessage(null);

      const startISO = `${newDate}T${selectedSlot}:00`;

      const res = await fetch(
        `${API_BASE}/api/interviews/${interviewId}/propose`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ startISO }),
        }
      );

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Réponse inattendue du serveur (status ${res.status})`);
      }

      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.success) throw new Error(data.message || "Erreur envoi");

      setSuccessMessage("Créneau envoyé au candidat !");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= SUCCESS STATE =================
  if (successMessage) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow p-10 max-w-md w-full text-center">
          <CheckCircle2 className="mx-auto w-14 h-14 text-[#6CB33F] dark:text-emerald-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {successMessage}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Le candidat recevra une notification pour confirmer sa présence.
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

  // ================= MAIN UI =================
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 py-10 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow w-full max-w-xl overflow-hidden">

        {/* ── HEADER ── */}
        <div className="bg-[#6CB33F] dark:bg-emerald-700 px-7 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            Reprogrammer l&apos;entretien
          </p>
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            Proposer une nouvelle date
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Choisissez une date et un créneau disponible
          </p>
        </div>

        {/* ── BODY ── */}
        <div className="px-7 py-7 space-y-6">

          {/* ERROR */}
          {errorMessage && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* DATE */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={handleDateChange}
              className="w-full border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500 transition"
            />
          </div>

          {/* DIVIDER */}
          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* SLOTS */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              <Clock className="w-3.5 h-3.5" />
              Créneaux disponibles
            </label>

            {!newDate ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Sélectionnez une date pour voir les créneaux
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement des créneaux...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Aucun créneau disponible ce jour
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      selectedSlot === slot
                        ? "bg-[#6CB33F] dark:bg-emerald-600 border-[#6CB33F] dark:border-emerald-600 text-white"
                        : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-[#4E8F2F] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !newDate || !selectedSlot}
            className="w-full flex items-center justify-center gap-2 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Envoi en cours..." : "Confirmer le créneau"}
          </button>

        </div>
      </div>
    </div>
  );
}