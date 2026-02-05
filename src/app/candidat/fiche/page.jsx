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
    scale: q.scale || {
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

export default function CandidatFicheWizardClient() {
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

  const [value, setValue] = useState(null);
  const question = questions[idx];

  const nextLockRef = useRef(false);

  const total = questions.length;
  const progress =
    total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

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

        const q0 = qs[0];
        setIdx(0);
        setValue(defaultValueFor(q0));
        setTimeLeft(Number(q0?.timeLimit || 0));

        setLoading(false);
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Erreur";
        if (msg.includes("Déjà soumis")) setBlocked(true);
        else setError(msg);
        setLoading(false);
      }
    }

    boot();
  }, [ficheId, candidatureId]);

  /* =======================
     TIMER
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
      (q.items || []).forEach((it) => {
        obj[it.id] = String(q.scale?.min ?? 0);
      });
      return obj;
    }
    return "";
  }

  async function persistAnswer({ auto = false } = {}) {
    if (!submissionId || !question) return;

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
    if (!question || !submissionId) return;
    if (nextLockRef.current) return;

    nextLockRef.current = true;

    try {
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

      await submitSubmission(submissionId);
      router.replace("/candidat/fiche/merci");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Erreur de sauvegarde"
      );
      nextLockRef.current = false;
    }
  }

  /* =======================
     RENDER
  ======================= */
  if (loading) return <div className="p-8">Chargement...</div>;

  if (blocked)
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p>Cette fiche a déjà été soumise.</p>
      </div>
    );

  if (error && !fiche)
    return (
      <div className="p-8 max-w-2xl text-red-600">{error}</div>
    );

  if (!fiche || !question)
    return <div className="p-8">Aucune question.</div>;

  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      {/* 👉 ton JSX UI EXACTEMENT comme avant */}
    </div>
  );
}
