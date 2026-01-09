"use client";
import { useState } from "react";

export default function StepReview({ jobId, parsed, manual, cvFileUrl }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`http://localhost:3001/api/applications/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvFileUrl, parsed, manual }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submit failed");

      setMsg("✅ Candidature envoyée !");
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Étape 3 — Confirmation</h2>

      <div className="bg-gray-50 p-4 rounded-2xl mb-4">
        <p><b>CV:</b> {cvFileUrl}</p>
        <p><b>Nom:</b> {parsed?.fullName}</p>
        <p><b>Email:</b> {parsed?.email}</p>
        <p><b>Motivation:</b> {manual?.motivation}</p>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="px-5 py-3 rounded-xl bg-green-600 text-white disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Envoyer ma candidature"}
      </button>

      {msg && <p className="mt-3">{msg}</p>}
    </div>
  );
}
