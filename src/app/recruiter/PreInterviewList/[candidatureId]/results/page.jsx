"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../services/api";
import {
  Brain,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Clock3,
  Mail,
  Phone,
  FileQuestion,
} from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeStr(v) {
  return v ? String(v).trim() : "";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const s = safeStr(value);
    if (s) return s;
  }
  return "";
}

function getCandidateName(candidature) {
  return (
    firstNonEmpty(
      candidature?.fullName,
      `${safeStr(candidature?.prenom)} ${safeStr(candidature?.nom)}`.trim(),
      `${safeStr(candidature?.personalInfoForm?.prenom)} ${safeStr(
        candidature?.personalInfoForm?.nom
      )}`.trim(),
      candidature?.extracted?.parsed?.full_name,
      candidature?.extracted?.parsed?.nom,
      `${safeStr(candidature?.extracted?.parsed?.prenom)} ${safeStr(
        candidature?.extracted?.parsed?.nom
      )}`.trim(),
      `${safeStr(candidature?.extracted?.parsed?.first_name)} ${safeStr(
        candidature?.extracted?.parsed?.last_name
      )}`.trim(),
      `${safeStr(candidature?.extracted?.personal_info?.first_name)} ${safeStr(
        candidature?.extracted?.personal_info?.last_name
      )}`.trim(),
      candidature?.email
    ) || "Candidat"
  );
}

function getCandidateEmail(candidature) {
  return (
    firstNonEmpty(
      candidature?.email,
      candidature?.personalInfoForm?.email,
      candidature?.extracted?.parsed?.email,
      candidature?.extracted?.parsed?.personal_info?.email,
      candidature?.extracted?.personal_info?.email,
      candidature?.extracted?.extracted?.personal_info?.email
    ) || "Email non renseigné"
  );
}

function getCandidatePhone(candidature) {
  return (
    firstNonEmpty(
      candidature?.telephone,
      candidature?.phone,
      candidature?.personalInfoForm?.telephone,
      candidature?.personalInfoForm?.phone,
      candidature?.extracted?.parsed?.telephone,
      candidature?.extracted?.parsed?.phone,
      candidature?.extracted?.personal_info?.telephone,
      candidature?.extracted?.personal_info?.phone,
      candidature?.extracted?.extracted?.personal_info?.telephone,
      candidature?.extracted?.extracted?.personal_info?.phone
    ) || "Téléphone non renseigné"
  );
}

function getCandidateJobTitle(candidature) {
  return (
    firstNonEmpty(
      candidature?.jobTitle,
      candidature?.offreTitle,
      candidature?.poste,
      candidature?.job?.titre,
      candidature?.job?.title,
      candidature?.offre?.titre,
      candidature?.offre?.title
    ) || "Poste non renseigné"
  );
}

function ScoreCircle({ percentage }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "#4E8F2F"
      : percentage >= 65
      ? "#69B332"
      : percentage >= 50
      ? "#9CCB73"
      : "#C96A3D";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          className="dark:stroke-slate-700"
          strokeWidth="12"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-xs font-medium mt-1" style={{ color }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

function PdfDownloadButton({ submissionId, compact = false }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fiche-submissions/${submissionId}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche_candidature.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 text-white font-medium shadow-md disabled:opacity-60 transition-all dark:bg-green-700 dark:hover:bg-green-600 ${
        compact
          ? "px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-sm"
          : "px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Télécharger le PDF
    </button>
  );
}

function getQuestionOptions(question) {
  return Array.isArray(question?.options) ? question.options : [];
}

function getOptionLabel(option) {
  if (option === null || option === undefined) return "";
  if (typeof option === "string") return option.trim();
  if (typeof option === "number") return String(option);

  return (
    safeStr(option.label) ||
    safeStr(option.text) ||
    safeStr(option.value) ||
    safeStr(option.name) ||
    safeStr(option.option) ||
    ""
  );
}

function getOptionValue(option) {
  if (option === null || option === undefined) return "";
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  return (
    safeStr(option.value) ||
    safeStr(option.code) ||
    safeStr(option.id) ||
    safeStr(option.key) ||
    getOptionLabel(option)
  );
}

function getScaleLabelMap(question) {
  const labels = question?.scale?.labels;
  if (!labels || typeof labels !== "object") return {};

  const map = {};
  for (const [key, value] of Object.entries(labels)) {
    map[String(key)] = safeStr(value);
  }
  return map;
}

function getLevelLabel(levelValue, question) {
  const raw = safeStr(levelValue);

  const scaleLabelMap = getScaleLabelMap(question);
  if (raw && scaleLabelMap[raw]) {
    return scaleLabelMap[raw];
  }

  const options = getQuestionOptions(question);
  for (const option of options) {
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    if (optionValue && raw === optionValue) return optionLabel;
    if (optionLabel && raw === optionLabel) return optionLabel;
  }

  const defaultMap = {
    "0": "Néant",
    "1": "Débutant",
    "2": "Intermédiaire",
    "3": "Avancé",
    "4": "Expert",
  };

  return defaultMap[raw] || raw || "—";
}

function isLevelQuestion(question) {
  const type = safeStr(question?.type).toLowerCase();
  return (
    type.includes("niveau") ||
    type.includes("level") ||
    type.includes("code_a_niveau") ||
    type.includes("code-a-niveau") ||
    type.includes("codeaniveau") ||
    type.includes("scale_group")
  );
}

function isOrderQuestion(question) {
  const type = safeStr(question?.type).toLowerCase();
  return (
    type.includes("ordre") ||
    type.includes("ranking") ||
    type.includes("order") ||
    type.includes("priority")
  );
}

function normalizeOrderValue(value) {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return item
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        }
        if (item && typeof item === "object") {
          return Object.entries(item).map(([k, v]) =>
            v === null || v === undefined || v === ""
              ? `${k}`
              : `${k} : ${v}`
          );
        }
        return [String(item)];
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([k, v]) =>
      v === null || v === undefined || v === "" ? `${k}` : `${k} : ${v}`
    );
  }

  return [String(value)];
}

function normalizeFicheValue(value, question) {
  if (value === null || value === undefined) {
    return { mode: "text", value: "—" };
  }

  if (isOrderQuestion(question)) {
    return {
      mode: "list",
      value: normalizeOrderValue(value),
    };
  }

  if (isLevelQuestion(question)) {
    if (typeof value === "object" && !Array.isArray(value)) {
      const mapped = Object.entries(value).map(([k, v]) => ({
        label: k,
        value: getLevelLabel(v, question),
      }));
      return { mode: "kv-list", value: mapped };
    }

    if (Array.isArray(value)) {
      const mapped = value.map((item, index) => ({
        label: `Élément ${index + 1}`,
        value: getLevelLabel(item, question),
      }));
      return { mode: "kv-list", value: mapped };
    }

    return {
      mode: "text",
      value: getLevelLabel(value, question),
    };
  }

  if (typeof value === "string") {
    return { mode: "text", value: value.trim() || "—" };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return { mode: "text", value: String(value) };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { mode: "text", value: "—" };

    const hasObjects = value.some(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );

    if (!hasObjects) {
      return { mode: "text", value: value.map((v) => String(v)).join(", ") };
    }

    return {
      mode: "list",
      value: value.map((item) => {
        if (item && typeof item === "object") {
          return Object.entries(item)
            .map(([k, v]) => `${k} : ${v ?? "—"}`)
            .join(" • ");
        }
        return String(item);
      }),
    };
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return { mode: "text", value: "—" };
    return {
      mode: "kv-list",
      value: entries.map(([k, v]) => ({
        label: k,
        value: isLevelQuestion(question) ? getLevelLabel(v, question) : v ?? "—",
      })),
    };
  }

  return { mode: "text", value: String(value) };
}

function AnswerContent({ answer }) {
  if (answer.mode === "list") {
    return (
      <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
        <ol className="space-y-2">
          {answer.value.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"
            >
              <span className="w-6 h-6 rounded-full bg-[#E9F5E3] dark:bg-green-900/40 text-[#4E8F2F] dark:text-green-300 flex items-center justify-center text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <span className="break-words whitespace-pre-wrap">{item}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (answer.mode === "kv-list") {
    return (
      <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
        <div className="space-y-2">
          {answer.value.map((item, index) => (
            <div
              key={index}
              className="flex flex-wrap items-start gap-2 text-sm text-gray-800 dark:text-gray-200"
            >
              <span className="font-semibold text-[#4E8F2F] dark:text-green-300">
                {item.label} :
              </span>
              <span className="break-words whitespace-pre-wrap">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
      <div className="flex items-start gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        <FileQuestion className="w-4 h-4 mt-0.5 text-[#4E8F2F] dark:text-green-400 shrink-0" />
        <span className="break-words whitespace-pre-wrap">{answer.value}</span>
      </div>
    </div>
  );
}

function QuizSection({ quiz, questions = [] }) {
  const resolveAnswer = (val, order) => {
    if (val === null || val === undefined) return "—";

    const str = String(val).trim().toUpperCase();

    if (/^[A-E]$/.test(str)) {
      const idx = str.charCodeAt(0) - 65;
      const question = questions.find((q) => q.order === order);
      if (!question?.options) return str;

      const opt = question.options[idx];
      if (!opt) return str;

      if (typeof opt === "string") return opt.trim();

      if (typeof opt === "object" && opt !== null) {
        return (
          opt.text ||
          opt.label ||
          opt.value ||
          opt.content ||
          opt.option ||
          str
        );
      }

      return str;
    }

    return String(val).trim();
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#dfead6] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dfead6] dark:border-slate-700 bg-[#F4FAF0] dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2.5 text-gray-900 dark:text-white">
            <Brain className="w-5 h-5 text-[#4E8F2F] dark:text-green-400" />
            Résultats du Quiz Technique
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Terminé le {formatDate(quiz.submittedAt)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8">
          <div className="shrink-0">
            <ScoreCircle percentage={quiz.percentage} />
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="text-center p-4 bg-[#EEF7E9] dark:bg-green-900/20 rounded-xl border border-[#d6e8ca] dark:border-green-800/40">
              <p className="text-3xl font-bold text-[#4E8F2F] dark:text-green-300">
                {quiz.score}
              </p>
              <p className="text-sm text-[#4E8F2F] dark:text-green-400 mt-1">
                CORRECTES
              </p>
            </div>

            <div className="text-center p-4 bg-[#FFF7ED] dark:bg-orange-900/20 rounded-xl border border-[#F5D6B3] dark:border-orange-800/40">
              <p className="text-3xl font-bold text-[#C55B00] dark:text-orange-300">
                {quiz.totalQuestions - quiz.score}
              </p>
              <p className="text-sm text-[#C55B00] dark:text-orange-400 mt-1">
                INCORRECTES
              </p>
            </div>

            <div className="text-center p-4 bg-[#F7F8F6] dark:bg-slate-800 rounded-xl border border-[#dfe5d7] dark:border-slate-700">
              <p className="text-3xl font-bold text-[#0b1430] dark:text-gray-200">
                {quiz.totalQuestions}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                TOTAL
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {quiz.answers?.map((a, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border ${
                a.isCorrect
                  ? "bg-[#F4FAF0] dark:bg-green-900/20 border-[#cfe4c4] dark:border-green-800/40"
                  : "bg-[#FFF7ED] dark:bg-orange-900/20 border-[#F5D6B3] dark:border-orange-800/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 ${
                    a.isCorrect ? "bg-[#6CB33F]" : "bg-[#D97706]"
                  }`}
                >
                  {a.order || i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                    {a.question}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-2">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                        a.isCorrect
                          ? "bg-[#DFF0D4] dark:bg-green-800/30 text-[#2F6B1B] dark:text-green-200"
                          : "bg-[#FDE6D0] dark:bg-orange-800/30 text-[#B45309] dark:text-orange-200"
                      }`}
                    >
                      {a.isCorrect ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {resolveAnswer(a.selectedAnswer, a.order)}
                    </div>

                    {!a.isCorrect && a.correctAnswer && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-[#DFF0D4] dark:bg-green-800/30 text-[#2F6B1B] dark:text-green-200">
                        <CheckCircle className="w-4 h-4" />
                        {resolveAnswer(a.correctAnswer, a.order)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!quiz.answers?.length && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6">
              Aucune réponse de quiz disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FicheAnswersSection({ ficheSubmission, ficheDefinition }) {
  if (!ficheSubmission) return null;

  const questionMap = new Map();
  (ficheDefinition?.questions || []).forEach((q, index) => {
    if (q?._id) questionMap.set(String(q._id), { ...q, index });
    if (q?.id) questionMap.set(String(q.id), { ...q, index });
  });

  const answers = (ficheSubmission.answers || []).map((a, index) => {
    const q = questionMap.get(String(a.questionId)) || null;
    return {
      key: `${a.questionId}-${index}`,
      order: q?.index !== undefined ? q.index + 1 : index + 1,
      label: q?.label || `Question ${index + 1}`,
      type: q?.type || "text",
      question: q,
      normalizedAnswer: normalizeFicheValue(a.value, q),
      timeSpent: a.timeSpent,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-800 border border-[#dfead6] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-[#dfead6] dark:border-slate-700 bg-[#F4FAF0] dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-[#4E8F2F] dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Réponses de la Fiche de Renseignements
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Terminée le{" "}
              {formatDate(
                ficheSubmission.finishedAt ||
                  ficheSubmission.updatedAt ||
                  ficheSubmission.createdAt
              )}
            </span>
            <PdfDownloadButton submissionId={ficheSubmission._id} compact />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-5">
          {answers.map((a) => (
            <div
              key={a.key}
              className="p-5 rounded-xl border bg-[#F4FAF0] dark:bg-green-900/10 border-[#cfe4c4] dark:border-green-900/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 bg-[#6CB33F]">
                  {a.order}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                    {a.label}
                  </p>

                  <AnswerContent answer={a.normalizedAnswer} />

                  {typeof a.timeSpent === "number" && a.timeSpent > 0 && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Temps passé : {a.timeSpent}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!answers.length && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6">
              Aucune réponse de fiche disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyContent({ icon: Icon, title, text, iconClass = "" }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#dfead6] dark:border-slate-700 p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-[#EEF7E9] dark:bg-slate-700 mx-auto flex items-center justify-center mb-4">
        <Icon className={`w-8 h-8 ${iconClass}`} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

export default function CandidateResultsPage() {
  const params = useParams();
  const candidatureId = params?.candidatureId;

  const [quiz, setQuiz] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [ficheDefinition, setFicheDefinition] = useState(null);
  const [candidature, setCandidature] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [activeView, setActiveView] = useState("quiz");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidatureId) return;

    async function fetchAll() {
      setLoading(true);
      try {
        const [cRes, qRes, fRes] = await Promise.all([
          api.get(`/candidatures/${candidatureId}`),
          api.get(`/quiz-submissions/candidature/${candidatureId}`),
          api.get(`/fiche-submissions/candidature/${candidatureId}`),
        ]);

        setCandidature(cRes.data);

        const quizzes = Array.isArray(qRes.data)
          ? qRes.data
          : Array.isArray(qRes.data?.submissions)
          ? qRes.data.submissions
          : [];
        const latestQuiz = quizzes[0] || null;
        setQuiz(latestQuiz);

        if (latestQuiz?.quizId) {
          const qqRes = await api.get(`/quizzes/${latestQuiz.quizId}`);
          setQuizQuestions(qqRes.data?.questions || []);
        } else {
          setQuizQuestions([]);
        }

        const fiches = Array.isArray(fRes.data)
          ? fRes.data
          : Array.isArray(fRes.data?.submissions)
          ? fRes.data.submissions
          : [];
        const latestFiche = fiches[0] || null;
        setFiche(latestFiche);

        if (latestFiche?.ficheId) {
          try {
            const ficheRes = await api.get(`/fiches/${latestFiche.ficheId}`);
            setFicheDefinition(ficheRes.data || null);
          } catch (err) {
            console.error("Erreur chargement fiche definition :", err);
            setFicheDefinition(null);
          }
        } else {
          setFicheDefinition(null);
        }

        if (latestQuiz) {
          setActiveView("quiz");
        } else if (latestFiche) {
          setActiveView("fiche");
        } else {
          setActiveView("quiz");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [candidatureId]);

  const name = useMemo(() => getCandidateName(candidature), [candidature]);
  const email = useMemo(() => getCandidateEmail(candidature), [candidature]);
  const phone = useMemo(() => getCandidatePhone(candidature), [candidature]);
  const jobTitle = useMemo(() => getCandidateJobTitle(candidature), [candidature]);

  const statusLabel =
    safeStr(candidature?.statusLabel) ||
    safeStr(candidature?.statutLabel) ||
    safeStr(candidature?.status) ||
    "En attente";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLowerCase() || "c";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 dark:text-green-400" />
      </div>
    );
  }

  const showQuiz = activeView === "quiz";
  const showFiche = activeView === "fiche";

  return (
    <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="rounded-[1.75rem] border border-[#dfead6] dark:border-slate-700 bg-[#eef6e8] dark:bg-slate-900 shadow-[0_4px_12px_rgba(115,150,90,0.08)] px-5 sm:px-7 py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#74bf37] dark:bg-green-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0">
                  {initials}
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1430] dark:text-white leading-tight break-words">
                    {name}
                  </h1>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center gap-2 break-all">
                        <Mail className="w-4 h-4 text-[#69b332] dark:text-green-400" />
                        {email}
                      </span>

                      <span className="inline-flex items-center gap-2 break-all">
                        <Phone className="w-4 h-4 text-[#69b332] dark:text-green-400" />
                        {phone}
                      </span>
                    </div>

                    <p className="text-base sm:text-2xl text-[#69b332] dark:text-green-400 leading-snug break-words">
                      {jobTitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex lg:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f4df9f] dark:bg-amber-900/40 text-[#c55b00] dark:text-amber-300 px-4 py-2 text-base font-semibold whitespace-nowrap">
                  <Clock3 className="w-4 h-4" />
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveView("quiz")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
              showQuiz
                ? "bg-[#4E8F2F] border-[#4E8F2F] text-white dark:bg-green-600 dark:border-green-600"
                : "bg-white dark:bg-slate-800 border-[#dfead6] dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-[#F4FAF0] dark:hover:bg-slate-700"
            }`}
          >
            <Brain className="w-4 h-4" />
            Quiz
          </button>

          <button
            type="button"
            onClick={() => setActiveView("fiche")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
              showFiche
                ? "bg-[#6CB33F] border-[#6CB33F] text-white"
                : "bg-white dark:bg-slate-800 border-[#dfead6] dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-[#F4FAF0] dark:hover:bg-slate-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Fiche
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {showQuiz && quiz && <QuizSection quiz={quiz} questions={quizQuestions} />}

          {showQuiz && !quiz && (
            <EmptyContent
              icon={Brain}
              iconClass="text-[#4E8F2F] dark:text-green-400"
              title="Aucun quiz soumis"
              text="Ce candidat n’a pas encore soumis de réponses de quiz."
            />
          )}

          {showFiche && fiche && (
            <FicheAnswersSection
              ficheSubmission={fiche}
              ficheDefinition={ficheDefinition}
            />
          )}

          {showFiche && !fiche && (
            <EmptyContent
              icon={ClipboardList}
              iconClass="text-[#4E8F2F] dark:text-green-400"
              title="Aucune fiche soumise"
              text="Ce candidat n’a pas encore soumis de fiche de renseignements."
            />
          )}
        </div>
      </div>
    </div>
  );
}