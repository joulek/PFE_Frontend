"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";
import {
  createFiche,
  createCriterion,
} from "../../../services/evaluationCriteria.api";

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-3xl p-8 border transition",
        "bg-white border-[#bbf7d0] shadow-[0_10px_30px_rgba(16,24,40,0.08)]",
        "dark:bg-[#0F1A2B] dark:border-white/10 dark:shadow-none",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full bg-green-600 dark:bg-[#7CC242]" />
      <h2 className="text-lg font-extrabold text-[#0B1220] dark:text-white">
        {children}
      </h2>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-sm font-semibold text-[#0B1220] dark:text-white">
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={[
        "mt-2 w-full rounded-full border px-6 py-4 text-sm outline-none transition",
        "bg-white border-[#bbf7d0] focus:border-green-400 focus:ring-4 focus:ring-green-200/40",
        "text-[#0B1220] placeholder:text-black/35",
        "dark:bg-[#0B1220] dark:border-white/10 dark:text-white dark:placeholder:text-white/35",
        "dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={[
        "mt-2 w-full rounded-3xl border px-6 py-4 text-sm outline-none transition",
        "bg-white border-[#bbf7d0] focus:border-green-400 focus:ring-4 focus:ring-green-200/40",
        "text-[#0B1220] placeholder:text-black/35",
        "dark:bg-[#0B1220] dark:border-white/10 dark:text-white dark:placeholder:text-white/35",
        "dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={[
        "mt-2 w-full rounded-full border px-6 py-4 text-sm outline-none transition",
        "bg-white border-[#bbf7d0] focus:border-green-400 focus:ring-4 focus:ring-green-200/40",
        "text-[#0B1220]",
        "dark:bg-[#0B1220] dark:border-white/10 dark:text-white",
        "dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function OutlineGreenButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition",
        "border-2 border-green-600 bg-white text-green-700 hover:bg-green-50",
        "dark:border-[#7CC242] dark:bg-[#0F1A2B] dark:text-white dark:hover:bg-white/5",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SolidGreenButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition",
        "bg-green-600 text-white hover:bg-green-700 disabled:opacity-60",
        "dark:bg-[#7CC242] dark:text-[#0B1220] dark:hover:opacity-90",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DashedAddButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "w-full rounded-2xl border-2 border-dashed px-6 py-5 text-sm font-bold transition",
        "border-green-200 bg-white/70 text-[#0B1220] hover:bg-white",
        "dark:border-white/15 dark:bg-[#0F1A2B] dark:text-white dark:hover:bg-white/5",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PreviewOption({ label }) {
  return (
    <label className="flex items-center gap-4 rounded-2xl border border-[#bbf7d0] bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0B1220]">
      <input
        type="radio"
        disabled
        className="h-5 w-5 accent-green-600"
      />
      <span className="text-[15px] font-medium text-[#0B1220] dark:text-white">
        {label}
      </span>
    </label>
  );
}

function CriterionPreview({ criterion }) {
  if (criterion.type === "boolean") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
        <h4 className="font-extrabold text-[#0B1220] dark:text-white">
          Aperçu du rendu
        </h4>
        <div className="mt-4 space-y-3">
          <PreviewOption label="Oui" />
          <PreviewOption label="Non" />
        </div>
      </div>
    );
  }

  if (criterion.type === "choice") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
        <h4 className="font-extrabold text-[#0B1220] dark:text-white">
          Aperçu du rendu
        </h4>

        {criterion.choices.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-amber-700 dark:text-amber-300">
            Ajoutez des options pour voir l’aperçu.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {criterion.choices.map((opt, i) => (
              <PreviewOption key={i} label={opt} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (criterion.type === "score") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
        <h4 className="font-extrabold text-[#0B1220] dark:text-white">
          Aperçu du rendu
        </h4>
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from(
            {
              length:
                Number(criterion.scale.max) >= Number(criterion.scale.min)
                  ? Number(criterion.scale.max) - Number(criterion.scale.min) + 1
                  : 0,
            },
            (_, idx) => Number(criterion.scale.min) + idx,
          ).map((value) => (
            <span
              key={value}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[#bbf7d0] bg-white px-4 py-2 text-sm font-bold text-[#166534] dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
      <h4 className="font-extrabold text-[#0B1220] dark:text-white">
        Aperçu du rendu
      </h4>
      <Textarea
        rows={3}
        disabled
        placeholder="Votre évaluation..."
        className="cursor-not-allowed opacity-90"
      />
    </div>
  );
}

function emptyCriterion() {
  return {
    id: crypto.randomUUID(),
    label: "",
    description: "",
    type: "text",
    weight: 1,
    isActive: true,
    order: 0,
    scale: { min: 1, max: 5, step: 1 },
    choices: [],
    newChoice: "",
  };
}

export default function CreateEvaluationFichePage() {
  const [name, setName] = useState("Fiche d'évaluation");
  const [description, setDescription] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [criteria, setCriteria] = useState([emptyCriterion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addCriterion = () =>
    setCriteria((prev) => [
      ...prev,
      { ...emptyCriterion(), order: prev.length },
    ]);

  const removeCriterion = (id) =>
    setCriteria((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c, index) => ({ ...c, order: index })),
    );

  const updateCriterionField = (id, patch) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const addChoice = (id) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const value = (c.newChoice || "").trim();
        if (!value) return c;
        return {
          ...c,
          choices: [...c.choices, value],
          newChoice: "",
        };
      }),
    );
  };

  const removeChoice = (id, idx) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          choices: c.choices.filter((_, i) => i !== idx),
        };
      }),
    );
  };

  const validate = () => {
    const errs = [];

    if (!name.trim()) errs.push("Le titre de la fiche est obligatoire.");

    criteria.forEach((c, idx) => {
      if (!c.label.trim()) errs.push(`Critère ${idx + 1}: label obligatoire.`);

      if (c.type === "choice" && c.choices.length === 0) {
        errs.push(`Critère ${idx + 1}: ajoute au moins un choix.`);
      }

      if (c.type === "score") {
        if (Number(c.scale.min) >= Number(c.scale.max)) {
          errs.push(`Critère ${idx + 1}: min < max requis.`);
        }
        if (Number(c.scale.step) <= 0) {
          errs.push(`Critère ${idx + 1}: step > 0 requis.`);
        }
      }
    });

    return errs;
  };

  const onSave = async () => {
    setError("");
    const errs = validate();

    if (errs.length) {
      setError(errs.join(" "));
      return;
    }

    setSaving(true);

    try {
      const ficheRes = await createFiche({
        name,
        description,
        interviewType,
        isActive,
      });

      const ficheId =
        ficheRes?.data?._id || ficheRes?.data?.fiche?._id || ficheRes?.data?.id;

      if (!ficheId) {
        throw new Error("ID de la fiche non récupéré.");
      }

      for (let i = 0; i < criteria.length; i++) {
        const c = criteria[i];

        await createCriterion({
          ficheId,
          label: c.label,
          description: c.description,
          type: c.type,
          weight: Number(c.weight),
          isActive: !!c.isActive,
          order: Number(c.order ?? i),
          scale: c.type === "score" ? c.scale : undefined,
          choices: c.type === "choice" ? c.choices : undefined,
        });
      }

      window.location.href = "/recruiter/criteres-evaluation";
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Erreur enregistrement",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF8F0] p-8 dark:bg-[#0B1220]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#0B1220] dark:text-white">
              Créer une fiche d'évaluation
            </h1>
            <p className="mt-2 text-sm text-[#0B1220]/70 dark:text-white/60">
              Définissez le titre, la description, puis ajoutez vos critères.
            </p>
          </div>

          <Link href="/recruiter/criteres-evaluation">
            <OutlineGreenButton>
              <ArrowLeft size={18} />
              Retour
            </OutlineGreenButton>
          </Link>
        </div>

        <div className="mt-8">
          <Card>
            <div className="flex items-start justify-between gap-6">
              <SectionTitle>Informations générales</SectionTitle>

              <div className="flex items-center gap-3">
                <span className="text-sm text-[#0B1220] dark:text-white">
                  Activer la fiche
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 accent-green-600"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label>Titre de la fiche</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="mt-6">
              <Label>Type d'entretien</Label>
              <Select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option value="">-- Sélectionner un type --</option>
                <option value="Entretien téléphonique">
                  Entretien téléphonique
                </option>
                <option value="Entretien RH">Entretien RH</option>
                <option value="Entretien technique">Entretien technique</option>
                <option value="Entretien RH + technique">
                  Entretien RH + technique
                </option>
              </Select>
            </div>

            <div className="mt-6">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black text-[#0B1220] dark:text-white">
            Critères
          </h2>

          <div className="mt-6 space-y-6">
            {criteria.map((c, idx) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-black uppercase tracking-wide text-green-700 dark:text-[#7CC242]">
                    CRITÈRE {idx + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => removeCriterion(c.id)}
                    className="rounded-xl p-2 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                    title="Supprimer"
                    aria-label="Supprimer"
                    disabled={criteria.length === 1}
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <Label>Label *</Label>
                    <Input
                      value={c.label}
                      onChange={(e) =>
                        updateCriterionField(c.id, { label: e.target.value })
                      }
                      placeholder="Ex: Communication"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={c.description}
                      onChange={(e) =>
                        updateCriterionField(c.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Description du critère"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={c.type}
                        onChange={(e) =>
                          updateCriterionField(c.id, { type: e.target.value })
                        }
                      >
                        <option value="text">Texte</option>
                        <option value="score">Score</option>
                        <option value="choice">Choix</option>
                        <option value="boolean">Oui/Non</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Poids</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={c.weight}
                        onChange={(e) =>
                          updateCriterionField(c.id, { weight: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Ordre</Label>
                      <Input
                        type="number"
                        value={c.order}
                        onChange={(e) =>
                          updateCriterionField(c.id, {
                            order: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3 md:col-span-3 md:justify-end">
                      <input
                        type="checkbox"
                        checked={c.isActive}
                        onChange={(e) =>
                          updateCriterionField(c.id, {
                            isActive: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-[#0B1220] dark:text-white">
                        Actif
                      </span>
                    </div>
                  </div>

                  {c.type === "score" && (
                    <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
                      <h4 className="font-extrabold text-[#0B1220] dark:text-white">
                        Échelle de score
                      </h4>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label>Min</Label>
                          <Input
                            type="number"
                            value={c.scale.min}
                            onChange={(e) =>
                              updateCriterionField(c.id, {
                                scale: {
                                  ...c.scale,
                                  min: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Max</Label>
                          <Input
                            type="number"
                            value={c.scale.max}
                            onChange={(e) =>
                              updateCriterionField(c.id, {
                                scale: {
                                  ...c.scale,
                                  max: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Pas</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={c.scale.step}
                            onChange={(e) =>
                              updateCriterionField(c.id, {
                                scale: {
                                  ...c.scale,
                                  step: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {c.type === "choice" && (
                    <div className="rounded-3xl border border-green-200 bg-green-50 p-6 dark:border-white/10 dark:bg-white/5">
                      <h4 className="font-extrabold text-[#0B1220] dark:text-white">
                        Options
                      </h4>

                      <div className="mt-4 flex flex-col gap-3 md:flex-row">
                        <Input
                          value={c.newChoice}
                          onChange={(e) =>
                            updateCriterionField(c.id, {
                              newChoice: e.target.value,
                            })
                          }
                          placeholder="Ajouter une option"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addChoice(c.id);
                            }
                          }}
                        />
                        <OutlineGreenButton
                          type="button"
                          onClick={() => addChoice(c.id)}
                          className="md:w-[180px]"
                        >
                          Ajouter
                        </OutlineGreenButton>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {c.choices.map((opt, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-extrabold text-green-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() => removeChoice(c.id, i)}
                              className="rounded-full p-1 hover:bg-red-50 dark:hover:bg-red-500/10"
                              aria-label="Supprimer option"
                            >
                              <X size={14} className="text-red-500" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <CriterionPreview criterion={c} />
                </div>
              </Card>
            ))}

            <DashedAddButton type="button" onClick={addCriterion}>
              <Plus size={18} className="inline-block" /> Ajouter un critère
            </DashedAddButton>

            {error && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <Link
                href="/recruiter/criteres-evaluation"
                className="md:order-1"
              >
                <OutlineGreenButton className="w-full md:w-auto">
                  <X size={18} />
                  Annuler
                </OutlineGreenButton>
              </Link>

              <SolidGreenButton
                onClick={onSave}
                disabled={saving}
                className="w-full md:w-auto"
              >
                <Check size={18} />
                {saving ? "Enregistrement..." : "Enregistrer la fiche"}
              </SolidGreenButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}