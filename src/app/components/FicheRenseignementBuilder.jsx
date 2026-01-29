"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timer, CheckCircle, Trash2, ArrowLeft } from "lucide-react";
import {
  createFiche,
  updateFiche,
  getFicheById,
} from "@/app/services/fiche.api";

/* ================= HELPERS ================= */
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random();

const defaultScale = {
  min: 0,
  max: 4,
  labels: {
    0: "Néant",
    1: "Débutant",
    2: "Intermédiaire",
    3: "Avancé",
    4: "Expert",
  },
};

const createQuestion = () => ({
  id: uid(),
  label: "",
  type: "text",
  required: false,
  timeLimit: 0,
  options: [],
  items: [],
  scale: null,
});

const createOption = () => ({ id: uid(), label: "", hasText: false });
const createItem = () => ({ id: uid(), label: "" });

function ensureIds(questions = []) {
  return questions.map((q) => ({
    ...createQuestion(),
    ...q,
    id: q.id || uid(),
    options: (q.options || []).map((o) => ({
      ...createOption(),
      ...o,
      id: o.id || uid(),
    })),
    items: (q.items || []).map((it) => ({
      ...createItem(),
      ...it,
      id: it.id || uid(),
    })),
    scale:
      q.type === "scale_group"
        ? { ...defaultScale, ...(q.scale || {}) }
        : null,
  }));
}

/* ================= COMPONENT ================= */
export default function FicheRenseignementBuilder() {
  const router = useRouter();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("Fiche de renseignement");
  const [description, setDescription] = useState("");
  const [enableQuestions, setEnableQuestions] = useState(true);
  const [questions, setQuestions] = useState([createQuestion()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getFicheById(id);
        const fiche = res?.data?.fiche || res?.data;
        setTitle(fiche?.title || "");
        setDescription(fiche?.description || "");
        const qs = ensureIds(fiche?.questions || []);
        setQuestions(qs.length ? qs : [createQuestion()]);
        setEnableQuestions((fiche?.questions || []).length > 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  /* ================= QUESTION CRUD ================= */
  const addQuestion = () => setQuestions((p) => [...p, createQuestion()]);
  const removeQuestion = (qid) =>
    setQuestions((p) => p.filter((q) => q.id !== qid));
  const updateQuestion = (qid, patch) =>
    setQuestions((p) =>
      p.map((q) => (q.id === qid ? { ...q, ...patch } : q))
    );

  function onTypeChange(qid, type) {
    updateQuestion(qid, {
      type,
      options: type === "radio" || type === "checkbox" ? [createOption()] : [],
      items: type === "scale_group" ? [createItem()] : [],
      scale: type === "scale_group" ? { ...defaultScale } : null,
    });
  }

  /* ================= OPTIONS ================= */
  const addOption = (qid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, options: [...q.options, createOption()] }
          : q
      )
    );

  const updateOption = (qid, oid, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
            ...q,
            options: q.options.map((o) =>
              o.id === oid ? { ...o, ...patch } : o
            ),
          }
          : q
      )
    );

  const removeOption = (qid, oid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.filter((o) => o.id !== oid) }
          : q
      )
    );

  /* ================= SCALE ITEMS ================= */
  const addItem = (qid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid ? { ...q, items: [...q.items, createItem()] } : q
      )
    );

  const updateItem = (qid, iid, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
            ...q,
            items: q.items.map((it) =>
              it.id === iid ? { ...it, ...patch } : it
            ),
          }
          : q
      )
    );

  const removeItem = (qid, iid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, items: q.items.filter((it) => it.id !== iid) }
          : q
      )
    );

  /* ================= SUBMIT ================= */
  async function submit() {
    if (saving) return;
    
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: enableQuestions ? questions : [],
      };

      let response;
      if (isEdit) {
        response = await updateFiche(id, payload);
      } else {
        response = await createFiche(payload);
      }

      // Vérifier si la réponse est valide
      if (response && (response.status === 200 || response.status === 201)) {
        // Redirection réussie
        window.location.href = "/recruiter/fiche-renseignement";
      } else {
        throw new Error("Réponse invalide du serveur");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      
      // Vérifier si c'est vraiment une erreur ou juste un problème de navigation
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        alert(`Erreur: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        // La requête a été faite mais pas de réponse
        alert("Erreur de connexion au serveur");
      } else {
        // Autre erreur
        alert("Une erreur est survenue");
      }
      
      setSaving(false);
    }
  }

  if (loading) return <p className="p-10 text-gray-200">Chargement...</p>;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-green-50 bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">

        {/* ===== HEADER (RESPONSIVE) ===== */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-4xl font-extrabold text-gray-900">
              {isEdit ? "Modifier la fiche" : "Créer une fiche de renseignement"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 text-gray-400 mt-1">
              Définissez le titre, la description, puis ajoutez vos questions.
            </p>
          </div>
          <button
            onClick={() => router.push("/recruiter/fiche-renseignement")}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border-2 border-green-500 text-green-600 text-green-400 border-green-400 bg-white  hover:bg-green-50 :hover:bg-gray-700 hover:border-green-600 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* ===== INFORMATIONS GÉNÉRALES (RESPONSIVE) ===== */}
        <div className="bg-white  rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow border border-green-100 :border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800 :text-gray-100">
                Informations générales
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-600 :text-gray-400">
                Activer les questions
              </span>
              <input
                type="checkbox"
                checked={enableQuestions}
                onChange={(e) => setEnableQuestions(e.target.checked)}
                className="toggle toggle-success"
              />
            </div>
          </div>


          <div className="mb-4 sm:mb-5">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 :text-gray-300 mb-2">
              Titre de la fiche
            </label>
            <input
              className="w-full rounded-full border border-green-200 :border-gray-600 :bg-gray-700 :text-white px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 :text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl sm:rounded-3xl border border-green-200 :border-gray-600 :bg-gray-700 :text-white px-4 sm:px-5 py-3 sm:py-4 resize-none text-sm sm:text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* ===== QUESTIONS (RESPONSIVE) ===== */}
        {enableQuestions &&
          questions.map((q, i) => (
            <div
              key={q.id}
              className="bg-white  rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow space-y-3 sm:space-y-4 border border-green-100 "
            >
              {/* Header avec QUESTION et Supprimer */}
              <div className="flex justify-between items-center">
                <span className="text-green-600 :text-green-400 font-semibold text-sm sm:text-base">
                  QUESTION {i + 1}
                </span>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-red-500 hover:text-red-700 :text-red-400 :hover:text-red-300 transition-colors"
                  aria-label="Supprimer la question"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Champ de question */}
              <input
                className="w-full border border-green-200 :border-gray-600 :bg-gray-700 :text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base"
                placeholder="Libellé de la question"
                value={q.label}
                onChange={(e) =>
                  updateQuestion(q.id, { label: e.target.value })
                }
              />

              {/* Type de réponse + Obligatoire + Minuteur (RESPONSIVE STACK) */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm mb-1 font-medium text-gray-700 :text-gray-300">
                    Type de réponse
                  </label>
                  <select
                    value={q.type}
                    onChange={(e) => onTypeChange(q.id, e.target.value)}
                    className="border rounded-xl px-3 py-2 border-green-200 :border-gray-600 :bg-gray-700 :text-white text-sm sm:text-base"
                  >
                    <option value="text">Texte</option>
                    <option value="textarea">Paragraphe</option>
                    <option value="radio">Choix unique</option>
                    <option value="checkbox">Choix multiple</option>
                    <option value="scale_group">Code de niveau</option>
                  </select>
                </div>

                <div className="flex items-center sm:items-end gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 sm:pb-2">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        updateQuestion(q.id, { required: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-xs sm:text-sm whitespace-nowrap :text-gray-300">
                      Obligatoire
                    </span>
                  </label>

                  <div className="flex-1 sm:flex-none">
                    <label className="flex items-center gap-1 text-xs sm:text-sm mb-1 :text-gray-300">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 :text-gray-400" />
                      <span>secondes</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full sm:w-32 border rounded-xl px-3 py-2 border-green-200 :border-gray-600 :bg-gray-700 :text-white text-sm sm:text-base"
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          timeLimit: Number(e.target.value || 0),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Options pour radio/checkbox */}
              {(q.type === "radio" || q.type === "checkbox") && (
                <div className="space-y-2 sm:space-y-3">
                  {q.options.map((o) => (
                    <div key={o.id} className="space-y-2">
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <input
                          className="flex-1 border rounded-xl px-3 py-2 border-green-200 :border-gray-600 :bg-gray-700 :text-white text-sm sm:text-base"
                          placeholder="Option"
                          value={o.label}
                          onChange={(e) =>
                            updateOption(q.id, o.id, { label: e.target.value })
                          }
                        />
                        <button
                          onClick={() => removeOption(q.id, o.id)}
                          className="text-red-500 hover:text-red-700 :text-red-400 :hover:text-red-300 transition-colors p-1"
                          aria-label="Supprimer l'option"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Checkbox pour activer le champ texte "Autre" */}
                      <div className="ml-3 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`hasText-${o.id}`}
                          checked={o.hasText || false}
                          onChange={(e) =>
                            updateOption(q.id, o.id, { hasText: e.target.checked })
                          }
                          className="w-4 h-4 text-green-600 :bg-gray-700 :border-gray-600"
                        />
                        <label 
                          htmlFor={`hasText-${o.id}`}
                          className="text-xs sm:text-sm text-gray-600 :text-gray-400 cursor-pointer"
                        >
                          Ajouter un champ texte "Autre" pour cette option
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="text-green-600 :text-green-400 text-xs sm:text-sm hover:text-green-700 :hover:text-green-300 transition-colors"
                  >
                    + Ajouter une option
                  </button>
                </div>
              )}

              {/* Items pour scale_group */}
              {q.type === "scale_group" && (
                <div className="space-y-2 sm:space-y-3">
                  {q.items.map((it) => (
                    <div key={it.id} className="flex gap-2 sm:gap-3 items-center">
                      <input
                        className="flex-1 border rounded-xl px-3 py-2 border-green-200 :border-gray-600 :bg-gray-700 :text-white text-sm sm:text-base"
                        placeholder="Ligne"
                        value={it.label}
                        onChange={(e) =>
                          updateItem(q.id, it.id, { label: e.target.value })
                        }
                      />
                      <button
                        onClick={() => removeItem(q.id, it.id)}
                        className="text-red-500 hover:text-red-700 :text-red-400 :hover:text-red-300 transition-colors"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(q.id)}
                    className="text-green-600 :text-green-400 text-xs sm:text-sm hover:text-green-700 :hover:text-green-300 transition-colors"
                  >
                    + Ajouter une ligne
                  </button>
                </div>
              )}
            </div>
          ))}

        {/* AJOUTER QUESTION (RESPONSIVE) */}
        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-300 :border-gray-600 bg-white  py-3 sm:py-4 rounded-xl text-gray-600 :text-gray-400 font-medium hover:border-green-400 hover:text-green-600 :hover:border-green-400 :hover:text-green-400 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Ajouter une question
        </button>

        {/* ACTIONS (RESPONSIVE) */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => router.push("/recruiter/fiche-renseignement")}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white  text-gray-700 :text-gray-300 border-2 border-gray-300 :border-gray-600 rounded-xl font-semibold hover:bg-gray-50 :hover:bg-gray-700 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {saving ? "Enregistrement..." : "Enregistrer la fiche"}
          </button>
        </div>
      </div>
    </div>
  );
}