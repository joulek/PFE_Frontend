"use client";

import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/Pagination";

import { getCandidaturesAnalysis } from "../../services/candidature.api";

import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Target,
  BadgeCheck,
  FileText,
  ShieldAlert,
  TrendingUp,
  Mail,
  Check,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function pct(score01) {
  if (typeof score01 !== "number") return "—";
  return `${Math.round(score01 * 100)}%`;
}

function clamp01(n) {
  if (typeof n !== "number") return null;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getCvUrl(c) {
  const fileUrl = safeStr(c?.cv?.fileUrl);
  if (!fileUrl) return null;

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}

/* ✅ أهم دالة: تجيب الاسم الصحيح من أي مكان موجود */
function getName(c) {
  const fullName = safeStr(c?.fullName);
  if (fullName) return fullName;

  const first = safeStr(c?.prenom);
  const last = safeStr(c?.nom);
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;

  const manualNom = safeStr(c?.extracted?.manual?.nom);
  if (manualNom) return manualNom;

  const manualFullName = safeStr(c?.extracted?.manual?.fullName);
  if (manualFullName) return manualFullName;

  const parsedNom = safeStr(c?.extracted?.parsed?.nom);
  if (parsedNom) return parsedNom;

  const parsedFullName = safeStr(c?.extracted?.parsed?.fullName);
  if (parsedFullName) return parsedFullName;

  const email =
    safeStr(c?.email) ||
    safeStr(c?.extracted?.manual?.email) ||
    safeStr(c?.extracted?.parsed?.email);

  if (email) return email;

  return "Candidat";
}

function Tag({ children, variant = "gray" }) {
  const styles =
    variant === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : variant === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : variant === "yellow"
      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${styles}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value01 }) {
  const v = clamp01(value01);
  const p = v === null ? 0 : Math.round(v * 100);

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-green-500" style={{ width: `${p}%` }} />
    </div>
  );
}

function scorePill(score01) {
  const s = clamp01(score01);
  if (s === null) return "bg-gray-100 text-gray-700";
  if (s >= 0.75) return "bg-green-100 text-green-700";
  if (s >= 0.45) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

function recColor(rec) {
  const r = safeStr(rec).toLowerCase();
  if (r === "strong_hire") return "green";
  if (r === "hire") return "green";
  if (r === "consider") return "yellow";
  if (r === "reject") return "red";
  return "gray";
}

function recLabel(rec) {
  const r = safeStr(rec).toLowerCase();
  if (!r) return "—";
  if (r === "strong_hire") return "Strong Hire";
  if (r === "hire") return "Hire";
  if (r === "consider") return "Consider";
  if (r === "reject") return "Reject";
  return rec;
}

/* ================= NORMALIZE JOB MATCH (NEW SCHEMA) ================= */
function normalizeJobMatch(jobMatch) {
  const root = jobMatch || {};
  const status = root?.status;

  const payload =
    root?.score && typeof root.score === "object" ? root.score : root;

  const detailedScores = payload?.detailedScores || {};
  const skillsAnalysis = payload?.skillsAnalysis || {};
  const experienceAnalysis = payload?.experienceAnalysis || {};
  const riskMitigation = payload?.riskMitigation || {};
  const nextSteps = payload?.nextSteps || {};
  const projectImpact = payload?.projectImpact || {};
  const competitiveAnalysis = payload?.competitiveAnalysis || {};
  const compensationFit = payload?.compensationFit || {};

  return {
    status: status || payload?.status,
    score: typeof payload?.score === "number" ? payload.score : null,

    recommendation: payload?.recommendation,
    seniorityFit: payload?.seniorityFit,
    confidenceLevel: payload?.confidenceLevel,

    techFitScore: detailedScores?.skillsFitScore,
    experienceFitScore: detailedScores?.experienceFitScore,
    projectFitScore: detailedScores?.projectFitScore,
    educationScore: detailedScores?.educationScore,
    communicationScore: detailedScores?.communicationScore,

    matchedSkills: Array.isArray(skillsAnalysis?.matchedSkills)
      ? skillsAnalysis.matchedSkills
      : [],
    missingMustHaveSkills: Array.isArray(skillsAnalysis?.missingMustHaveSkills)
      ? skillsAnalysis.missingMustHaveSkills
      : [],
    missingNiceToHaveSkills: Array.isArray(skillsAnalysis?.missingNiceToHaveSkills)
      ? skillsAnalysis.missingNiceToHaveSkills
      : [],
    transferableSkills: Array.isArray(skillsAnalysis?.transferableSkills)
      ? skillsAnalysis.transferableSkills
      : [],

    yearsOfRelevantExperience: experienceAnalysis?.yearsOfRelevantExperience,

    riskLevel: riskMitigation?.riskLevel,
    probabilityOfSuccess: riskMitigation?.probabilityOfSuccess,
    mitigationStrategies: Array.isArray(riskMitigation?.mitigationStrategies)
      ? riskMitigation.mitigationStrategies
      : [],

    immediateAction: nextSteps?.immediateAction,
    talentPoolStatus: nextSteps?.talentPoolStatus,

    marketPositioning: compensationFit?.marketPositioning,

    strengths: Array.isArray(payload?.strengths) ? payload.strengths : [],
    weaknesses: Array.isArray(payload?.weaknesses) ? payload.weaknesses : [],
    summary: payload?.summary,
  };
}

/* ================= CARD ================= */
function CandidatureCard({ c }) {
  const analysis = c?.analysis || {};
  const ai = analysis?.aiDetection || {};
  const match = normalizeJobMatch(analysis?.jobMatch);

  const name = getName(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";

  const cvUrl = getCvUrl(c);
  const cvName = getCvName(c);

  const score = match?.score;

  const expYears =
    typeof match?.yearsOfRelevantExperience === "number"
      ? `${match.yearsOfRelevantExperience} Years`
      : match?.seniorityFit
      ? match.seniorityFit === "senior"
        ? "5+ Years"
        : match.seniorityFit === "mid"
        ? "2-5 Years"
        : match.seniorityFit === "junior"
        ? "0-2 Years"
        : "—"
      : "—";

  const skillCloud = useMemo(() => {
    const arr = [
      ...(match?.matchedSkills || []),
      ...(match?.missingMustHaveSkills || []),
      ...(match?.missingNiceToHaveSkills || []),
      ...(match?.transferableSkills || []),
    ]
      .map((x) => safeStr(x))
      .filter(Boolean);

    const uniq = [];
    const seen = new Set();
    for (const x of arr) {
      const k = x.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push(x);
      }
    }
    return uniq.slice(0, 16);
  }, [c]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6">
        {/* TOP HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
              {name?.[0]?.toUpperCase() || "C"}
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{name}</h2>

              <p className="text-sm text-gray-500 mt-1">
                {jobTitle} • <span className="font-medium">{expYears}</span>
              </p>

              <div className="flex items-center gap-2 mt-2">
                {cvUrl ? (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    <FileText className="w-4 h-4" />
                    Voir CV
                    <span className="text-gray-400 text-xs">({cvName})</span>
                  </a>
                ) : (
                  <span className="text-xs text-red-500 font-medium">
                    CV Missing
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {match?.confidenceLevel && (
                  <Tag variant="green">Confidence: {match.confidenceLevel}</Tag>
                )}
                {match?.riskLevel && (
                  <Tag variant={match.riskLevel === "low" ? "green" : "red"}>
                    Risk: {match.riskLevel}
                  </Tag>
                )}
                {match?.probabilityOfSuccess && (
                  <Tag variant="yellow">
                    Success: {match.probabilityOfSuccess}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center gap-3">
            {/* Contact */}
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 text-gray-900 text-sm font-semibold hover:bg-gray-200 transition">
              <Mail className="w-4 h-4" />
              Contact
            </button>

            {/* Shortlist */}
            <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition shadow-sm">
              <Check className="w-4 h-4" />
              Shortlist
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* MATCH SCORE */}
          <div className="rounded-2xl border border-gray-100 p-4 bg-white">
            <p className="text-xs font-semibold text-gray-500">MATCH SCORE</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-3xl font-extrabold text-green-600">
                {typeof score === "number" ? pct(score) : "—"}
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${scorePill(score)}`}
              >
                {match?.recommendation ? recLabel(match.recommendation) : "—"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Market: {match?.marketPositioning || "—"}
            </p>
          </div>

          {/* EXPERIENCE */}
          <div className="rounded-2xl border border-gray-100 p-4 bg-white">
            <p className="text-xs font-semibold text-gray-500">EXPERIENCE</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">
              {expYears}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Seniority:{" "}
              <span className="font-semibold capitalize">
                {match?.seniorityFit || "unknown"}
              </span>
            </p>
          </div>

          {/* AI DETECTION */}
          <div className="rounded-2xl border border-gray-100 p-4 bg-white min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-gray-500">AI DETECTION</p>

            {ai?.status !== "DONE" ? (
              <div className="flex items-center gap-2 mt-2">
                <Brain className="w-5 h-5 text-gray-600" />
                <p className="text-lg font-bold text-gray-900">
                  {ai?.status || "—"}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  {ai?.isAIGenerated ? (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}

                  <p className="text-3xl font-extrabold text-gray-900">
                    {ai.isAIGenerated ? "AI" : "Human"}
                  </p>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Confidence:{" "}
                  <span className="font-semibold text-gray-800">
                    {`${Math.round((ai.confidence || 0) * 100)}%`}
                  </span>
                </p>

                {ai?.explanation && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {ai.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                AI Match Summary
              </div>

              <p className="text-sm text-gray-600 mt-3">
                {safeStr(match?.summary) || "Aucun résumé disponible."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Points forts
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    {(match?.strengths || []).length === 0 ? (
                      <li>—</li>
                    ) : (
                      match.strengths.slice(0, 4).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Points faibles
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    {(match?.weaknesses || []).length === 0 ? (
                      <li>—</li>
                    ) : (
                      match.weaknesses.slice(0, 4).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <p className="text-gray-900 font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-700" />
                Scores Detaillés
              </p>

              <div className="space-y-4 mt-4">
                {[
                  ["Skills Fit", match?.techFitScore],
                  ["Experience Fit", match?.experienceFitScore],
                  ["Project Fit", match?.projectFitScore],
                  ["Education", match?.educationScore],
                  ["Communication", match?.communicationScore],
                ].map(([label, val], idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{label}</span>
                      <span className="text-gray-500">
                        {typeof val === "number" ? `${Math.round(val * 100)}%` : "—"}
                      </span>
                    </div>
                    <ProgressBar value01={val} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Skill Cloud */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <p className="text-gray-900 font-semibold">SKILL CLOUD</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {skillCloud.length === 0 ? (
                  <Tag>—</Tag>
                ) : (
                  skillCloud.map((s, i) => {
                    const isMatched = (match?.matchedSkills || []).includes(s);
                    const isMust = (match?.missingMustHaveSkills || []).includes(s);
                    const isNice = (match?.missingNiceToHaveSkills || []).includes(s);

                    return (
                      <Tag
                        key={i}
                        variant={
                          isMatched
                            ? "green"
                            : isMust
                            ? "red"
                            : isNice
                            ? "yellow"
                            : "gray"
                        }
                      >
                        {s}
                      </Tag>
                    );
                  })
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <Target className="w-5 h-5 text-gray-700" />
                Job Match Details
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Missing MUST-HAVE
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(match?.missingMustHaveSkills || []).length === 0 ? (
                      <Tag variant="green">Aucun</Tag>
                    ) : (
                      match.missingMustHaveSkills.map((x, i) => (
                        <Tag key={i} variant="red">
                          {x}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Missing NICE-TO-HAVE
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(match?.missingNiceToHaveSkills || []).length === 0 ? (
                      <Tag variant="green">Aucun</Tag>
                    ) : (
                      match.missingNiceToHaveSkills.map((x, i) => (
                        <Tag key={i} variant="yellow">
                          {x}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Transferable Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(match?.transferableSkills || []).length === 0 ? (
                      <Tag>—</Tag>
                    ) : (
                      match.transferableSkills.map((x, i) => (
                        <Tag key={i} variant="yellow">
                          {x}
                        </Tag>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Recommendation
                  </p>
                  <Tag variant={recColor(match?.recommendation)}>
                    {recLabel(match?.recommendation)}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Risk + Next Steps */}
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <ShieldAlert className="w-5 h-5 text-gray-700" />
                Risk & Next Steps
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Risk Level:</span>{" "}
                  {match?.riskLevel || "—"}
                </p>
                <p>
                  <span className="font-semibold">Immediate Action:</span>{" "}
                  {match?.immediateAction || "—"}
                </p>
                <p>
                  <span className="font-semibold">Talent Pool:</span>{" "}
                  {match?.talentPoolStatus || "—"}
                </p>
              </div>

              {(match?.mitigationStrategies || []).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Mitigation Strategies
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                    {match.mitigationStrategies.slice(0, 4).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function CandidatureAnalysisPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [aiFilter, setAiFilter] = useState("ALL");
  const [minScore, setMinScore] = useState(0);

  // ✅ Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // ✅ service call (no direct fetch)
        const res = await getCandidaturesAnalysis();
        const data = res?.data;

        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log("Load error:", e?.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const jobs = useMemo(() => {
    const set = new Set();
    items.forEach((c) => {
      if (c?.jobTitle) set.add(c.jobTitle);
    });
    return ["ALL", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const name = getName(c).toLowerCase();
      const email = safeStr(c?.email).toLowerCase();
      const jobTitle = safeStr(c?.jobTitle).toLowerCase();

      const q = search.trim().toLowerCase();
      if (q) {
        const ok = name.includes(q) || email.includes(q) || jobTitle.includes(q);
        if (!ok) return false;
      }

      if (jobFilter !== "ALL" && c?.jobTitle !== jobFilter) return false;

      const ai = c?.analysis?.aiDetection;
      if (aiFilter === "AI" && ai?.isAIGenerated !== true) return false;
      if (aiFilter === "HUMAN" && ai?.isAIGenerated !== false) return false;

      const match = normalizeJobMatch(c?.analysis?.jobMatch);
      const score = match?.score;
      const scorePct = typeof score === "number" ? score * 100 : 0;
      if (scorePct < minScore) return false;

      return true;
    });
  }, [items, search, jobFilter, aiFilter, minScore]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, jobFilter, aiFilter, minScore]);

  // paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  return (
    <div className="min-h-screen bg-green-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Analyse Candidatures
          </h1>
          <p className="text-gray-600 mt-1">
            Résultats automatiques (AI Detection + Job Match)
          </p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom, email, job)..."
                className="w-full outline-none text-sm"
              />
            </div>

            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              {jobs.map((j) => (
                <option key={j} value={j}>
                  {j === "ALL" ? "Tous les jobs" : j}
                </option>
              ))}
            </select>

            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="ALL">AI Detection: Tous</option>
              <option value="HUMAN">CV humain</option>
              <option value="AI">CV généré par IA</option>
            </select>

            <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Min score
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-semibold text-gray-800 w-10 text-right">
                {minScore}%
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600">Aucune candidature trouvée.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedItems.map((c) => (
                <CandidatureCard key={c._id} c={c} />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
