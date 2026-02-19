"use client";

import { useState, useEffect, useMemo } from "react";
import { BrainCircuit } from "lucide-react";

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
    softSkills: "",
    hardSkills: "",
    dateCloture: "",
    lieu: "",
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

  // ✅ Quiz options — uniquement en mode création
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [numQuestions, setNumQuestions] = useState(25);

  const isEditMode = !!initialData;

  const items = useMemo(
    () => [
      { key: "skillsFit",        label: "Skills Fit" },
      { key: "experienceFit",    label: "Professional Experience Fit" },
      { key: "projectsFit",      label: "Projects Fit & Impact" },
      { key: "educationFit",     label: "Education / Certifications" },
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
          softSkills: Array.isArray(initialData.softSkills)
            ? initialData.softSkills.join(", ")
            : initialData.softSkills || "",
          hardSkills: Array.isArray(initialData.hardSkills)
            ? initialData.hardSkills.join(", ")
            : initialData.hardSkills || "",
          dateCloture: initialData.dateCloture
            ? String(initialData.dateCloture).slice(0, 10)
            : "",
          lieu: initialData.lieu || "",
          scores: {
            skillsFit:        initialData?.scores?.skillsFit        ?? 30,
            experienceFit:    initialData?.scores?.experienceFit    ?? 30,
            projectsFit:      initialData?.scores?.projectsFit      ?? 20,
            educationFit:     initialData?.scores?.educationFit     ?? 10,
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
        setGenerateQuiz(true);
        setNumQuestions(25);
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
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: v } }));
  }

  const totalWeights = Object.values(form.scores || {}).reduce(
    (sum, v) => sum + Number(v || 0), 0,
  );
  const isValidTotal = totalWeights === 100;

  function handleNumQuestions(val) {
    let n = parseInt(val, 10);
    if (isNaN(n) || n < 1)  n = 1;
    if (n > 30)              n = 30;
    setNumQuestions(n);
  }

  function parseSkills(str) {
    return String(str || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    // ✅ Validation champs obligatoires
    if (!form.titre.trim()) {
      setFormError("❌ Le titre du poste est obligatoire.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("❌ La description est obligatoire.");
      return;
    }
    if (!form.lieu.trim()) {
      setFormError("❌ Le lieu du poste est obligatoire.");
      return;
    }
    if (!form.dateCloture) {
      setFormError("❌ La date de clôture est obligatoire.");
      return;
    }

    if (!isValidTotal) {
      setFormError("❌ La somme des pondérations doit être égale à 100%");
      return;
    }

    onSubmit({
      titre: form.titre.trim(),
      description: form.description.trim(),
      dateCloture: form.dateCloture,
      softSkills: parseSkills(form.softSkills),
      hardSkills: parseSkills(form.hardSkills),
      lieu: form.lieu.trim(),
      scores: form.scores,
      assignedUserIds: assignedUserId ? [assignedUserId] : [],
      // ✅ Transmis uniquement en mode création
      ...(!isEditMode && {
        generateQuiz,
        numQuestions: generateQuiz ? numQuestions : 0,
      }),
    });
  }

  const inputBase =
    "w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full " +
    "border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 " +
    "text-gray-800 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:border-[#6CB33F] dark:focus:border-emerald-500 " +
    "focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 " +
    "outline-none transition-colors";

  const labelBase =
    "block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">

        {/* ===== HEADER ===== */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {isEditMode ? "Modifier l'offre" : "Ajouter une offre"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tous les champs marqués <span className="text-red-500">*</span> sont obligatoires.
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
            >
              ✕
            </button>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="space-y-5 sm:space-y-6">

              {/* ERROR */}
              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* TITRE * */}
              <div>
                <label className={labelBase}>
                  Titre du poste <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className={inputBase}
                  placeholder="Ex: Fullstack Developer (React/Node)"
                />
              </div>

              {/* DESCRIPTION * */}
              <div>
                <label className={labelBase}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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

              {/* LIEU * */}
              <div>
                <label className={labelBase}>
                  Lieu du poste <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                    📍
                  </span>
                  <input
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    placeholder="Ex: Alger, Oran, Télétravail, Hybride..."
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-full 
                               border border-gray-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 
                               text-gray-800 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:border-[#6CB33F] dark:focus:border-emerald-500 
                               focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 
                               outline-none transition-colors"
                  />
                </div>
              </div>

              {/* DATE DE CLÔTURE * */}
              <div>
                <label className={labelBase}>
                  Date de clôture <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateCloture}
                  onChange={(e) => setForm({ ...form, dateCloture: e.target.value })}
                  min={new Date().toISOString().slice(0, 10)}
                  className={inputBase}
                />
              </div>

              {/* SKILLS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

                {/* HARD SKILLS * */}
                <div>
                  <label className={labelBase}>
                    Hard Skills
                  </label>
                  <input
                    value={form.hardSkills}
                    onChange={(e) => setForm({ ...form, hardSkills: e.target.value })}
                    placeholder="React, Node.js, SQL, Docker..."
                    className={inputBase}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Compétences techniques — séparées par une virgule.
                  </p>
                </div>

                {/* SOFT SKILLS * */}
                <div>
                  <label className={labelBase}>
                    Soft Skills
                  </label>
                  <input
                    value={form.softSkills}
                    onChange={(e) => setForm({ ...form, softSkills: e.target.value })}
                    placeholder="Communication, Leadership, Esprit d'équipe..."
                    className={inputBase}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Compétences comportementales — séparées par une virgule.
                  </p>
                </div>
              </div>

              {/* SELECT USERS */}
              <div>
                <label className={labelBase}>
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

              {/* ✅ QUIZ — uniquement en mode création */}
              {!isEditMode && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                  {/* Checkbox header */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={generateQuiz}
                        onChange={(e) => setGenerateQuiz(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                          generateQuiz
                            ? "bg-[#6CB33F] dark:bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                          generateQuiz ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-[#6CB33F] dark:text-emerald-400" />
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                          Générer un quiz technique
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Un quiz IA sera créé automatiquement à la publication de l&apos;offre.
                      </p>
                    </div>
                  </label>

                  {/* Nombre de questions — visible seulement si cochée */}
                  {generateQuiz && (
                    <div className="flex items-center gap-4 pl-14">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Nombre de questions
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleNumQuestions(numQuestions - 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 
                                     text-gray-700 dark:text-gray-300 font-bold
                                     hover:bg-gray-100 dark:hover:bg-gray-700
                                     transition-colors flex items-center justify-center"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={numQuestions}
                          onChange={(e) => handleNumQuestions(e.target.value)}
                          className="w-16 h-9 text-center rounded-xl 
                                     border border-gray-200 dark:border-gray-600 
                                     bg-white dark:bg-gray-700 
                                     text-gray-800 dark:text-gray-100 font-bold
                                     focus:border-[#6CB33F] dark:focus:border-emerald-500
                                     focus:ring-2 focus:ring-[#6CB33F]/20 dark:focus:ring-emerald-500/20
                                     outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleNumQuestions(numQuestions + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 
                                     text-gray-700 dark:text-gray-300 font-bold
                                     hover:bg-gray-100 dark:hover:bg-gray-700
                                     transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(max 30)</span>
                      </div>
                    </div>
                  )}

                  {!generateQuiz && (
                    <p className="pl-14 text-xs text-gray-400 dark:text-gray-500 italic">
                      Aucun quiz ne sera généré. Vous pourrez en créer un manuellement plus tard.
                    </p>
                  )}
                </div>
              )}

              {/* WEIGHTS */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">
                    Pondérations (0 – 100)
                  </h3>
                  <span
                    className={`text-sm font-extrabold ${
                      isValidTotal
                        ? "text-green-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    Total : {totalWeights}%
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
                    La somme des pondérations doit être égale à 100% pour pouvoir enregistrer.
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
                  ${isValidTotal
                    ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
              >
                {!isEditMode && generateQuiz
                  ? `Enregistrer + Générer ${numQuestions} questions`
                  : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setAssignedUserId("");
                  setGenerateQuiz(true);
                  setNumQuestions(25);
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