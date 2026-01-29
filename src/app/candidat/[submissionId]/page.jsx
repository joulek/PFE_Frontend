"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { getFicheById } from "../../services/fiche.api.js";
import {
  getSubmissionById,
  addAnswer,
  submitSubmission,
} from "../../services/ficheSubmission.api.js";

/* =======================
   HELPERS
======================= */
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function ensureQuestionIds(questions = []) {
  return questions.map((q) => ({
    ...q,
    id: q.id || uid(),
    options: Array.isArray(q.options) 
      ? q.options.map(opt => ({
          ...opt,
          id: opt.id || uid(),
          hasText: opt.hasText || false
        }))
      : [],
    items: Array.isArray(q.items) ? q.items : [],
    scale:
      q.scale || {
        min: 0,
        max: 4,
        labels: {
          0: "Néant",
          1: "Débutant",
          2: "Intermédiaire",
          3: "Avancé",
          4: "Expert",
        },
      },
  }));
}

function defaultValueFor(q) {
  if (!q) return null;
  if (q.type === "text" || q.type === "textarea") return "";
  if (q.type === "radio") return { selected: "", textValue: "" };
  if (q.type === "checkbox") return { selected: [], textValues: {} };
  if (q.type === "scale_group") {
    const obj = {};
    (q.items || []).forEach((it) => (obj[it.id] = String(q.scale?.min ?? 0)));
    return obj;
  }
  return "";
}

/* =======================
   PAGE
======================= */
export default function CandidatFicheWizardPage() {
  const router = useRouter();
  const { submissionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  const [fiche, setFiche] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const nextLockRef = useRef(false);

  const question = questions[idx];
  const total = questions.length;
  const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  /* =======================
     BOOT
  ======================= */
  useEffect(() => {
    async function boot() {
      try {
        setLoading(true);
        setError("");

        if (!submissionId) {
          setError("Lien invalide.");
          setLoading(false);
          return;
        }

        // 1️⃣ Charger la submission
        const resSub = await getSubmissionById(submissionId);
        const submission = resSub?.data?.submission;

        if (!submission) {
          setError("Soumission introuvable.");
          setLoading(false);
          return;
        }

        if (submission.status === "SUBMITTED") {
          setBlocked(true);
          setLoading(false);
          return;
        }

        // 2️⃣ Charger la fiche
        const resF = await getFicheById(submission.ficheId);
        const ficheData = resF?.data?.fiche || resF?.data;

        if (!ficheData) {
          setError("Fiche introuvable.");
          setLoading(false);
          return;
        }

        const qs = ensureQuestionIds(ficheData.questions || []);

        setFiche(ficheData);
        setQuestions(qs);

        // init
        setIdx(0);
        setValue(defaultValueFor(qs[0]));
        setTimeLeft(Number(qs[0]?.timeLimit || 0));

        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Erreur de chargement.");
        setLoading(false);
      }
    }

    boot();
  }, [submissionId]);

  /* =======================
     WHEN QUESTION CHANGES
  ======================= */
  useEffect(() => {
    if (!question) return;
    setValue(defaultValueFor(question));
    setTimeLeft(Number(question.timeLimit || 0));
    nextLockRef.current = false;
    setError("");
  }, [question?.id]);

  /* =======================
     CAN NEXT?
  ======================= */
  const canNext = useMemo(() => {
    if (!question) return false;
    if (!question.required) return true;

    if (question.type === "text" || question.type === "textarea") {
      return safeStr(value).trim().length > 0;
    }
    
    if (question.type === "radio") {
      if (!value || !value.selected) return false;
      // Si l'option sélectionnée a hasText, vérifier que textValue est rempli
      const selectedOption = question.options.find(opt => opt.label === value.selected);
      if (selectedOption?.hasText) {
        return safeStr(value.textValue).trim().length > 0;
      }
      return true;
    }
    
    if (question.type === "checkbox") {
      if (!Array.isArray(value?.selected) || value.selected.length === 0) return false;
      // Vérifier que tous les champs texte requis sont remplis
      for (const selectedLabel of value.selected) {
        const option = question.options.find(opt => opt.label === selectedLabel);
        if (option?.hasText) {
          const textVal = value.textValues?.[selectedLabel];
          if (!safeStr(textVal).trim()) return false;
        }
      }
      return true;
    }
    
    if (question.type === "scale_group") {
      const items = question.items || [];
      if (!value || typeof value !== "object") return false;
      return items.every((it) => safeStr(value[it.id]).length > 0);
    }
    return true;
  }, [question, value]);

  /* =======================
     TIMER (✅ FIXED)
  ======================= */
  useEffect(() => {
    if (!question) return;

    const limit = Number(question.timeLimit || 0);
    if (limit <= 0) return;

    // auto-next when reaches 0
    if (timeLeft <= 0) {
      handleNext(true);
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((x) => x - 1);
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, question?.id]);

  async function persistAnswer({ auto = false } = {}) {
    if (!question) return;

    const limit = Number(question.timeLimit || 0);
    const spent = limit > 0 ? Math.max(0, limit - Number(timeLeft || 0)) : 0;

    // Préparer la valeur finale selon le type
    let finalValue = value;
    
    if (question.type === "radio" && value?.selected) {
      // Si c'est un radio avec texte, combiner la sélection et le texte
      const selectedOption = question.options.find(opt => opt.label === value.selected);
      if (selectedOption?.hasText && value.textValue) {
        finalValue = `${value.selected}: ${value.textValue}`;
      } else {
        finalValue = value.selected;
      }
    }
    
    if (question.type === "checkbox" && Array.isArray(value?.selected)) {
      // Pour checkbox, combiner les sélections avec leurs textes
      finalValue = value.selected.map(label => {
        const option = question.options.find(opt => opt.label === label);
        if (option?.hasText && value.textValues?.[label]) {
          return `${label}: ${value.textValues[label]}`;
        }
        return label;
      });
    }

    await addAnswer(submissionId, {
      questionId: question.id,
      value: finalValue,
      timeSpent: spent,
      auto,
    });
  }

  /* =======================
     NEXT (✅ FIXED)
  ======================= */
  async function handleNext(auto = false) {
    if (!question || nextLockRef.current) return;

    try {
      nextLockRef.current = true;

      // منع المرور اليدوي إذا ما جاوبش
      if (!auto && !canNext) return;

      // 1️⃣ نحفظ الجواب
      await persistAnswer({ auto });

      const isLast = idx >= questions.length - 1;

      // 2️⃣ كان موش آخر سؤال → نمشي للي بعده
      if (!isLast) {
        setIdx((x) => x + 1);
        return;
      }

      // 3️⃣ آخر سؤال: submit يصير كان بالضغط اليدوي
      if (!auto) {
        await submitSubmission(submissionId);
        router.replace("/candidat/fiche/merci");
      }
    } catch (e) {
      console.error(e);
      setError("Erreur de sauvegarde.");
    } finally {
      nextLockRef.current = false;
    }
  }

  /* =======================
     STATES
  ======================= */
  if (loading) {
    return <div className="p-8 :text-gray-200">Chargement...</div>;
  }

  if (blocked) {
    return (
      <div className="p-8 max-w-xl :text-gray-200">
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p>Cette fiche a déjà été soumise.</p>
      </div>
    );
  }

  if (error && !fiche) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2 :text-gray-200">Erreur</h1>
        <p className="text-red-600 :text-red-400">{error}</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2 :text-gray-200">Aucune question</h1>
        <p className=":text-gray-400">Cette fiche ne contient pas de questions.</p>
      </div>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="min-h-screen bg-[#F3FBF6] bg-green-50 ">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white bg-gray-800 rounded-2xl shadow-sm border border-green-500 p-6">
          <h1 className="text-2xl font-bold text-gray-900">{fiche?.title}</h1>
          {fiche?.description && (
            <p className="text-gray-600 :text-gray-400 mt-1">{fiche.description}</p>
          )}

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 :text-gray-400">
              <span>
                Question {idx + 1} / {total}
              </span>
              <span className="flex items-center gap-3">
                <span>{progress}%</span>
                {/* timer display (optional) */}
                {Number(question?.timeLimit || 0) > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-gray-100 :bg-gray-700 text-gray-700 :text-gray-300">
                    ⏱ {Math.max(0, timeLeft)}s
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-gray-100 bg-green-50 rounded-full mt-2">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold :text-white">{question.label}</h2>

            <div className="mt-4">
              <QuestionRenderer q={question} value={value} setValue={setValue} />
            </div>

            {error && (
              <p className="text-red-600 :text-red-400 text-sm mt-3">{error}</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleNext(false)}
                disabled={!canNext}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  canNext
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 :bg-gray-700 text-gray-500 :text-gray-500 cursor-not-allowed"
                }`}
              >
                {idx === total - 1 ? "Envoyer" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   QUESTION RENDERER
======================= */
function QuestionRenderer({ q, value, setValue }) {
  if (q.type === "text")
    return (
      <input
        className="w-full border :border-gray-600 rounded-xl px-4 py-3 :bg-gray-700 :text-white"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );

  if (q.type === "textarea")
    return (
      <textarea
        className="w-full border border-green-500 rounded-xl px-4 py-3 min-h-[120px] bg-gray-700 text-white"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );

  if (q.type === "radio") {
    return (
      <div className="space-y-3">
        {(q.options || []).map((opt) => (
          <div key={opt.id || opt.label} className="space-y-2">
            <label className="flex gap-3 items-center py-2 px-3 rounded-lg hover:bg-gray-50 :hover:bg-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={value?.selected === opt.label}
                onChange={() => setValue({ selected: opt.label, textValue: "" })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-gray-200">{opt.label}</span>
            </label>
            
            {/* Champ texte "Autre" si hasText est true et option sélectionnée */}
            {opt.hasText && value?.selected === opt.label && (
              <div className="ml-7 mt-2">
                <input
                  type="text"
                  placeholder="Veuillez préciser..."
                  className="w-full border border-green-500 rounded-lg px-4 py-2 text-sm bg-gray-700 text-white"
                  value={value?.textValue || ""}
                  onChange={(e) => setValue({ ...value, textValue: e.target.value })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "checkbox") {
    const selected = Array.isArray(value?.selected) ? value.selected : [];
    const textValues = value?.textValues || {};
    
    return (
      <div className="space-y-3">
        {(q.options || []).map((opt) => {
          const isChecked = selected.includes(opt.label);
          
          return (
            <div key={opt.id || opt.label} className="space-y-2">
              <label className="flex gap-3 items-center py-2 px-3 rounded-lg hover:bg-gray-50 :hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const newSelected = isChecked
                      ? selected.filter((x) => x !== opt.label)
                      : [...selected, opt.label];
                    
                    // Si on décoche une option avec texte, supprimer son textValue
                    const newTextValues = { ...textValues };
                    if (!isChecked && opt.hasText) {
                      delete newTextValues[opt.label];
                    }
                    
                    setValue({ selected: newSelected, textValues: newTextValues });
                  }}
                  className="w-4 h-4 text-green-600"
                />
                <span className=":text-gray-200">{opt.label}</span>
              </label>
              
              {/* Champ texte "Autre" si hasText est true et option cochée */}
              {opt.hasText && isChecked && (
                <div className="ml-7 mt-2">
                  <input
                    type="text"
                    placeholder="Veuillez préciser..."
                    className="w-full border :border-gray-600 rounded-lg px-4 py-2 text-sm :bg-gray-700 :text-white"
                    value={textValues[opt.label] || ""}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        textValues: { ...textValues, [opt.label]: e.target.value }
                      })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "scale_group") {
    const obj = value || {};
    return (
      <div className="space-y-3">
        {(q.items || []).map((it) => (
          <div key={it.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center py-2">
            <span className="min-w-[200px] text-gray-200">{it.label}</span>
            <select
              className="border border-gray-600 rounded-xl px-3 py-2:bg-gray-700 text-white w-full sm:w-auto"
              value={obj[it.id]}
              onChange={(e) => setValue({ ...obj, [it.id]: e.target.value })}
            >
              {Array.from(
                { length: (q.scale?.max ?? 4) - (q.scale?.min ?? 0) + 1 },
                (_, i) => (q.scale?.min ?? 0) + i
              ).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} – {q.scale?.labels?.[lvl] ?? ""}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  return null;
}