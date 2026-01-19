"use client";

import { useState, useEffect } from "react";

export default function JobModal({ open, onClose, onSubmit, initialData }) {
  const emptyForm = {
    titre: "",
    description: "",
    technologies: "",
    dateCloture: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ✅ FIX: reset/remplir le form à chaque ouverture du modal
  useEffect(() => {
    if (!open) return;

    // MODE UPDATE (Modifier)
    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        description: initialData.description || "",
        technologies: initialData.technologies?.join(", ") || "",
        dateCloture: initialData.dateCloture
          ? initialData.dateCloture.slice(0, 10)
          : "",
      });
      return;
    }

    // MODE CREATE (Ajouter) => reset
    setForm(emptyForm);
  }, [open, initialData]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      ...form,
      technologies: form.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onMouseDown={(e) => {
        // ferme si clic sur overlay
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
        {/* ===== HEADER ===== */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {initialData ? "Modifier l’offre" : "Ajouter une offre"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Mettez à jour les informations de l'annonce pour les candidats.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full grid place-items-center
                         text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
              aria-label="Fermer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <form onSubmit={handleSubmit} className="px-8 py-7">
          <div className="space-y-6">
            {/* TITRE */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-gray-700 mb-2 uppercase">
                Titre du poste
              </label>
              <input
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
                className="w-full h-12 px-5 rounded-full border border-gray-200
                           bg-white text-gray-800
                           focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15
                           outline-none transition"
                placeholder="Ex: Fullstack Developer (React/Node)"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-semibold tracking-wide text-gray-700 mb-2 uppercase">
                Description
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
                className="w-full px-5 py-4 rounded-3xl border border-gray-200
                           bg-white text-gray-800 resize-none
                           focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15
                           outline-none transition"
                placeholder="Décrivez la mission, le profil recherché, responsabilités..."
              />
            </div>

            {/* GRID (TECH + DATE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TECHNOLOGIES */}
              <div>
                <label className="block text-sm font-semibold tracking-wide text-gray-700 mb-2 uppercase">
                  Technologies
                </label>
                <input
                  value={form.technologies}
                  onChange={(e) =>
                    setForm({ ...form, technologies: e.target.value })
                  }
                  placeholder="React, Node.js, Tailwind"
                  className="w-full h-12 px-5 rounded-full border border-gray-200
                             bg-white text-gray-800
                             focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15
                             outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Sépare avec une virgule.
                </p>
              </div>

              {/* DATE */}
              <div>
                <label className="block text-sm font-semibold tracking-wide text-gray-700 mb-2 uppercase">
                  Date de clôture
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.dateCloture}
                    onChange={(e) =>
                      setForm({ ...form, dateCloture: e.target.value })
                    }
                    className="w-full h-12 px-5 pr-12 rounded-full border border-gray-200
                               bg-white text-gray-800
                               focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15
                               outline-none transition"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="sm:flex-1 h-12 rounded-full font-semibold
                         bg-[#6CB33F] hover:bg-[#5AA332] text-white
                         transition shadow-sm"
            >
              Enregistrer
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(emptyForm); // ✅ reset direct
                onClose();
              }}
              className="sm:flex-1 h-12 rounded-full font-semibold
                         border border-gray-200 text-gray-700
                         hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
