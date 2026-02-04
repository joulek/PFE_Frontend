"use client";

import { useState, useEffect, useMemo } from "react";

export default function JobModal({
  open,
  onClose,
  onSubmit,
  initialData,
  users = [],
}) {
  const emptyForm = {
    titre: "",
    description: "",
    technologies: "",
    dateCloture: "",
    scores: {
      skillsFit: 30,
      experienceFit: 30,
      projectsFit: 20,
      educationFit: 10,
      communicationFit: 10,
    },
  };

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");

  const items = useMemo(
    () => [
      { key: "skillsFit", label: "Skills Fit" },
      { key: "experienceFit", label: "Professional Experience Fit" },
      { key: "projectsFit", label: "Projects Fit & Impact" },
      { key: "educationFit", label: "Education / Certifications" },
      { key: "communicationFit", label: "Communication / Clarity signals" },
    ],
    [],
  );

  useEffect(() => {
    if (!open) return;

    Promise.resolve().then(() => {
      if (initialData) {
        setForm({
          titre: initialData.titre || "",
          description: initialData.description || "",
          technologies: Array.isArray(initialData.technologies)
            ? initialData.technologies.join(", ")
            : initialData.technologies || "",
          dateCloture: initialData.dateCloture
            ? String(initialData.dateCloture).slice(0, 10)
            : "",
          scores: {
            skillsFit: initialData?.scores?.skillsFit ?? 30,
            experienceFit: initialData?.scores?.experienceFit ?? 30,
            projectsFit: initialData?.scores?.projectsFit ?? 20,
            educationFit: initialData?.scores?.educationFit ?? 10,
            communicationFit: initialData?.scores?.communicationFit ?? 10,
          },
        });

        const id =
          Array.isArray(initialData.assignedUserIds) &&
          initialData.assignedUserIds.length > 0
            ? (typeof initialData.assignedUserIds[0] === "string"
                ? initialData.assignedUserIds[0]
                : initialData.assignedUserIds[0]?._id)
            : "";

        setAssignedUserId(id);
      } else {
        setForm(emptyForm);
        setAssignedUserId("");
      }

      setFormError("");
    });
  }, [open, initialData]);

  if (!open) return null;

  function setWeight(key, value) {
    setFormError("");

    let v = Number(value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;

    setForm((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [key]: v,
      },
    }));
  }

  const totalWeights = Object.values(form.scores || {}).reduce(
    (sum, v) => sum + Number(v || 0),
    0,
  );

  const isValidTotal = totalWeights === 100;

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!isValidTotal) {
      setFormError("❌ La somme des pondérations doit être égale à 100%");
      return;
    }

    onSubmit({
      titre: form.titre,
      description: form.description,
      dateCloture: form.dateCloture || null,
      technologies: String(form.technologies || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      scores: form.scores,
      assignedUserIds: assignedUserId ? [assignedUserId] : [],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">
        {/* ===== HEADER ===== */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {initialData ? "Modifier l'offre" : "Ajouter une offre"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Mettez à jour les informations de l&apos;annonce pour les
                candidats.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-10 w-10 rounded-full grid place-items-center 
                         text-gray-500 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-white 
                         hover:bg-gray-100 dark:hover:bg-gray-700 
                         transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="space-y-5 sm:space-y-6">
              {/* ERROR */}
              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* TITRE */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Titre du poste
                </label>
                <input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  required
                  className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full 
                             border border-gray-200 dark:border-gray-600 
                             bg-white dark:bg-gray-700 
                             text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:border-[#6CB33F] dark:focus:border-emerald-500 
                             focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                             outline-none transition-colors"
                  placeholder="Ex: Fullstack Developer (React/Node)"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl 
                             border border-gray-200 dark:border-gray-600 
                             bg-white dark:bg-gray-700 
                             text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500
                             resize-none
                             focus:border-[#6CB33F] dark:focus:border-emerald-500 
                             focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                             outline-none transition-colors"
                  placeholder="Décrivez la mission, le profil recherché, responsabilités..."
                />
              </div>

              {/* GRID (TECH + DATE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* TECHNOLOGIES */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                    Technologies
                  </label>
                  <input
                    value={form.technologies}
                    onChange={(e) =>
                      setForm({ ...form, technologies: e.target.value })
                    }
                    placeholder="React, Node.js, Tailwind"
                    className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full 
                               border border-gray-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 
                               text-gray-800 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:border-[#6CB33F] dark:focus:border-emerald-500 
                               focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                               outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Sépare avec une virgule.
                  </p>
                </div>

                {/* DATE */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                    Date de clôture
                  </label>
                  <input
                    type="date"
                    value={form.dateCloture}
                    onChange={(e) =>
                      setForm({ ...form, dateCloture: e.target.value })
                    }
                    className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full 
                               border border-gray-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 
                               text-gray-800 dark:text-gray-100
                               focus:border-[#6CB33F] dark:focus:border-emerald-500 
                               focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                               outline-none transition-colors"
                  />
                </div>
              </div>

              {/* ✅ SELECT USERS */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase">
                  Affectation utilisateurs
                </label>

                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full h-12 px-4 py-3 rounded-2xl 
                             border border-gray-200 dark:border-gray-600 
                             bg-white dark:bg-gray-700 
                             text-gray-800 dark:text-gray-100
                             focus:border-[#6CB33F] dark:focus:border-emerald-500 
                             focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                             outline-none transition-colors"
                >
                  <option value="">-- Choisir un utilisateur --</option>

                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      [{u.role}] {u.prenom} {u.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* WEIGHTS */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">
                    Pondérations (0 - 100)
                  </h3>

                  <span
                    className={`text-sm font-extrabold ${
                      isValidTotal ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    Total: {totalWeights}%
                  </span>
                </div>

                <div className="space-y-4">
                  {items.map((it) => {
                    const v = form.scores[it.key] ?? 0;

                    return (
                      <div
                        key={it.key}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                      >
                        <p className="sm:flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {it.label}
                        </p>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={v}
                            onChange={(e) => setWeight(it.key, e.target.value)}
                            className="w-24 h-11 px-4 rounded-xl sm:rounded-full 
                                       border border-gray-200 dark:border-gray-600 
                                       bg-white dark:bg-gray-700 
                                       text-gray-800 dark:text-gray-100
                                       focus:border-[#6CB33F] dark:focus:border-emerald-500 
                                       focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                                       outline-none transition-colors"
                          />
                          <span className="text-sm font-extrabold text-[#4E8F2F] dark:text-emerald-400 w-10">
                            %
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isValidTotal && (
                  <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
                    La somme des pondérations doit être égale à 100% pour
                    pouvoir enregistrer.
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={!isValidTotal}
                className={`sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold transition-colors shadow-sm
                  ${
                    isValidTotal
                      ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
              >
                Enregistrer
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setAssignedUserId("");
                  onClose();
                }}
                className="sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold 
                           border border-gray-200 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 
                           hover:bg-gray-50 dark:hover:bg-gray-700 
                           transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}