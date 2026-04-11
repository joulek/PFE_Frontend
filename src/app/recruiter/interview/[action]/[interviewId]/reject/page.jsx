"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Loader2, AlertCircle } from "lucide-react";

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
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      // ✅ FIX : vérifier le Content-Type avant de parser en JSON
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Réponse inattendue du serveur (status ${res.status})`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Erreur chargement créneaux");
      }

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
        return setErrorMessage("Choisir date + créneau");
      }

      setSubmitting(true);
      setErrorMessage(null);

      // ✅ FIX : construire startISO = "YYYY-MM-DDTHH:mm:00"
      // Le contrôleur recruiterProposeNewSlotController attend uniquement { startISO }
      const startISO = `${newDate}T${selectedSlot}:00`;

      const res = await fetch(
        `${API_BASE}/api/interviews/${interviewId}/propose`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ startISO }),
        }
      );

      // ✅ FIX : vérifier le Content-Type avant de parser en JSON
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Réponse inattendue du serveur (status ${res.status})`);
      }

      const data = await res.json();

      // ✅ FIX : le contrôleur retourne { error } en cas d'échec, pas { success: false }
      if (data.error) {
        throw new Error(data.error);
      }
      if (!data.success) {
        throw new Error(data.message || "Erreur envoi");
      }

      setSuccessMessage("Créneau envoyé au candidat !");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= SUCCESS =================
  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{successMessage}</h2>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Proposer une nouvelle date
        </h1>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded flex gap-2">
            <AlertCircle />
            {errorMessage}
          </div>
        )}

        {/* DATE */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date
          </label>
          <input
            type="date"
            value={newDate}
            onChange={handleDateChange}
            className="w-full border p-3 rounded-xl"
          />
        </div>

        {/* SLOTS */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            Créneaux disponibles
          </label>

          {loadingSlots ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin w-4 h-4" />
              Chargement...
            </div>
          ) : slots.length === 0 ? (
            <p className="text-gray-500">Aucun créneau disponible</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-xl border ${
                    selectedSlot === slot
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-100"
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
          disabled={submitting}
          className="w-full bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="animate-spin w-4 h-4" />}
          Confirmer le créneau
        </button>

      </div>
    </div>
  );
}