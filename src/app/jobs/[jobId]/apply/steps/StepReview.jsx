"use client";
import { useState } from "react";

export default function StepReview({
  candidatureId,
  parsed,
  manual,
  cvFileUrl,
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!candidatureId) {
      setMsg("❌ candidatureId is not defined");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/applications/${candidatureId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parsed,
            manual,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submit failed");

      setMsg(" Candidature envoyée avec succès");
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Étape 3 — Confirmation
      </h2>

      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <p><b>Nom :</b> {parsed?.fullName}</p>
        <p><b>Email :</b> {parsed?.email}</p>
      </div>

      {/* ✅ BOUTON AU CENTRE */}
      <div className="flex justify-center">
        <button
          onClick={submit}
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700
                     text-white transition"
        >
          {loading ? "Envoi..." : "Envoyer ma candidature"}
        </button>
      </div>

      {msg && (
        <p className="mt-4 text-sm text-center">{msg}</p>
      )}
    </div>
  );
}
