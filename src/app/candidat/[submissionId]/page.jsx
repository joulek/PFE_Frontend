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
    options: Array.isArray(q.options) ? q.options : [],
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
        // eslint-disable-next-line react-hooks/immutability
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
     TIMER
  ======================= */
useEffect(() => {
  if (!question) return;

  const limit = Number(question.timeLimit || 0);
  if (limit <= 0) return;

  // ⛔ ما نبدأوش timer كان timeLeft == 0 (initialisation)
  if (timeLeft === 0) return;

  if (timeLeft <= 0) {
    handleNext(true);
    return;
  }

  const t = setInterval(() => {
    setTimeLeft((x) => x - 1);
  }, 1000);

  return () => clearInterval(t);
}, [timeLeft, question?.id]);


  useEffect(() => {
    if (!question) return;
    setValue(defaultValueFor(question));
    setTimeLeft(Number(question.timeLimit || 0));
    nextLockRef.current = false;
  }, [question?.id]);

  const canNext = useMemo(() => {
    if (!question) return false;
    if (!question.required) return true;

    if (question.type === "text" || question.type === "textarea") {
      return safeStr(value).trim().length > 0;
    }
    if (question.type === "radio") return !!safeStr(value);
    if (question.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }
    if (question.type === "scale_group") {
      const items = question.items || [];
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
      const obj = {};
      (q.items || []).forEach(
        (it) => (obj[it.id] = String(q.scale?.min ?? 0))
      );
      return obj;
    }
    return "";
  }

  async function persistAnswer({ auto = false } = {}) {
    if (!question) return;

    const spent =
      Number(question.timeLimit || 0) > 0
        ? Math.max(
            0,
            Number(question.timeLimit || 0) - Number(timeLeft || 0)
          )
        : 0;

    await addAnswer(submissionId, {
      questionId: question.id,
      value,
      timeSpent: spent,
      auto,
    });
  }

async function handleNext(auto = false) {
  if (!question || nextLockRef.current) return;

  try {
    nextLockRef.current = true;

    // ❌ منع المرور اليدوي إذا ما جاوبش
    if (!auto && !canNext) {
      return;
    }

    // 1️⃣ نحفظ الجواب
    await persistAnswer({ auto });

    const isLast = idx >= questions.length - 1;

    // 2️⃣ كان موش آخر سؤال → نمشي للي بعده
    if (!isLast) {
      setIdx((x) => x + 1);
      return;
    }

    // 3️⃣ آخر سؤال
    // ❗ submit يصير كان بالضغط (auto === false)
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
    return <div className="p-8">Chargement...</div>;
  }

  if (blocked) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p>Cette fiche a déjà été soumise.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Erreur</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h1 className="text-2xl font-bold">{fiche.title}</h1>
          {fiche.description && (
            <p className="text-gray-600 mt-1">{fiche.description}</p>
          )}

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Question {idx + 1} / {total}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mt-2">
              <div
                className="h-full bg-green-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold">{question.label}</h2>
            <div className="mt-4">
              <QuestionRenderer
                q={question}
                value={value}
                setValue={setValue}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-3">{error}</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleNext(false)}
                disabled={!canNext}
                className={`px-6 py-3 rounded-xl font-semibold ${
                  canNext
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
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
        className="w-full border rounded-xl px-4 py-3"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );

  if (q.type === "textarea")
    return (
      <textarea
        className="w-full border rounded-xl px-4 py-3 min-h-[120px]"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    );

  if (q.type === "radio")
    return q.options.map((opt) => (
      <label key={opt.label} className="flex gap-3">
        <input
          type="radio"
          checked={value === opt.label}
          onChange={() => setValue(opt.label)}
        />
        {opt.label}
      </label>
    ));

  if (q.type === "checkbox") {
    const arr = Array.isArray(value) ? value : [];
    return q.options.map((opt) => (
      <label key={opt.label} className="flex gap-3">
        <input
          type="checkbox"
          checked={arr.includes(opt.label)}
          onChange={() =>
            setValue(
              arr.includes(opt.label)
                ? arr.filter((x) => x !== opt.label)
                : [...arr, opt.label]
            )
          }
        />
        {opt.label}
      </label>
    ));
  }

  if (q.type === "scale_group") {
    const obj = value || {};
    return q.items.map((it) => (
      <div key={it.id} className="flex gap-3 items-center">
        <span className="min-w-[200px]">{it.label}</span>
        <select
          value={obj[it.id]}
          onChange={(e) =>
            setValue({ ...obj, [it.id]: e.target.value })
          }
        >
          {Array.from(
            { length: q.scale.max - q.scale.min + 1 },
            (_, i) => q.scale.min + i
          ).map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl} – {q.scale.labels[lvl]}
            </option>
          ))}
        </select>
      </div>
    ));
  }

  return null;
}
