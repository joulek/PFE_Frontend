"use client";
import { useState } from "react";

export default function StepUploadCV({ jobId, onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function upload() {
    if (!file) return setErr("Choisir un CV (PDF).");

    setLoading(true);
    setErr("");

    try {
      const form = new FormData();
      form.append("cv", file);

      const res = await fetch(
        `http://localhost:5000/api/applications/${jobId}/cv`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      // ✅ IMPORTANT: callback موجود ومسمّى صحيح
      onParsed(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Étape 1 — Upload CV</h2>
      <p className="text-gray-600 mb-4">
        Upload CV (PDF). Les informations seront extraites automatiquement.
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0])}
        className="mb-4"
      />

      {err && <p className="text-red-500 mb-3">{err}</p>}

      <button
        onClick={upload}
        disabled={loading}
        className="px-5 py-3 rounded-xl bg-green-600 text-white disabled:opacity-50"
      >
        {loading ? "Analyse en cours..." : "Uploader & Analyser"}
      </button>
    </div>
  );
}
