"use client";

import { useState, useEffect } from "react";

export default function JobModal({
  open,
  onClose,
  onSubmit,
  initialData,
}) {
  const [form, setForm] = useState({
    titre: "",
    description: "",
    technologies: "",
    dateCloture: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        description: initialData.description || "",
        technologies: initialData.technologies?.join(", ") || "",
        dateCloture: initialData.dateCloture
          ? initialData.dateCloture.slice(0, 10)
          : "",
      });
    } else {
      setForm({
        titre: "",
        description: "",
        technologies: "",
        dateCloture: "",
      });
    }
  }, [initialData]);

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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-xl">

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {initialData ? "Modifier l’offre" : "Nouvelle offre"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* TITRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre du poste
            </label>
            <input
              value={form.titre}
              onChange={(e) =>
                setForm({ ...form, titre: e.target.value })
              }
              required
              className="w-full px-4 py-3 rounded-xl
                         border border-gray-300
                         focus:border-[#6CB33F]
                         focus:ring-2 focus:ring-[#6CB33F]/30
                         outline-none transition"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description du poste
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
              className="w-full px-4 py-3 rounded-xl
                         border border-gray-300
                         focus:border-[#6CB33F]
                         focus:ring-2 focus:ring-[#6CB33F]/30
                         outline-none transition"
            />
          </div>

          {/* TECHNOLOGIES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technologies requises
            </label>
            <input
              value={form.technologies}
              onChange={(e) =>
                setForm({ ...form, technologies: e.target.value })
              }
              placeholder="React, Node.js, MongoDB"
              className="w-full px-4 py-3 rounded-xl
                         border border-gray-300
                         focus:border-[#6CB33F]
                         focus:ring-2 focus:ring-[#6CB33F]/30
                         outline-none transition"
            />
          </div>

          {/* DATE CLOTURE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de clôture
            </label>
            <input
              type="date"
              value={form.dateCloture}
              onChange={(e) =>
                setForm({ ...form, dateCloture: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl
                         border border-gray-300
                         focus:border-[#6CB33F]
                         focus:ring-2 focus:ring-[#6CB33F]/30
                         outline-none transition"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-[#6CB33F] hover:bg-[#4E8F2F]
                         text-white py-3 rounded-xl
                         font-semibold transition"
            >
              Enregistrer
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl
                         border border-gray-300
                         text-gray-700 hover:bg-gray-50
                         transition"
            >
              Annuler
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
