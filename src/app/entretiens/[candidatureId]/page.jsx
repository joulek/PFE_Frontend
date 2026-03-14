"use client";
// app/entretiens/[candidatureId]/page.jsx

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  UserCheck,
  Mail,
  FileText,
  Award,
  BarChart2,
  ChevronRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Star,
  Pencil,
  Send,
  Trash2,
  ArrowLeft,
  Phone,
  ClipboardList,
} from "lucide-react";
import {
  getDgaMyInterviews,
  confirmDgaInterview,
  getInterviewNotes,
  createInterviewNote,
  updateInterviewNote,
  deleteInterviewNote,
} from "../../services/candidature.api";

/* ══════════════════════════════════════════════════════════════════
 * Helpers
 * ══════════════════════════════════════════════════════════════════ */
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t) {
  if (!t) return "—";
  if (typeof t === "string" && t.includes(":")) return t.slice(0, 5);
  return new Date(t).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

function normalizeScore(s) {
  const n = Number(s ?? 0);
  return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function scoreTone(score) {
  const n = normalizeScore(score);
  if (n >= 75) {
    return {
      text: "text-[#2F6F27] dark:text-[#8ED973]",
      ring: "border-[#B8D7A8] dark:border-[#31582C]",
      bg: "bg-[#F4FAF1] dark:bg-[#152117]",
      bar: "bg-[#6CB33F]",
      circle: "#6CB33F",
    };
  }
  if (n >= 50) {
    return {
      text: "text-[#497F33] dark:text-[#93D46B]",
      ring: "border-[#C9DFC0] dark:border-[#355A32]",
      bg: "bg-[#F7FBF4] dark:bg-[#172218]",
      bar: "bg-[#7CBE50]",
      circle: "#7CBE50",
    };
  }
  return {
    text: "text-[#3E5F2E] dark:text-[#86CB66]",
    ring: "border-[#D7E7CF] dark:border-[#365C34]",
    bg: "bg-[#F8FCF6] dark:bg-[#162017]",
    bar: "bg-[#8BC96B]",
    circle: "#8BC96B",
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function resolveCvUrl(raw) {
  if (!raw) return null;
  if (typeof raw === "object") {
    const candidate =
      raw.fileUrl || raw.path || raw.filename || raw.originalname || null;
    if (!candidate) return null;
    return resolveCvUrl(candidate);
  }
  let s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  s = s.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  if (!s.startsWith("uploads/")) s = `uploads/cvs/${s}`;
  return `${API_BASE}/${s}`;
}

/* ══════════════════════════════════════════════════════════════════
 * UI
 * ══════════════════════════════════════════════════════════════════ */
function Avatar({ name, size = "xl" }) {
  const sz = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-18 h-18 text-lg",
    xl: "w-24 h-24 text-2xl",
  }[size] || "w-14 h-14 text-base";

  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold shadow-md flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#EAF6E4] dark:bg-[#1B2D1C] flex items-center justify-center border border-[#D5EAC8] dark:border-[#2A462C]">
          {Icon && <Icon className="w-5 h-5 text-[#4E8F2F] dark:text-[#8ED973]" />}
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#173B20] dark:text-white">
            {label}
          </h3>
        </div>
      </div>
      {action}
    </div>
  );
}

function ActionTab({ icon: Icon, label, active, onClick, badge, muted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-w-[150px] sm:min-w-[170px] rounded-2xl border px-4 py-4 text-left transition-all ${
        active
          ? "border-[#6CB33F] bg-[#EEF8E8] dark:bg-[#1A2B1B] dark:border-[#427B38] shadow-sm"
          : muted
          ? "border-[#DCE9D4] bg-white dark:bg-[#111827] dark:border-[#26352A] hover:border-[#BFD8B1] dark:hover:border-[#3C6740]"
          : "border-[#DCE9D4] bg-white dark:bg-[#111827] dark:border-[#26352A] hover:border-[#A7CF94] hover:bg-[#F7FBF4] dark:hover:bg-[#172118]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            active
              ? "bg-[#DFF0D2] border-[#BBD9A9] dark:bg-[#223723] dark:border-[#3D6B3A]"
              : "bg-[#F7FBF4] border-[#E0ECD8] dark:bg-[#18221A] dark:border-[#2A3C2D]"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              active
                ? "text-[#4E8F2F] dark:text-[#8ED973]"
                : "text-[#62895A] dark:text-[#90B886]"
            }`}
          />
        </div>

        {badge != null && (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
              active
                ? "bg-[#6CB33F] text-white"
                : "bg-[#EDF6E8] text-[#4E8F2F] dark:bg-[#203123] dark:text-[#98D873]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <p
        className={`mt-3 text-sm font-extrabold ${
          active
            ? "text-[#224A25] dark:text-white"
            : "text-[#294A2D] dark:text-[#E5F2E2]"
        }`}
      >
        {label}
      </p>
    </button>
  );
}

function InfoPill({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#D3E6C7] dark:border-[#2F4B32] bg-white/80 dark:bg-[#111827]/80 px-4 py-2 text-sm font-semibold text-[#35553A] dark:text-[#D7EBD2]">
      <Icon className="w-4 h-4 text-[#4E8F2F] dark:text-[#8ED973]" />
      <span>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * MATCHING
 * ══════════════════════════════════════════════════════════════════ */
function MatchingScoreCard({ label, value }) {
  const score = normalizeScore(value);
  const tone = scoreTone(score);

  return (
    <div className={`rounded-2xl border p-4 ${tone.ring} ${tone.bg}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-[#2F4A31] dark:text-[#DCE9D6]">
          {label}
        </p>
        <span className={`text-base font-extrabold ${tone.text}`}>{score}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E5EFE0] dark:bg-[#243126]">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function MatchingTab({ jobMatch }) {
  if (!jobMatch) {
    return (
      <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-8">
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EEF8E8] dark:bg-[#1A2B1B]">
            <BarChart2 className="h-10 w-10 text-[#6CB33F]" />
          </div>
          <p className="text-lg font-bold text-[#244529] dark:text-white">
            Analyse de matching non disponible
          </p>
        </div>
      </div>
    );
  }

  const score = normalizeScore(jobMatch.score);
  const tone = scoreTone(score);

  const scoreEntries = Object.entries(jobMatch.detailedScores || {});
  const skills = jobMatch.skillsAnalysis || {};
  const exp = jobMatch.experienceAnalysis || {};
  const risk = jobMatch.riskMitigation || {};
  const next = jobMatch.nextSteps || {};

  const hardMatched = skills.hardSkillsMatched || [];
  const hardMissing = skills.hardSkillsMissing || [];
  const softMatched = skills.softSkillsMatched || [];
  const softMissing = skills.softSkillsMissing || [];

  const riskItems = Array.isArray(risk)
    ? risk
    : typeof risk === "string"
    ? [risk]
    : Object.entries(risk)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ key: k, val: v }));

  const nextItems = Array.isArray(next)
    ? next
    : typeof next === "string"
    ? [next]
    : Object.values(next).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border p-6 sm:p-7 ${tone.ring} ${tone.bg}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative flex-shrink-0 self-center lg:self-auto">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#DCE8D7"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={tone.circle}
                strokeWidth="3.5"
                strokeDasharray={`${score} ${100 - score}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold ${tone.text}`}>{score}%</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6A8A66] dark:text-[#9CB79A]">
              Matching CV / Offre
            </p>
            {jobMatch.recommendation && (
              <h3 className="mt-2 text-2xl font-extrabold text-[#173B20] capitalize dark:text-white">
                {jobMatch.recommendation}
              </h3>
            )}
            {jobMatch.summary && (
              <p className="mt-3 text-sm leading-7 text-[#527053] dark:text-[#A8BDA5]">
                {jobMatch.summary}
              </p>
            )}
          </div>
        </div>
      </div>

      {scoreEntries.length > 0 && (
        <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
          <SectionTitle icon={BarChart2} label="Scores détaillés" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {scoreEntries.map(([key, val]) => (
              <MatchingScoreCard key={key} label={key} value={val} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {jobMatch.strengths?.length > 0 && (
          <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
            <SectionTitle icon={TrendingUp} label="Points forts" />
            <div className="space-y-3">
              {jobMatch.strengths.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-[#D8EBCB] bg-[#F5FBF1] px-4 py-3 dark:border-[#29422C] dark:bg-[#18231A]"
                >
                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6CB33F]" />
                  <p className="text-sm leading-6 text-[#345238] dark:text-[#D7E9D5]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {jobMatch.weaknesses?.length > 0 && (
          <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
            <SectionTitle icon={TrendingDown} label="Points à améliorer" />
            <div className="space-y-3">
              {jobMatch.weaknesses.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-[#E2EDDA] bg-[#F8FCF6] px-4 py-3 dark:border-[#2A3D2D] dark:bg-[#161F18]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7CBF55]" />
                  <p className="text-sm leading-6 text-[#345238] dark:text-[#D7E9D5]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(hardMatched.length > 0 ||
        hardMissing.length > 0 ||
        softMatched.length > 0 ||
        softMissing.length > 0) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
            <SectionTitle icon={Zap} label="Hard Skills" />
            <div className="flex flex-wrap gap-2.5">
              {hardMatched.map((s, i) => (
                <span
                  key={`hm-${i}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CFE4C2] bg-[#ECF7E6] px-3.5 py-2 text-xs font-bold text-[#3B6A32] dark:border-[#385A35] dark:bg-[#1D311E] dark:text-[#A7E08D]"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {s}
                </span>
              ))}
              {hardMissing.map((s, i) => (
                <span
                  key={`hx-${i}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#DCE9D4] bg-[#F7FBF4] px-3.5 py-2 text-xs font-bold text-[#5B775B] dark:border-[#314533] dark:bg-[#172018] dark:text-[#BED0BB]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
            <SectionTitle icon={Star} label="Soft Skills" />
            <div className="flex flex-wrap gap-2.5">
              {softMatched.map((s, i) => (
                <span
                  key={`sm-${i}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CFE4C2] bg-[#ECF7E6] px-3.5 py-2 text-xs font-bold text-[#3B6A32] dark:border-[#385A35] dark:bg-[#1D311E] dark:text-[#A7E08D]"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {s}
                </span>
              ))}
              {softMissing.map((s, i) => (
                <span
                  key={`sx-${i}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#DCE9D4] bg-[#F7FBF4] px-3.5 py-2 text-xs font-bold text-[#5B775B] dark:border-[#314533] dark:bg-[#172018] dark:text-[#BED0BB]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {Object.keys(exp).length > 0 && (
        <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
          <SectionTitle icon={Briefcase} label="Analyse de l'expérience" />

          {(exp.totalYears != null || exp.relevantYears != null || exp.seniorityLevel) && (
            <div className="mb-5 flex flex-wrap gap-2.5">
              {exp.totalYears != null && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E8CF] bg-[#F5FBF1] px-3.5 py-2 text-xs font-bold text-[#426843] dark:border-[#304A33] dark:bg-[#172118] dark:text-[#BDD3B7]">
                  {exp.totalYears} ans d'expérience totale
                </span>
              )}
              {exp.relevantYears != null && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#CFE4C2] bg-[#ECF7E6] px-3.5 py-2 text-xs font-bold text-[#3B6A32] dark:border-[#385A35] dark:bg-[#1D311E] dark:text-[#A7E08D]">
                  {exp.relevantYears} ans pertinents
                </span>
              )}
              {exp.seniorityLevel && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D7E8CF] bg-[#F5FBF1] px-3.5 py-2 text-xs font-bold text-[#426843] capitalize dark:border-[#304A33] dark:bg-[#172118] dark:text-[#BDD3B7]">
                  {exp.seniorityLevel}
                </span>
              )}
            </div>
          )}

          {exp.summary && (
            <p className="mb-5 text-sm leading-7 text-[#527053] dark:text-[#A8BDA5]">
              {exp.summary}
            </p>
          )}

          {(() => {
            const raw = exp.breakdown;
            if (!raw) return null;

            const items = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
              ? (() => {
                  try {
                    return JSON.parse(raw);
                  } catch {
                    return [{ role: raw }];
                  }
                })()
              : typeof raw === "object"
              ? [raw]
              : null;

            if (!items?.length) return null;

            return (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border px-4 py-4 ${
                      item.relevant
                        ? "border-[#CFE4C2] bg-[#F2FAED] dark:border-[#355735] dark:bg-[#18251A]"
                        : "border-[#E1ECDC] bg-[#F9FCF7] dark:border-[#2A3A2D] dark:bg-[#151D17]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-[#173B20] dark:text-white">
                          {item.role || "—"}
                        </p>
                        {item.company && (
                          <p className="mt-1 text-xs font-semibold text-[#6A8668] dark:text-[#9DB39A]">
                            {item.company}
                          </p>
                        )}
                      </div>

                      {item.relevant != null && (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                            item.relevant
                              ? "bg-[#E8F5E0] text-[#4E8F2F] dark:bg-[#1D331E] dark:text-[#A7E08D]"
                              : "bg-[#F2F7EF] text-[#648062] dark:bg-[#1A241B] dark:text-[#B4C7B0]"
                          }`}
                        >
                          {item.relevant ? "Pertinent" : "Non pertinent"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.duration && (
                        <span className="rounded-full border border-[#D7E8CF] bg-white px-3 py-1 text-[11px] font-bold text-[#547255] dark:border-[#304A33] dark:bg-[#121A14] dark:text-[#B8CDB4]">
                          {item.duration}
                        </span>
                      )}
                      {item.type && (
                        <span className="rounded-full border border-[#D7E8CF] bg-white px-3 py-1 text-[11px] font-bold capitalize text-[#547255] dark:border-[#304A33] dark:bg-[#121A14] dark:text-[#B8CDB4]">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {riskItems.length > 0 && (
        <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
          <SectionTitle icon={AlertTriangle} label="Points de vigilance" />
          <div className="space-y-3">
            {riskItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-[#E1ECDC] bg-[#F8FCF6] px-4 py-3 dark:border-[#2A3A2D] dark:bg-[#151D17]"
              >
                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#7DBE56]" />
                {typeof item === "string" ? (
                  <p className="text-sm leading-6 text-[#345238] dark:text-[#D7E9D5]">
                    {item}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-[#345238] dark:text-[#D7E9D5]">
                    <span className="mr-2 font-extrabold uppercase tracking-wide text-[#70906F] dark:text-[#9FBA9C]">
                      {String(item.key).replace(/_/g, " ")} :
                    </span>
                    {typeof item.val === "object"
                      ? JSON.stringify(item.val)
                      : String(item.val)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {nextItems.length > 0 && (
        <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
          <SectionTitle icon={ChevronRight} label="Prochaines étapes" />
          <div className="space-y-3">
            {nextItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl border border-[#D8EBCB] bg-[#F5FBF1] px-4 py-3 dark:border-[#29422C] dark:bg-[#18231A]"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#6CB33F] text-xs font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="text-sm leading-6 text-[#345238] dark:text-[#D7E9D5]">
                  {typeof item === "object" ? JSON.stringify(item) : String(item)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * NOTES
 * ══════════════════════════════════════════════════════════════════ */
function NotesTab({ candidatureId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState(null);

  const loadNotes = useCallback(async () => {
    if (!candidatureId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getInterviewNotes(candidatureId);
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setError("Impossible de charger les notes.");
    } finally {
      setLoading(false);
    }
  }, [candidatureId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await createInterviewNote(candidatureId, {
        note: text.trim(),
        type: "dga",
        stars: 0,
      });
      setText("");
      await loadNotes();
    } catch {
      setError("Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (noteId) => {
    if (!editText.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await updateInterviewNote(candidatureId, noteId, {
        note: editText.trim(),
      });
      setEditId(null);
      setEditText("");
      await loadNotes();
    } catch {
      setError("Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      setDeleting(noteId);
      setError(null);
      await deleteInterviewNote(candidatureId, noteId);
      await loadNotes();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
        <SectionTitle icon={Pencil} label="Ajouter une note" />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre observation sur ce candidat..."
          rows={5}
          className="w-full resize-none rounded-2xl border border-[#D7E8CF] bg-[#F8FCF6] px-4 py-4 text-sm text-[#173B20] placeholder:text-[#8AA087] focus:border-[#6CB33F] focus:outline-none focus:ring-4 focus:ring-[#DFF0D2] dark:border-[#304A33] dark:bg-[#162018] dark:text-white dark:placeholder:text-[#7E967B] dark:focus:ring-[#223824]"
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4E8F2F] hover:bg-[#43792A] disabled:cursor-not-allowed disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Envoyer
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-[#D8E8CF] dark:border-[#2C402F] bg-white dark:bg-[#111827] p-5 sm:p-6">
        <SectionTitle icon={FileText} label={`Notes (${notes.length})`} />

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#6D8669] dark:text-[#9DB39A]">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Chargement...
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EEF8E8] dark:bg-[#1A2B1B]">
              <Pencil className="h-9 w-9 text-[#6CB33F]" />
            </div>
            <p className="text-base font-bold text-[#35553A] dark:text-[#D7EBD2]">
              Aucune note pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((n) => {
              const nid = n._id?.toString?.() || String(n._id || "");
              const isEditing = editId === nid;

              return (
                <div
                  key={nid}
                  className="rounded-2xl border border-[#DCE9D4] bg-[#F9FCF7] p-4 dark:border-[#2A3A2D] dark:bg-[#151D17]"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-[#D7E8CF] bg-white px-4 py-3 text-sm text-[#173B20] focus:border-[#6CB33F] focus:outline-none focus:ring-4 focus:ring-[#DFF0D2] dark:border-[#304A33] dark:bg-[#111827] dark:text-white dark:focus:ring-[#223824]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(null);
                            setEditText("");
                          }}
                          className="rounded-xl border border-[#D8E8CF] bg-white px-4 py-2 text-xs font-bold text-[#567055] hover:bg-[#F6FBF3] dark:border-[#314533] dark:bg-[#111827] dark:text-[#CBDCC8]"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(nid)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#4E8F2F] hover:bg-[#43792A] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {saving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-[#244529] dark:text-[#E6F1E3]">
                          {n.note || "—"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {n.createdAt && (
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#6B8668] dark:bg-[#111827] dark:text-[#9EB49A]">
                              {formatDate(n.createdAt)}
                            </span>
                          )}

                          {n.type && (
                            <span className="rounded-full bg-[#E8F5E0] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#4E8F2F] dark:bg-[#1D331E] dark:text-[#A7E08D]">
                              {n.type}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(nid);
                            setEditText(n.note || "");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E8CF] bg-white text-[#648062] hover:border-[#A7CF94] hover:text-[#4E8F2F] dark:border-[#314533] dark:bg-[#111827] dark:text-[#A8BDA5]"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(nid)}
                          disabled={deleting === nid}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E8CF] bg-white text-[#648062] hover:text-red-500 dark:border-[#314533] dark:bg-[#111827] dark:text-[#A8BDA5] disabled:opacity-50"
                        >
                          {deleting === nid ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * PAGE
 * ══════════════════════════════════════════════════════════════════ */
export default function EntretienDetailPage() {
  const router = useRouter();
  const params = useParams();
  const candidatureId = params?.candidatureId;

  const [iv, setIv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matching");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!candidatureId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getDgaMyInterviews({ limit: 100 });
      const interviews = data?.interviews || [];

      const found = interviews.find(
        (i) =>
          i.candidatureId === candidatureId || String(i._id) === candidatureId
      );

      if (!found) throw new Error("Candidature introuvable");

      setIv(found);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }, [candidatureId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleConfirm = async () => {
    if (!iv?._id || iv?.dgaConfirmed || confirming) return;

    try {
      setConfirmError("");
      setConfirming(true);

      const res = await confirmDgaInterview(String(iv._id));

      if (res?.success || res?.alreadyConfirmed || res?.dgaConfirmed) {
        setIv((prev) => ({
          ...prev,
          dgaConfirmed: true,
          status:
            prev?.status === "DGA_CONFIRMED"
              ? prev.status
              : "DGA_CONFIRMED",
        }));
      }
    } catch (e) {
      console.error("Erreur confirmation DGA:", e);
      setConfirmError(
        e?.response?.data?.message || "Erreur lors de la confirmation."
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenQuiz = () => {
    router.push(`/entretiens/${iv.candidatureId}/quiz-result`);
  };

  const handleOpenFiche = () => {
    router.push(`/entretiens/${iv.candidatureId}/fiche-result`);
  };

  const handleOpenCv = () => {
    const url = resolveCvUrl(iv?.cvUrl);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4FAF1] dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#DDEED3] border-t-[#4E8F2F]" />
          <p className="text-sm font-semibold text-[#63805F] dark:text-[#9BB197]">
            Chargement du dossier candidat...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4FAF1] dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-[#173B20] dark:text-white">
            {error}
          </h2>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4E8F2F] px-5 py-2.5 text-sm font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!iv) return null;

  const dga = iv.dgaInterview;
  const date = dga?.date || iv.confirmedDate;
  const time = dga?.time || iv.confirmedTime;
  const lieu = dga?.location || iv.location;
  const phone = iv?.candidatePhone || iv?.phone || iv?.candidate?.phone || null;
  const cvUrl = resolveCvUrl(iv?.cvUrl);
  const isConfirmed = !!iv?.dgaConfirmed;

  return (
    <div className="min-h-screen bg-[#F4FAF1] dark:bg-gray-950 text-[#173B20] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <button
          type="button"
          onClick={() => router.push("/entretiens")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#5D785D] transition-colors hover:text-[#4E8F2F] dark:text-[#9CB39A] dark:hover:text-[#9ADF77]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux entretiens
        </button>

        {confirmError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {confirmError}
          </div>
        )}

        <div className="overflow-hidden rounded-[32px] border border-[#D6E7CE] bg-[#EEF7E9] shadow-sm dark:border-[#2B3F2E] dark:bg-[#101A12]">
          <div className="border-b border-[#D6E7CE] px-5 py-6 sm:px-7 sm:py-7 dark:border-[#263A29]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <Avatar name={iv.candidateName} size="xl" />

                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-3xl sm:text-4xl font-extrabold text-[#0D2340] dark:text-white">
                    {iv.candidateName || "—"}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-[#48674D] dark:text-[#CFE0CC]">
                    <div className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4E8F2F]" />
                      <span className="break-all">{iv.candidateEmail || "—"}</span>
                    </div>

                    {phone && (
                      <div className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#4E8F2F]" />
                        <span>{phone}</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-2xl font-medium text-[#5DA52E] dark:text-[#8ED973]">
                    {iv.jobTitle || "—"}
                  </p>
                </div>
              </div>

         
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6D8A6B] dark:text-[#93AA90]">
                Détails de l'entretien
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <InfoPill icon={Briefcase}>{iv.jobTitle || "—"}</InfoPill>
              <InfoPill icon={Calendar}>{formatDate(date)}</InfoPill>
              <InfoPill icon={Clock}>{formatTime(time)}</InfoPill>
              {lieu ? <InfoPill icon={MapPin}>{lieu}</InfoPill> : null}
              {iv.responsableName || iv.responsableEmail ? (
                <InfoPill icon={UserCheck}>
                  {iv.responsableName || iv.responsableEmail}
                </InfoPill>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <ActionTab
            icon={Award}
            label="Quiz"
            onClick={handleOpenQuiz}
            badge={
              iv?.quiz
                ? `${normalizeScore(
                    iv.quiz.percentage ??
                      (iv.quiz.totalQuestions
                        ? (iv.quiz.score / iv.quiz.totalQuestions) * 100
                        : 0)
                  )}%`
                : null
            }
          />

          <ActionTab
            icon={ClipboardList}
            label="Fiche"
            onClick={handleOpenFiche}
            badge={iv?.fiche ? "OK" : null}
          />

          <ActionTab
            icon={FileText}
            label="CV"
            onClick={handleOpenCv}
            muted={!cvUrl}
          />

          <ActionTab
            icon={BarChart2}
            label="Matching"
            active={activeTab === "matching"}
            onClick={() => setActiveTab("matching")}
            badge={iv?.jobMatch ? `${normalizeScore(iv.jobMatch.score)}%` : null}
          />

          <ActionTab
            icon={Pencil}
            label="Notes"
            active={activeTab === "notes"}
            onClick={() => setActiveTab("notes")}
          />
        </div>

        <div className="mt-6">
          {activeTab === "matching" && <MatchingTab jobMatch={iv.jobMatch} />}
          {activeTab === "notes" && (
            <NotesTab candidatureId={iv.candidatureId} />
          )}
        </div>

        {!cvUrl && (
          <div className="mt-6 rounded-2xl border border-[#DCE9D4] bg-white px-4 py-4 text-sm font-semibold text-[#6B8668] dark:border-[#2A3A2D] dark:bg-[#111827] dark:text-[#9EB49A]">
            Aucun CV disponible pour ce candidat.
          </div>
        )}
      </div>
    </div>
  );
}