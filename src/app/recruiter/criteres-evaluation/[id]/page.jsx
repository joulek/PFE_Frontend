"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getFicheWithCriteria,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  updateFiche,
} from "../../../services/evaluationCriteria.api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Clock3,
  CheckCircle2,
} from "lucide-react";

function Badge({ children, active }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border",
        active
          ? "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/25 dark:bg-[#16a34a]/15 dark:text-[#7CC242] dark:border-[#7CC242]/25"
          : "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Card({ children }) {
  return (
    <div
      className={[
        "relative rounded-2xl p-8",
        "bg-white border border-[#d1fae5]",
        "shadow-[0_8px_20px_rgba(16,24,40,0.06)]",
        "dark:bg-[#0F1A2B] dark:border-white/10 dark:shadow-none",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function InputBase(props) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition",
        "bg-white border-[#86efac]/70 focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/10",
        "placeholder:text-[#9ca3af] text-[#111827]",
        "dark:bg-[#0B1220] dark:text-white dark:border-white/10 dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function TextareaBase(props) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition",
        "bg-white border-[#86efac]/70 focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/10",
        "placeholder:text-[#9ca3af] text-[#111827]",
        "dark:bg-[#0B1220] dark:text-white dark:border-white/10 dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SelectBase(props) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition",
        "bg-white border-[#86efac]/70 focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/10",
        "text-[#111827]",
        "dark:bg-[#0B1220] dark:text-white dark:border-white/10 dark:focus:border-[#7CC242] dark:focus:ring-[#7CC242]/10",
        props.className || "",
      ].join(" ")}
    />
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition",
        "bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-60",
        "dark:bg-[#7CC242] dark:text-[#0B1220] dark:hover:opacity-90",
        props.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition",
        "border border-[#16a34a]/35 bg-white text-[#166534] hover:bg-[#16a34a]/5 disabled:opacity-60",
        "dark:bg-[#0F1A2B] dark:text-white dark:border-white/10 dark:hover:bg-white/5",
        props.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DashedButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition",
        "border-2 border-dashed border-[#86efac] bg-white/60 text-[#166534] hover:bg-white",
        "dark:bg-[#0F1A2B] dark:text-white dark:border-white/15 dark:hover:bg-white/5",
        props.className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ===================== MODAL DELETE ===================== */
function DeleteCriterionModal({ criterion, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-[#0F1A2B]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:text-white/50"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white">
          Supprimer le critère
        </h3>
        <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
          Cette action est irréversible
        </p>

        <div className="my-6 h-px bg-gray-200 dark:bg-white/10" />

        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/15">
              <AlertCircle size={28} className="text-red-500" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[15px] text-[#111827] dark:text-white">
              Êtes-vous sûr de vouloir supprimer ce critère ?
            </p>
            <p className="mt-2 font-extrabold text-[#111827] dark:text-white">
              {criterion?.label}
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <OutlineButton onClick={onClose} disabled={loading} className="flex-1">
            Annuler
          </OutlineButton>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== FORM CRITERION ===================== */
function CriterionForm({ criterion, ficheId, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    label: criterion?.label || "",
    description: criterion?.description || "",
    type: criterion?.type || "text",
    order: criterion?.order ?? 0,
    weight: criterion?.weight ?? 1,
    isActive: criterion?.isActive ?? true,
    scale: criterion?.scale || { min: 1, max: 5, step: 1 },
    choices: criterion?.choices || [],
  });

  const [newChoice, setNewChoice] = useState("");
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors([]);
  };

  const handleScaleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      scale: { ...prev.scale, [field]: Number(value) },
    }));
  };

  const addChoice = () => {
    if (!newChoice.trim()) return;
    setFormData((prev) => ({ ...prev, choices: [...prev.choices, newChoice.trim()] }));
    setNewChoice("");
  };

  const removeChoice = (index) => {
    setFormData((prev) => ({ ...prev, choices: prev.choices.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const newErrors = [];
    if (!formData.label.trim()) newErrors.push("Le label est obligatoire");
    if (!formData.type) newErrors.push("Le type est obligatoire");

    if (formData.type === "score") {
      if (Number(formData.scale.min) >= Number(formData.scale.max)) {
        newErrors.push("scale.min doit être inférieur à scale.max");
      }
      if (Number(formData.scale.step) <= 0) {
        newErrors.push("scale.step doit être supérieur à 0");
      }
    }

    if (formData.type === "choice" && formData.choices.length === 0) {
      newErrors.push("Ajoutez au moins un choix pour ce type");
    }

    if (newErrors.length) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ficheId: criterion?.ficheId || ficheId,
      ...formData,
      weight: Number(formData.weight),
      order: Number(formData.order),
    };

    try {
      if (criterion?._id) await updateCriterion(criterion._id, payload);
      else await createCriterion(payload);
      onSave();
    } catch (err) {
      setErrors([err?.response?.data?.message || "Erreur sauvegarde"]);
    }
  };

  return (
    <Card>
      <h3 className="text-[18px] font-extrabold uppercase tracking-wide text-[#16a34a] dark:text-[#7CC242]">
        {criterion?._id ? "MODIFIER CRITÈRE" : "NOUVEAU CRITÈRE"}
      </h3>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="text-[15px] font-medium text-[#111827] dark:text-white">
              Label *
            </label>
            <div className="mt-2">
              <InputBase
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Ex: Connaissance du secteur"
              />
            </div>
          </div>

          <div>
            <label className="text-[15px] font-medium text-[#111827] dark:text-white">
              Type *
            </label>
            <div className="mt-2">
              <SelectBase name="type" value={formData.type} onChange={handleChange}>
                <option value="text">Texte</option>
                <option value="score">Score</option>
                <option value="choice">Choix</option>
                <option value="boolean">Oui/Non</option>
              </SelectBase>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[15px] font-medium text-[#111827] dark:text-white">
            Description
          </label>
          <div className="mt-2">
            <TextareaBase
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du critère"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-end">
          <div>
            <label className="text-[15px] font-medium text-[#111827] dark:text-white">
              Poids
            </label>
            <div className="mt-2">
              <InputBase
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:justify-center">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="isActive" className="text-[15px] text-[#111827] dark:text-white">
              Actif
            </label>
          </div>

          
        </div>

        {formData.type === "score" && (
          <div className="rounded-2xl border border-[#86efac]/60 bg-[#16a34a]/5 p-5 dark:border-white/10 dark:bg-white/5">
            <h4 className="text-[15px] font-bold text-[#111827] dark:text-white">
              Échelle de score
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-white">Min</label>
                <div className="mt-2">
                  <InputBase
                    type="number"
                    value={formData.scale.min}
                    onChange={(e) => handleScaleChange("min", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-white">Max</label>
                <div className="mt-2">
                  <InputBase
                    type="number"
                    value={formData.scale.max}
                    onChange={(e) => handleScaleChange("max", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-white">Pas</label>
                <div className="mt-2">
                  <InputBase
                    type="number"
                    value={formData.scale.step}
                    onChange={(e) => handleScaleChange("step", e.target.value)}
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.type === "choice" && (
          <div className="rounded-2xl border border-[#86efac]/60 bg-[#16a34a]/5 p-5 dark:border-white/10 dark:bg-white/5">
            <h4 className="text-[15px] font-bold text-[#111827] dark:text-white">
              Options
            </h4>

            <div className="mt-4 flex gap-2">
              <InputBase
                value={newChoice}
                onChange={(e) => setNewChoice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChoice();
                  }
                }}
                placeholder="Ajouter une option"
              />
              <OutlineButton type="button" onClick={addChoice}>
                Ajouter
              </OutlineButton>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {formData.choices.map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#86efac]/60 bg-white px-3 py-2 text-sm font-bold text-[#166534] dark:bg-[#0B1220] dark:text-white dark:border-white/10"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeChoice(idx)}
                    className="rounded-lg p-1 hover:bg-red-50 dark:hover:bg-red-500/10"
                    aria-label="Supprimer option"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            {errors.map((er, i) => (
              <div key={i} className="text-sm font-semibold text-red-600 dark:text-red-400">
                • {er}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-black/10 pt-6 md:flex-row dark:border-white/10">
          <PrimaryButton type="submit" disabled={isLoading} className="flex-1">
            <Check size={16} />
            Enregistrer
          </PrimaryButton>
          <OutlineButton type="button" onClick={onCancel} disabled={isLoading} className="flex-1">
            <X size={16} />
            Annuler
          </OutlineButton>
        </div>
      </form>
    </Card>
  );
}

/* ===================== PAGE ===================== */
export default function EvaluationFicheDetailsPage() {
  const params = useParams();
  const ficheId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fiche, setFiche] = useState(null);
  const [criteria, setCriteria] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingFiche, setEditingFiche] = useState(false);

  const [deletingCriterion, setDeletingCriterion] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [ficheName, setFicheName] = useState("");
  const [ficheDescription, setFicheDescription] = useState("");
  const [ficheInterviewType, setFicheInterviewType] = useState(""); // 🆕 Type d'entretien
  const [ficheSaving, setFicheSaving] = useState(false);

  async function load() {
    if (!ficheId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getFicheWithCriteria(ficheId);
      setFiche(res?.data?.fiche);
      setFicheName(res?.data?.fiche?.name || "");
      setFicheDescription(res?.data?.fiche?.description || "");
      setFicheInterviewType(res?.data?.fiche?.interviewType || ""); // 🆕
      setCriteria(Array.isArray(res?.data?.criteria) ? res.data.criteria : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur chargement fiche");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficheId]);

  async function saveFiche() {
    if (!ficheName.trim()) {
      setError("Le nom est obligatoire");
      return;
    }
    setFicheSaving(true);
    setError("");
    try {
      await updateFiche(ficheId, {
        name: ficheName,
        description: ficheDescription,
        interviewType: ficheInterviewType, // 🆕
        isActive: fiche?.isActive,
      });
      setEditingFiche(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur mise à jour fiche");
    } finally {
      setFicheSaving(false);
    }
  }

  async function onDeleteCriterion() {
    if (!deletingCriterion) return;
    setDeleting(true);
    try {
      await deleteCriterion(deletingCriterion._id);
      setDeletingCriterion(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur suppression critère");
    } finally {
      setDeleting(false);
    }
  }

  if (!ficheId) {
    return (
      <div className="min-h-screen bg-[#EEF8F0] p-6 dark:bg-[#0B1220]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-bold text-red-600">Fiche introuvable</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF8F0] p-6 dark:bg-[#0B1220]">
        <div className="mx-auto max-w-5xl py-12 text-center">
          <p className="font-semibold text-[#111827] dark:text-white">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF8F0] p-6 dark:bg-[#0B1220]">
      <div className="mx-auto w-full max-w-5xl">
        {/* RETOUR */}
        <div className="mb-6">
          <Link
            href="/recruiter/criteres-evaluation"
            className="inline-flex items-center gap-2 rounded-xl border border-[#16a34a]/35 bg-white px-5 py-3 text-sm font-bold text-[#166534] hover:bg-[#16a34a]/5 transition dark:bg-[#0F1A2B] dark:text-white dark:border-white/10 dark:hover:bg-white/5"
          >
            <ArrowLeft size={18} />
            Retour
          </Link>
        </div>

        {/* HEADER FICHE */}
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-[#111827] dark:text-white">
                {fiche?.name}
              </h1>
              <p className="mt-2 text-[15px] text-[#111827]/60 dark:text-white/60">
                {fiche?.description || ""}
              </p>

              {fiche?.interviewType && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full border border-[#86efac]/60 bg-[#16a34a]/5 px-3 py-1 text-xs font-bold text-[#166534] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    {fiche.interviewType}
                  </span>
                </div>
              )}

              <div className="mt-4">
                <Badge active={fiche?.isActive}>
                  {fiche?.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <OutlineButton
              onClick={() => setEditingFiche((v) => !v)}
              className="md:self-start"
            >
              <Pencil size={16} />
              Modifier
            </OutlineButton>
          </div>
        </Card>

        {/* EDIT FICHE */}
        {editingFiche && (
          <div className="mt-6">
            <Card>
              <h3 className="text-[18px] font-extrabold uppercase tracking-wide text-[#16a34a] dark:text-[#7CC242]">
                MODIFIER LA FICHE
              </h3>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-[15px] font-medium text-[#111827] dark:text-white">
                    Nom de la fiche *
                  </label>
                  <div className="mt-2">
                    <InputBase value={ficheName} onChange={(e) => setFicheName(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-medium text-[#111827] dark:text-white">
                    Type d'entretien
                  </label>
                  <div className="mt-2">
                    <SelectBase value={ficheInterviewType} onChange={(e) => setFicheInterviewType(e.target.value)}>
                      <option value="">-- Sélectionner un type --</option>
                      <option value="Entretien RH">Entretien RH</option>
                      <option value="Entretien technique">Entretien technique</option>
                      <option value="Entretien RH + technique">Entretien RH + technique</option>
                    </SelectBase>
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-medium text-[#111827] dark:text-white">
                    Description
                  </label>
                  <div className="mt-2">
                    <TextareaBase
                      rows={3}
                      value={ficheDescription}
                      onChange={(e) => setFicheDescription(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-black/10 pt-6 md:flex-row dark:border-white/10">
                  <PrimaryButton onClick={saveFiche} disabled={ficheSaving} className="flex-1">
                    <Check size={16} />
                    {ficheSaving ? "Enregistrement..." : "Enregistrer"}
                  </PrimaryButton>
                  <OutlineButton onClick={() => setEditingFiche(false)} disabled={ficheSaving} className="flex-1">
                    <X size={16} />
                    Annuler
                  </OutlineButton>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ERROR */}
        {error && !editingFiche && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* CRITERES */}
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-[#111827] dark:text-white">
              Critères
            </h2>

            {!creatingNew && (
              <OutlineButton onClick={() => setCreatingNew(true)}>
                <Plus size={16} />
                Nouveau critère
              </OutlineButton>
            )}
          </div>

          {!creatingNew && criteria.length === 0 && (
            <DashedButton onClick={() => setCreatingNew(true)}>
              <CheckCircle2 size={18} />
              Ajouter un critère
            </DashedButton>
          )}

          {creatingNew && (
            <div className="mt-6">
              <CriterionForm
                criterion={null}
                ficheId={ficheId}
                onSave={() => {
                  setCreatingNew(false);
                  load();
                }}
                onCancel={() => setCreatingNew(false)}
                isLoading={loading}
              />
            </div>
          )}

          {editingId && (
            <div className="mt-6">
              <CriterionForm
                criterion={criteria.find((c) => c._id === editingId)}
                ficheId={ficheId}
                onSave={() => {
                  setEditingId(null);
                  load();
                }}
                onCancel={() => setEditingId(null)}
                isLoading={loading}
              />
            </div>
          )}

          <div className="mt-6 space-y-5">
            {criteria.length === 0 ? (
              <p className="text-center text-[#111827]/60 dark:text-white/60">
                Aucun critère. Cliquez sur "Nouveau critère" pour en ajouter.
              </p>
            ) : (
              criteria.map((criterion, idx) => (
                <Card key={criterion._id}>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <h3 className="text-[18px] font-extrabold uppercase tracking-wide text-[#16a34a] dark:text-[#7CC242]">
                      CRITÈRE {idx + 1}
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(criterion._id)}
                        className="rounded-lg  bg-white p-2 hover:bg-[#16a34a]/5 transition dark:border-white/10 dark:bg-[#0B1220] dark:hover:bg-white/5"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Pencil size={18} className="text-[#166534] dark:text-white" />
                      </button>

                      <button
                        onClick={() => setDeletingCriterion(criterion)}
                        className="rounded-lg p-2 hover:bg-red-50 transition dark:hover:bg-red-500/10"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-extrabold text-[#111827] dark:text-white">
                      {criterion.label}
                    </div>

                    {criterion.description && (
                      <div className="text-[15px] text-[#111827]/70 dark:text-white/70">
                        {criterion.description}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full border border-[#86efac]/60 bg-[#16a34a]/5 px-3 py-1 text-[#166534] dark:border-white/10 dark:bg-white/5 dark:text-white">
                        Type: {criterion.type}
                      </span>
                      <span className="rounded-full border border-[#86efac]/60 bg-[#16a34a]/5 px-3 py-1 text-[#166534] dark:border-white/10 dark:bg-white/5 dark:text-white">
                        Poids: {criterion.weight}
                      </span>
                      <Badge active={criterion.isActive}>
                        {criterion.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {criterion.type === "score" && criterion.scale && (
                      <div className="mt-3 text-xs font-semibold text-[#111827]/60 dark:text-white/60">
                        Échelle: {criterion.scale.min} à {criterion.scale.max} (pas:{" "}
                        {criterion.scale.step})
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {deletingCriterion && (
        <DeleteCriterionModal
          criterion={deletingCriterion}
          onClose={() => setDeletingCriterion(null)}
          onConfirm={onDeleteCriterion}
          loading={deleting}
        />
      )}
    </div>
  );
}