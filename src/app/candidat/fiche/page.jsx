"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFicheById } from "../../services/fiche.api.js";
import {
  startSubmission,
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
    options: Array.isArray(q.options) ? q.options : [],
    items: Array.isArray(q.items) ? q.items : [],
    scale: q.scale || { min: 0, max: 4, labels: { 0: "Néant", 1: "Débutant", 2: "Intermédiaire", 3: "Avancé", 4: "Expert" } },
  }));
}

export default function CandidatFicheWizardPage() {
  const router = useRouter();
  const params = useSearchParams();

  const ficheId = params.get("ficheId");
  const candidatureId = params.get("candidatureId");

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  const [fiche, setFiche] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [submissionId, setSubmissionId] = useState(null);

  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // valeur courante (réponse)
  const [value, setValue] = useState(null);

  const question = questions[idx];

  // anti double-next
  const nextLockRef = useRef(false);

  const total = questions.length;
  const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  /* =======================
     LOAD fiche + start submission
  ======================= */
  useEffect(() => {
    async function boot() {
      try {
        setLoading(true);
        setError("");

        if (!ficheId || !candidatureId) {
          setError("Lien invalide : ficheId ou candidatureId manquant.");
          setLoading(false);
          return;
        }

        // 1) charger la fiche
        const resF = await getFicheById(ficheId);
        const ficheData = resF?.data?.fiche || resF?.data;
        if (!ficheData) {
          setError("Fiche introuvable.");
          setLoading(false);
          return;
        }

        const qs = ensureQuestionIds(ficheData.questions || []);
        setFiche(ficheData);
        setQuestions(qs);

        // 2) start submission (refuse si déjà soumis)
        const resS = await startSubmission({ ficheId, candidatureId });
        const sid = resS?.data?.submissionId;
        const status = resS?.data?.status;

        if (!sid) {
          setError("Impossible de démarrer la soumission.");
          setLoading(false);
          return;
        }

        if (status === "SUBMITTED") {
          setBlocked(true);
          setLoading(false);
          return;
        }

        setSubmissionId(String(sid));

        // init question 0
        const q0 = qs[0];
        setIdx(0);
        setValue(defaultValueFor(q0));
        setTimeLeft(Number(q0?.timeLimit || 0));

        setLoading(false);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Erreur";
        if (msg.includes("Déjà soumis")) setBlocked(true);
        else setError(msg);
        setLoading(false);
      }
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficheId, candidatureId]);

  /* =======================
     TIMER (auto-next)
  ======================= */
  useEffect(() => {
    if (!question) return;
    if (!question.timeLimit || Number(question.timeLimit) <= 0) return;

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

  /* =======================
     On change question
  ======================= */
  useEffect(() => {
    if (!question) return;
    setValue(defaultValueFor(question));
    setTimeLeft(Number(question.timeLimit || 0));
    nextLockRef.current = false;
  }, [question?.id]);

  const canNext = useMemo(() => {
    if (!question) return false;
    if (!question.required) return true;

    // required rules
    if (question.type === "text" || question.type === "textarea") {
      return safeStr(value).trim().length > 0;
    }
    if (question.type === "radio") {
      return !!safeStr(value);
    }
    if (question.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }
    if (question.type === "scale_group") {
      // require: chaque item doit avoir label + value
      const items = question.items || [];
      if (items.length === 0) return false;
      // côté candidat: il répond par valeurs => value doit être object { itemId: lvl }
      if (!value || typeof value !== "object") return false;
      return items.every((it) => safeStr(value[it.id]).length > 0);
    }

    return true;
  }, [question, value]);

  function defaultValueFor(q) {
    if (!q) return null;

    if (q.type === "text" || q.type === "textarea") return "";
    if (q.type === "radio") return "";
    if (q.type === "checkbox") return [];
    if (q.type === "scale_group") {
      // value = { itemId: niveau }
      const obj = {};
      (q.items || []).forEach((it) => {
        obj[it.id] = String(q.scale?.min ?? 0);
      });
      return obj;
    }
    return "";
  }

  async function persistAnswer({ auto = false } = {}) {
    if (!submissionId || !question) return;

    const spent = Number(question.timeLimit || 0) > 0
      ? Math.max(0, Number(question.timeLimit || 0) - Number(timeLeft || 0))
      : 0;

    await addAnswer(submissionId, {
      questionId: question.id,
      value,
      timeSpent: spent,
      auto, // optionnel
    });
  }

  async function handleNext(auto = false) {
    if (!question) return;
    if (!submissionId) return;
    if (nextLockRef.current) return;

    nextLockRef.current = true;

    try {
      // si required et user clique vite
      if (!auto && !canNext) {
        nextLockRef.current = false;
        return;
      }

      await persistAnswer({ auto });

      const isLast = idx >= questions.length - 1;
      if (!isLast) {
        setIdx((x) => x + 1);
        return;
      }

      // submit final
      await submitSubmission(submissionId);
      router.replace("/candidat/fiche/merci");
    } catch (e) {
      console.error("SAVE ERROR", e);
      setError(e?.response?.data?.message || e?.message || "Erreur de sauvegarde");
      nextLockRef.current = false;
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Chargement...</p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p className="text-gray-700">
          Cette fiche a déjà été soumise. Une seule tentative est autorisée.
        </p>
      </div>
    );
  }

  if (error && !fiche) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Erreur</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!fiche || !question) {
    return (
      <div className="p-8">
        <p>Aucune question à afficher.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{fiche.title}</h1>
              {fiche.description ? (
                <p className="text-gray-600 mt-1">{fiche.description}</p>
              ) : null}
            </div>

            {Number(question.timeLimit || 0) > 0 && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Temps restant</div>
                <div className="text-xl font-bold">
                  {timeLeft}s
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {idx + 1} / {total}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{question.label}</h2>
              {question.required && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                  Obligatoire
                </span>
              )}
            </div>

            <div className="mt-4">
              <QuestionRenderer
                q={question}
                value={value}
                setValue={setValue}
              />
            </div>

            {error ? (
              <p className="text-red-600 text-sm mt-3">{error}</p>
            ) : null}

            {/* Actions: seulement "Suivant" */}
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => handleNext(false)}
                disabled={!canNext}
                className={`px-6 py-3 rounded-xl font-semibold shadow-sm ${
                  canNext
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {idx === total - 1 ? "Envoyer" : "Suivant"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              ⚠️ Pas de retour possible. Vos réponses précédentes ne peuvent pas être modifiées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   RENDERERS
======================= */

function QuestionRenderer({ q, value, setValue }) {
  if (q.type === "text") {
    return (
      <input
        className="w-full border rounded-xl px-4 py-3"
        placeholder="Votre réponse..."
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }

  if (q.type === "textarea") {
    return (
      <textarea
        className="w-full border rounded-xl px-4 py-3 min-h-[120px]"
        placeholder="Votre réponse..."
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }

  if (q.type === "radio") {
    return (
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <label key={`${q.id}-r-${i}`} className="flex items-center gap-3">
            <input
              type="radio"
              name={q.id}
              checked={value === opt.label}
              onChange={() => setValue(opt.label)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (q.type === "checkbox") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const checked = arr.includes(opt.label);
          return (
            <label key={`${q.id}-c-${i}`} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  if (checked) setValue(arr.filter((x) => x !== opt.label));
                  else setValue([...arr, opt.label]);
                }}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (q.type === "scale_group") {
    const scale = q.scale || { min: 0, max: 4, labels: {} };
    const items = q.items || [];
    const obj = value && typeof value === "object" ? value : {};

    return (
      <div className="border rounded-2xl p-4 bg-gray-50">
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-[200px] font-medium">{it.label}</div>
              <select
                className="border rounded-xl px-3 py-2 bg-white"
                value={obj[it.id] ?? String(scale.min ?? 0)}
                onChange={(e) => {
                  setValue({ ...obj, [it.id]: e.target.value });
                }}
              >
                {Array.from(
                  { length: (scale.max - scale.min + 1) },
                  (_, k) => scale.min + k
                ).map((lvl) => (
                  <option key={lvl} value={String(lvl)}>
                    {lvl} – {scale.labels?.[lvl] ?? ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-600 mt-4">
          Code : {Object.entries(scale.labels || {})
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([k, v]) => `${k} ${v}`)
            .join(" — ")}
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      Type non supporté : {q.type}
    </div>
  );
}
