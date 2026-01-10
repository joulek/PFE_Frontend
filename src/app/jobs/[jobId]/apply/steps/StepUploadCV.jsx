"use client";
import { useState } from "react";

export default function StepUploadCV({ jobId, onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function upload() {
    if (!file) {
      setErr("Veuillez sélectionner un CV au format PDF.");
      return;
    }

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
      if (!res.ok) throw new Error(data.message || "Upload échoué");

      onParsed(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ===== TITLE ===== */}
      <h2 className="text-2xl font-semibold text-center mb-2">
        Étape 1 — Upload du CV
      </h2>

      <p className="text-gray-600 text-center mb-8">
        Déposez votre CV. Les informations seront extraites automatiquement.
      </p>

      {/* ===== DROPZONE ===== */}
      <label
        htmlFor="cv"
        className="flex flex-col items-center justify-center
                   border-2 border-dashed border-green-400
                   rounded-2xl p-12 text-center cursor-pointer
                   bg-green-50 hover:bg-green-100
                   transition"
      >
        <input
          id="cv"
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => setFile(e.target.files?.[0])}
        />

        <div className="text-4xl mb-3">📄</div>

        <p className="font-medium text-gray-700">
          Glissez-déposez votre CV ici
        </p>

        <p className="text-sm text-gray-500 mt-1">
          ou cliquez pour sélectionner un fichier
        </p>

        <p className="text-xs text-gray-400 mt-3">
          Format accepté : <b>PDF uniquement</b>
        </p>

        {file && (
          <p className="mt-4 text-sm text-green-600 font-medium">
            ✔ {file.name}
          </p>
        )}
      </label>

      {/* ===== ERROR ===== */}
      {err && (
        <p className="text-red-500 text-sm text-center mt-4">
          {err}
        </p>
      )}

      {/* ===== ACTION ===== */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={upload}
          disabled={loading}
          className="px-10 py-3 rounded-xl bg-green-600 text-white
                     font-semibold hover:bg-green-700
                     disabled:opacity-50 transition"
        >
          {loading ? "Analyse en cours..." : "Soumettre le CV"}
        </button>
      </div>
    </>
  );
}
