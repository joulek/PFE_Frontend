"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { getFicheById } from "../../services/fiche.api.js";
import {
  getSubmissionById,
  addAnswer,
  submitSubmission,
} from "../../services/ficheSubmission.api.js";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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

function getFieldLabel(optOrItem) {
  const label = safeStr(optOrItem?.otherLabel).trim();
  return label || "Précisez...";
}

function ensureQuestionIds(questions = []) {
  return questions.map((q) => ({
    ...q,
    id: q.id || uid(),
    options: Array.isArray(q.options)
      ? q.options.map((opt) => ({
          ...opt,
          id: opt.id || uid(),
          hasText: Boolean(opt.hasText),
          otherLabel: safeStr(opt.otherLabel || ""),
          otherType: "text",
        }))
      : [],
    items: Array.isArray(q.items)
      ? q.items.map((it) => ({
          ...it,
          id: it.id || uid(),
          hasText: Boolean(it.hasText),
          otherLabel: safeStr(it.otherLabel || ""),
          otherType: "text",
        }))
      : [],
    scale: q.scale || {
      min: 0,
      max: 4,
      labels: { 0: "Néant", 1: "Débutant", 2: "Intermédiaire", 3: "Avancé", 4: "Expert" },
    },
  }));
}

function defaultValueFor(q) {
  if (!q) return null;
  if (q.type === "text" || q.type === "textarea" || q.type === "number8") return "";
  if (q.type === "radio") return { selected: "", textValue: "" };
  if (q.type === "checkbox") return { selected: [], textValues: {} };
  if (q.type === "ranking") return { items: (q.options || []).map((opt) => opt.label), textValues: {} };
  if (q.type === "scale_group") {
    const scales = {};
    const textValues = {};
    (q.items || []).forEach((it) => {
      scales[it.id] = String(q.scale?.min ?? 0);
      textValues[it.id] = "";
    });
    return { scales, textValues };
  }
  return "";
}

/* =======================
   ACCESS DENIED UI
======================= */
function AccessDeniedLikeQuiz({ title, subtitle, hint, onHome }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#F0FAF0] text-gray-900 dark:bg-[#060B14] dark:text-white transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:hidden" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:hidden" />
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl hidden dark:block" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl hidden dark:block" />
      </div>
      <div className="relative w-full max-w-2xl">
        <div className="rounded-[36px] border border-emerald-200 bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur px-6 sm:px-10 py-10 dark:border-emerald-500/30 dark:bg-[#0B1220]/80 dark:shadow-[0_20px_80px_rgba(0,0,0,0.6)] transition-colors duration-300">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-emerald-500/15 grid place-items-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500 grid place-items-center shadow-[0_0_0_10px_rgba(16,185,129,0.18)]">
                <div className="h-6 w-6 rounded-full border-2 border-white grid place-items-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <span className="px-5 py-2 rounded-full text-xs font-extrabold tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-600/25 dark:text-emerald-300 dark:border-emerald-500/30">
              ACCÈS REFUSÉ
            </span>
          </div>
          <h1 className="mt-6 text-center text-3xl sm:text-4xl font-extrabold">{title}</h1>
          <p className="mt-4 text-center text-base sm:text-lg text-gray-600 dark:text-slate-300">{subtitle}</p>
          <div className="mt-8 h-px w-full bg-gray-200 dark:bg-white/10" />
          <div className="mt-8 flex justify-center">
            <button onClick={onHome} className="h-12 px-10 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-[0_14px_35px_rgba(16,185,129,0.25)] dark:bg-emerald-500 dark:hover:bg-emerald-400 transition-colors">
              Retour à l&apos;accueil
            </button>
          </div>
          {hint && <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN COMPONENT
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

  const canNext = useMemo(() => {
    if (!question) return false;
    if (!question.required) return true;
    if (question.type === "text" || question.type === "textarea" || question.type === "number8")
      return safeStr(value).trim().length > 0;
    if (question.type === "radio") return !!value?.selected;
    if (question.type === "checkbox")
      return Array.isArray(value?.selected) && value.selected.length > 0;
    if (question.type === "ranking")
      return value?.items?.length === question.options.length;
    if (question.type === "scale_group")
      return question.items.every((it) => safeStr(value?.scales?.[it.id]).length > 0);
    return true;
  }, [question, value]);

  /* ── Chargement ── */
  useEffect(() => {
    async function boot() {
      try {
        setLoading(true);
        setError("");

        if (!submissionId) {
          setError("Lien invalide.");
          return;
        }

        // ✅ ÉTAPE 1 — Charger la submission + vérification expiration
        // fetch natif pour contrôler précisément le status HTTP (axios peut ne pas lever sur 403)
        const rawSub = await fetch(`${API_BASE}/fiche-submissions/${submissionId}`);
        const subData = await rawSub.json().catch(() => ({}));

        if (!rawSub.ok) {
          if (rawSub.status === 403 && subData?.expired) {
            setError("expir — Ce lien a expiré. Veuillez contacter le recruteur.");
          } else if (rawSub.status === 404) {
            setError("Lien invalide ou introuvable.");
          } else {
            setError(subData?.message || "Accès refusé.");
          }
          return;
        }

        const submission = subData?.submission;
        if (!submission) {
          setError("Soumission introuvable.");
          return;
        }

        // ✅ ÉTAPE 2 — ACCÈS UNIQUE (exactement comme /quizzes/:id/access)
        const accessRes = await fetch(
          `${API_BASE}/fiches/${submission.ficheId}/access`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidatureId: submission.candidatureId }),
          }
        );

        if (!accessRes.ok) {
          const accessData = await accessRes.json().catch(() => ({}));
          if (accessRes.status === 403 && accessData?.expired) {
            // Expiration détectée à l'étape 2 (fiche_controller)
            setError("expir — " + (accessData.message || "Ce lien a expiré."));
          } else if (accessRes.status === 403) {
            setError("⛔ Accès refusé. Vous avez déjà accédé à cette fiche. Un seul accès est autorisé.");
          } else {
            setError(accessData.message || "Lien invalide.");
          }
          return;
        }

        // ✅ ÉTAPE 3 — Vérifier si déjà soumis
        if (submission.status === "SUBMITTED") {
          setBlocked(true);
          return;
        }

        // ✅ ÉTAPE 4 — Charger la fiche
        const resF = await getFicheById(submission.ficheId);
        const ficheData = resF?.data?.fiche || resF?.data;
        if (!ficheData) {
          setError("Fiche introuvable.");
          return;
        }

        const qs = ensureQuestionIds(ficheData.questions || []);
        setFiche(ficheData);
        setQuestions(qs);
        if (qs.length > 0) {
          setIdx(0);
          setValue(defaultValueFor(qs[0]));
          setTimeLeft(Number(qs[0]?.timeLimit || 0));
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de la fiche.");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [submissionId]);

  useEffect(() => {
    if (!question) return;
    setValue(defaultValueFor(question));
    setTimeLeft(Number(question.timeLimit || 0));
    nextLockRef.current = false;
    setError("");
  }, [question?.id]);

  useEffect(() => {
    if (!question || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); handleNext(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, question?.id]);

  async function persistAnswer({ auto = false } = {}) {
    if (!question) return;
    const limit = Number(question.timeLimit || 0);
    const spent = limit > 0 ? Math.max(0, limit - timeLeft) : 0;
    let finalValue = value;

    if (question.type === "radio" && value?.selected) {
      const opt = question.options.find((o) => o.label === value.selected);
      if (opt?.hasText && value.textValue)
        finalValue = `${value.selected} — ${getFieldLabel(opt)} : ${value.textValue.trim()}`;
      else finalValue = value.selected;
    } else if (question.type === "checkbox" && Array.isArray(value?.selected)) {
      finalValue = value.selected.map((label) => {
        const opt = question.options.find((o) => o.label === label);
        if (opt?.hasText && value.textValues?.[label])
          return `${label} — ${getFieldLabel(opt)} : ${value.textValues[label].trim()}`;
        return label;
      });
    } else if (question.type === "ranking" && value?.items) {
      finalValue = value.items.map((item) => {
        const opt = question.options.find((o) => o.label === item);
        if (opt?.hasText && value.textValues?.[item])
          return `${item} — ${getFieldLabel(opt)} : ${value.textValues[item].trim()}`;
        return item;
      });
    } else if (question.type === "scale_group" && value?.scales) {
      finalValue = {};
      for (const it of question.items) {
        const level = value.scales[it.id];
        if (it.hasText && value.textValues?.[it.id])
          finalValue[it.label] = `${level} — ${getFieldLabel(it)} : ${value.textValues[it.id].trim()}`;
        else finalValue[it.label] = level;
      }
    }

    try {
      await addAnswer(submissionId, { questionId: question.id, value: finalValue, timeSpent: spent, auto });
    } catch (err) {
      console.error("Erreur sauvegarde réponse:", err);
      setError("Erreur lors de l'enregistrement de la réponse.");
    }
  }

  async function handleNext(auto = false) {
    if (nextLockRef.current) return;
    nextLockRef.current = true;
    try {
      if (!auto && !canNext) return;
      await persistAnswer({ auto });
      const isLast = idx >= questions.length - 1;
      if (!isLast) {
        setIdx((prev) => prev + 1);
      } else if (!auto) {
        await submitSubmission(submissionId);
        router.replace("/candidat/fiche/merci");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors du passage à la question suivante.");
    } finally {
      nextLockRef.current = false;
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center text-gray-600 dark:text-gray-400">
        Chargement...
      </div>
    );

  if (blocked)
    return (
      <AccessDeniedLikeQuiz
        title="Cette fiche a déjà été soumise"
        subtitle="Vous avez déjà complété et soumis cette fiche. Il n'est pas possible de répondre une deuxième fois."
        hint="Si vous pensez qu'il s'agit d'une erreur, contactez le recruteur."
        onHome={() => router.replace("/jobs")}
      />
    );

 if (error && !fiche) {
  const isExpired = error.toLowerCase().includes("expir");

  return (
    <AccessDeniedLikeQuiz
      title={isExpired ? "Lien expiré" : "Accès refusé"}
      subtitle={
        isExpired
          ? "Ce lien n'est plus valide. La durée de validité (48 heures) est dépassée."
          : error
      }
      hint={
        isExpired
          ? "Veuillez contacter le recruteur pour recevoir un nouveau lien."
          : "Chaque fiche est accessible une seule fois."
      }
      onHome={() => router.replace("/jobs")}
    />
  );
}

  if (total === 0)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Aucune question</h1>
          <p className="text-gray-600 dark:text-gray-400">Cette fiche ne contient aucune question.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow border border-green-100 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-300">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {fiche?.title || "Fiche de renseignement"}
          </h1>
          {fiche?.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{fiche.description}</p>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span>Question <strong className="text-gray-900 dark:text-white">{idx + 1}</strong> / {total}</span>
              <div className="flex items-center gap-4">
                <span className="font-medium">{progress}%</span>
                {Number(question?.timeLimit || 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                    <span>⏱</span><span>{Math.max(0, timeLeft)}s</span>
                  </div>
                )}
              </div>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-600 dark:bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {question.label}
              {question.required && <span className="text-red-500 dark:text-red-400 ml-1.5">*</span>}
            </h2>
            <div className="mt-5">
              <QuestionRenderer q={question} value={value} setValue={setValue} />
            </div>
            {error && <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => handleNext(false)}
                disabled={!canNext}
                className={`px-7 py-3 rounded-xl font-semibold text-base transition-colors ${
                  canNext
                    ? "bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                {idx === total - 1 ? "Envoyer mes réponses" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   QuestionRenderer
======================= */
function QuestionRenderer({ q, value, setValue }) {
  if (q.type === "text") {
    return (
      <input
        className="w-full rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors"
        value={value ?? ""} onChange={(e) => setValue(e.target.value)} placeholder="Votre réponse..."
      />
    );
  }

  if (q.type === "number8") {
    return (
      <input type="text" inputMode="numeric" maxLength="8"
        className="w-full rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors font-mono"
        value={value ?? ""} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))} placeholder="00000000"
      />
    );
  }

  if (q.type === "textarea") {
    return (
      <textarea rows={5}
        className="w-full rounded-2xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 resize-y min-h-[120px] focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors"
        value={value ?? ""} onChange={(e) => setValue(e.target.value)} placeholder="Développez votre réponse ici..."
      />
    );
  }

  if (q.type === "radio") {
    return (
      <div className="space-y-3">
        {q.options.map((opt) => {
          const isSelected = value?.selected === opt.label;
          const fieldLabel = getFieldLabel(opt);
          return (
            <div key={opt.id} className="space-y-2">
              <label className="flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-green-200 dark:hover:border-gray-600 cursor-pointer transition-colors">
                <input type="radio" checked={isSelected} onChange={() => setValue({ selected: opt.label, textValue: "" })} className="w-5 h-5 text-green-600 dark:text-emerald-500 focus:ring-green-500 dark:focus:ring-emerald-500" />
                <span className="text-gray-700 dark:text-gray-200">{opt.label}</span>
              </label>
              {opt.hasText && isSelected && (
                <div className="ml-10 p-3 bg-green-50 dark:bg-gray-700/50 border border-green-200 dark:border-emerald-800 rounded-xl flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-green-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1"><span>↳</span><span>{fieldLabel}</span></label>
                  <input type="text" placeholder={fieldLabel} className="w-full sm:max-w-xs rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors" value={value?.textValue || ""} onChange={(e) => setValue({ ...value, textValue: e.target.value })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "checkbox") {
    const selected = Array.isArray(value?.selected) ? value.selected : [];
    const textValues = value?.textValues || {};
    return (
      <div className="space-y-3">
        {q.options.map((opt) => {
          const isChecked = selected.includes(opt.label);
          const fieldLabel = getFieldLabel(opt);
          return (
            <div key={opt.id} className="space-y-2">
              <label className="flex items-center gap-3 py-3 px-4 rounded-xl border border-transparent hover:border-green-200 dark:hover:border-gray-600 cursor-pointer transition-colors">
                <input type="checkbox" checked={isChecked}
                  onChange={() => {
                    const newSelected = isChecked ? selected.filter((x) => x !== opt.label) : [...selected, opt.label];
                    const newTextValues = { ...textValues };
                    if (isChecked) delete newTextValues[opt.label];
                    setValue({ selected: newSelected, textValues: newTextValues });
                  }}
                  className="w-5 h-5 text-green-600 dark:text-emerald-500 rounded focus:ring-green-500 dark:focus:ring-emerald-500"
                />
                <span className="text-gray-700 dark:text-gray-200">{opt.label}</span>
              </label>
              {opt.hasText && isChecked && (
                <div className="ml-10 p-3 bg-green-50 dark:bg-gray-700/50 border border-green-200 dark:border-emerald-800 rounded-xl flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-green-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1"><span>↳</span><span>{fieldLabel}</span></label>
                  <input type="text" placeholder={fieldLabel} className="w-full sm:max-w-xs rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors" value={textValues[opt.label] || ""} onChange={(e) => setValue({ ...value, textValues: { ...textValues, [opt.label]: e.target.value } })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "ranking") {
    return (
      <RankingRenderer
        q={q} items={value?.items || []} textValues={value?.textValues || {}}
        setItems={(items) => setValue({ ...value, items })}
        setTextValues={(textValues) => setValue({ ...value, textValues })}
      />
    );
  }

  if (q.type === "scale_group") {
    const scales = value?.scales || {};
    const textValues = value?.textValues || {};
    const min = q.scale?.min ?? 0;
    const max = q.scale?.max ?? 4;
    const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="space-y-4">
        {q.items.map((it) => {
          const fieldLabel = getFieldLabel(it);
          return (
            <div key={it.id} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="font-medium text-gray-800 dark:text-gray-100 text-base">{it.label}</div>
                <div>
                  <select className="w-full sm:max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-400/30 outline-none transition-all cursor-pointer shadow-sm"
                    value={scales[it.id] ?? ""} onChange={(e) => setValue({ ...value, scales: { ...scales, [it.id]: e.target.value } })}>
                    <option value="" disabled>— Choisir un niveau —</option>
                    {levels.map((lvl) => (
                      <option key={lvl} value={String(lvl)}>{lvl} – {q.scale?.labels?.[lvl] ?? `Niveau ${lvl}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              {it.hasText && (
                <div className="ml-4 p-3 bg-green-50 dark:bg-gray-700/50 border border-green-200 dark:border-emerald-800 rounded-xl flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-green-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1"><span>↳</span><span>{fieldLabel}</span></label>
                  <input type="text" placeholder={fieldLabel} className="w-full sm:max-w-xs rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors" value={textValues[it.id] || ""} onChange={(e) => setValue({ ...value, textValues: { ...textValues, [it.id]: e.target.value } })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

/* =======================
   RankingRenderer
======================= */
function RankingRenderer({ q, items, textValues, setItems, setTextValues }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDrop = (index) => {
    if (draggedIndex === null || draggedIndex === index) { setDraggedIndex(null); return; }
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
        <span className="text-lg mt-0.5">💡</span>
        <span>Glissez les éléments pour les réordonner, ou utilisez les flèches ↑↓</span>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const opt = q.options.find((o) => o.label === item);
          const fieldLabel = opt ? getFieldLabel(opt) : "Précisez...";
          const isTextVisible = opt?.hasText;
          return (
            <div key={index} className="space-y-2">
              <div draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(index)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${draggedIndex === index ? "border-green-400 dark:border-green-500 bg-green-100 dark:bg-green-900/30 opacity-60" : "border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-300 dark:hover:border-green-700 cursor-grab active:cursor-grabbing"}`}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-bold text-sm shrink-0">{index + 1}</div>
                <span className="text-gray-400 dark:text-gray-600 text-xl select-none cursor-grab active:cursor-grabbing">⋮⋮</span>
                <span className="flex-1 text-gray-800 dark:text-gray-100 font-medium">{item}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">↑</button>
                  <button onClick={() => handleMoveDown(index)} disabled={index === items.length - 1} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">↓</button>
                </div>
              </div>
              {isTextVisible && (
                <div className="ml-10 p-3 bg-green-50 dark:bg-gray-700/50 border border-green-200 dark:border-emerald-800 rounded-xl flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-green-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1"><span>↳</span><span>{fieldLabel}</span></label>
                  <input type="text" placeholder={fieldLabel} className="w-full sm:max-w-xs rounded-xl border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 outline-none transition-colors" value={textValues[item] || ""} onChange={(e) => setTextValues({ ...textValues, [item]: e.target.value })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}