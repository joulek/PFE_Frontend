"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  type: "text", // text | textarea | radio | checkbox | scale_group
  required: false,
  timeLimit: 0,
  options: [], // [{id,label,hasText}]
  scale: null, // {min,max,labels}
  items: [], // [{id,label}] pour scale_group
});

const createOption = () => ({ id: uid(), label: "", hasText: false });
const createItem = () => ({
  id: uid(),
  label: "",
  value: 0, // 👈 niveau par défaut
});

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
    scale: q.scale
      ? { ...defaultScale, ...q.scale }
      : q.type === "scale_group"
        ? { ...defaultScale }
        : null,
  }));
}

/* ================= COMPONENT ================= */
export default function FicheRenseignementBuilder() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id; // ✅ seul id

  const isEdit = Boolean(id);

  const [title, setTitle] = useState("Fiche de renseignement");
  const [description, setDescription] = useState("");
  const [enableQuestions, setEnableQuestions] = useState(true);
  const [questions, setQuestions] = useState([createQuestion()]);
  const [loading, setLoading] = useState(isEdit);

  /* ================= LOAD (EDIT) ================= */
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getFicheById(id);
        const fiche = res?.data?.fiche || res?.data; // حسب controller
        setTitle(fiche?.title || "");
        setDescription(fiche?.description || "");
        const qs = ensureIds(fiche?.questions || []);
        setQuestions(qs.length ? qs : [createQuestion()]);
        setEnableQuestions((fiche?.questions || []).length > 0);
      } catch (e) {
        console.error(
          "LOAD FICHE ERROR",
          e?.response?.status,
          e?.response?.data || e,
        );
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
    setQuestions((p) => p.map((q) => (q.id === qid ? { ...q, ...patch } : q)));

  /* ================= TYPE CHANGE (NE PAS CASSER) ================= */
  function onTypeChange(qid, type) {
    updateQuestion(qid, {
      type,
      // حسب النوع: نجهّز structure (ما عادش "wino")
      options: type === "radio" || type === "checkbox" ? [createOption()] : [],
      items: type === "scale_group" ? [createItem()] : [],
      scale: type === "scale_group" ? { ...defaultScale } : null,
    });
  }

  /* ================= OPTIONS CRUD ================= */
  const addOption = (qid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, options: [...(q.options || []), createOption()] }
          : q,
      ),
    );

  const updateOption = (qid, optId, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: (q.options || []).map((o) =>
                o.id === optId ? { ...o, ...patch } : o,
              ),
            }
          : q,
      ),
    );

  const removeOption = (qid, optId) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, options: (q.options || []).filter((o) => o.id !== optId) }
          : q,
      ),
    );

  /* ================= ITEMS CRUD (scale_group) ================= */
  const addItem = (qid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid ? { ...q, items: [...(q.items || []), createItem()] } : q,
      ),
    );

  const updateItem = (qid, itemId, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
              ...q,
              items: (q.items || []).map((it) =>
                it.id === itemId ? { ...it, ...patch } : it,
              ),
            }
          : q,
      ),
    );

  const removeItem = (qid, itemId) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, items: (q.items || []).filter((it) => it.id !== itemId) }
          : q,
      ),
    );

  /* ================= SCALE UPDATE ================= */
  const setScaleMinMax = (qid, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, scale: { ...(q.scale || defaultScale), ...patch } }
          : q,
      ),
    );

  const setScaleLabel = (qid, k, v) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
              ...q,
              scale: {
                ...(q.scale || defaultScale),
                labels: { ...((q.scale || defaultScale).labels || {}), [k]: v },
              },
            }
          : q,
      ),
    );

  /* ================= SUBMIT ================= */
  async function submit() {
    const payload = {
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      questions: enableQuestions ? questions : [],
    };

    try {
      if (isEdit) {
        await updateFiche(id, payload);
      } else {
        await createFiche(payload);
      }
      router.push("/recruiter/fiche-renseignement");
    } catch (err) {
      console.error(
        "SAVE ERROR",
        err?.response?.status,
        err?.response?.data || err,
      );
      // ما نعملوش redirect “غصب” باش ما تغلطش عليك
      alert(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  }

  /* ================= UI ================= */
  if (loading) return <p className="p-10">Chargement...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {isEdit
                ? "Modifier la fiche"
                : "Créer une fiche de renseignement"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Définissez le titre, la description, puis ajoutez vos questions.
            </p>
          </div>
          <button
            onClick={() => router.push("/recruiter/fiche-renseignement")}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
          >
            Retour
          </button>
        </div>

        {/* CARD: META */}
        <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border shadow-sm mb-6">
          <label className="text-sm font-medium text-gray-700">Titre</label>
          <input
            className="w-full mt-2 px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fiche de renseignement"
          />

          <label className="text-sm font-medium text-gray-700 mt-5 block">
            Description
          </label>
          <textarea
            className="w-full mt-2 px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-200"
            placeholder="Objectif, consignes, informations générales..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-5 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={enableQuestions}
                onChange={(e) => setEnableQuestions(e.target.checked)}
              />
              Activer les questions
            </label>

            <button
              onClick={submit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow"
            >
              Enregistrer la fiche
            </button>
          </div>
        </div>

        {/* QUESTIONS */}
        {enableQuestions && (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="bg-white p-6 rounded-2xl border shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Question {index + 1}
                  </span>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <input
                  className="w-full mb-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Libellé de la question"
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(q.id, { label: e.target.value })
                  }
                />

                <div className="flex flex-wrap gap-4 items-center text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Type</span>
                    <select
                      value={q.type}
                      className="border rounded-xl px-3 py-2 bg-white"
                      onChange={(e) => onTypeChange(q.id, e.target.value)}
                    >
                      <option value="text">Texte (ligne)</option>
                      <option value="textarea">Paragraphe</option>
                      <option value="radio">Choix unique</option>
                      <option value="checkbox">Choix multiple</option>
                      <option value="scale_group">Code de niveau</option>
                    </select>
                  </div>

                  <label className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        updateQuestion(q.id, { required: e.target.checked })
                      }
                    />
                    Obligatoire
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">Minuteur</span>
                    <input
                      type="number"
                      min={0}
                      className="w-24 border rounded-xl px-3 py-2"
                      value={Number(q.timeLimit || 0)}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          timeLimit: Number(e.target.value || 0),
                        })
                      }
                    />
                    <span className="text-gray-500">sec</span>
                  </div>
                </div>

                {/* RADIO / CHECKBOX OPTIONS */}
                {(q.type === "radio" || q.type === "checkbox") && (
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Options
                    </div>

                    <div className="space-y-2">
                      {(q.options || []).map((opt) => (
                        <div
                          key={opt.id}
                          className="flex flex-wrap items-center gap-3"
                        >
                          <input
                            className="flex-1 min-w-[240px] border rounded-xl px-3 py-2"
                            placeholder="Libellé (ex: LinkedIn)"
                            value={opt.label}
                            onChange={(e) =>
                              updateOption(q.id, opt.id, {
                                label: e.target.value,
                              })
                            }
                          />

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(opt.hasText)}
                              onChange={(e) =>
                                updateOption(q.id, opt.id, {
                                  hasText: e.target.checked,
                                })
                              }
                            />
                            Ajouter champ texte (Autre)
                          </label>

                          <button
                            onClick={() => removeOption(q.id, opt.id)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addOption(q.id)}
                      className="mt-3 text-green-700 font-medium hover:underline"
                    >
                      + Ajouter une option
                    </button>

                    <p className="mt-2 text-xs text-gray-500">
                      Astuce : coche “Ajouter champ texte” pour une option
                      “Autre (à préciser)”.
                    </p>
                  </div>
                )}

                {/* SCALE GROUP */}
                {q.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 mt-3"
                  >
                    {/* Nom langue / outil */}
                    <input
                      className="flex-1 border rounded-xl px-3 py-2"
                      placeholder="Ex: Français / Anglais / Excel..."
                      value={item.label}
                      onChange={(e) =>
                        updateItem(q.id, item.id, { label: e.target.value })
                      }
                    />

                    {/* Niveau */}
                    <select
                      className="border rounded-xl px-3 py-2 bg-white"
                      value={item.value}
                      onChange={(e) =>
                        updateItem(q.id, item.id, {
                          value: Number(e.target.value),
                        })
                      }
                    >
                      {Array.from(
                        { length: q.scale.max - q.scale.min + 1 },
                        (_, i) => q.scale.min + i,
                      ).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl} – {q.scale.labels[lvl]}
                        </option>
                      ))}
                    </select>

                    {/* Supprimer ligne */}
                    <button
                      onClick={() => removeItem(q.id, item.id)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Supprimer
                    </button>
                    <button
  onClick={() => addItem(q.id)}
  className="mt-3 text-green-600 text-sm hover:underline"
>
  + Ajouter une ligne
</button>

                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button
                onClick={addQuestion}
                className="text-green-700 font-semibold hover:underline"
              >
                + Ajouter une question
              </button>

              <button
                onClick={submit}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl shadow"
              >
                Enregistrer la fiche
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
