"use client";
// app/entretiens-confirmes/page.jsx — DGA uniquement + Modal détails

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Search, User, Briefcase, Clock, CheckCircle2,
  AlertCircle, RefreshCw, MapPin, X, UserCheck, Mail, Shield,
  FileText, Award, ExternalLink, BarChart2, ChevronRight,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Zap, AlertTriangle,
  BookOpen, Star, Eye, Pencil, Send, Trash2,
} from "lucide-react";
import api from "../services/api";

/* ══════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════ */
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(t) {
  if (!t) return "—";
  if (typeof t === "string" && t.includes(":")) return t.slice(0, 5);
  return new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}
function pctColor(p) {
  return p >= 75 ? "emerald" : p >= 50 ? "amber" : "red";
}

/* ══════════════════════════════════════════════════════════════════
 *  Small UI
 * ══════════════════════════════════════════════════════════════════ */
function Avatar({ name, size = "md" }) {
  const sz = size === "lg" ? "w-14 h-14 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold shadow-sm flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function DgaBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 whitespace-nowrap">
      <Shield className="w-3 h-3" />Entretien Direction
    </span>
  );
}

function ScorePill({ value, total, pct: rawPct, label, icon: Icon }) {
  const pct = rawPct ?? (total ? Math.round((value / total) * 100) : 0);
  const c = pctColor(pct);
  const colorMap = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700",
    amber:   "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-700",
    red:     "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-700",
  };
  const barMap = { emerald: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" };
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</span>}
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-extrabold ${colorMap[c]}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {total != null ? `${value}/${total}` : `${pct}%`}
        {total != null && <span className="opacity-70 font-semibold">({pct}%)</span>}
      </span>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barMap[c]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <span className={colorClass}><Icon className="w-5 h-5 mb-3" /></span>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Pagination({ page, totalPages, total, limit, onChange }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600 dark:text-gray-300">{from}–{to}</span> sur <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx-1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
          .map((p, i) => p === "..." ? <span key={`e${i}`} className="text-gray-400 px-1 text-xs">…</span> :
            <button type="button" key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page ? "bg-[#4E8F2F] text-white" : "border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
          )}
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-[#4E8F2F] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">›</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  MODAL TABS
 * ══════════════════════════════════════════════════════════════════ */
/* ── Card résumé Quiz ──────────────────────────────────────────── */
function QuizSummaryCard({ quiz, candidatureId }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col gap-4">
      <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Résultat Quiz</p>
      {!quiz ? (
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <BarChart2 className="w-4 h-4 opacity-50" />
          <span className="text-sm">Pas encore soumis</span>
        </div>
      ) : (
        <>
          {(() => {
            const pct = quiz.percentage ?? Math.round((quiz.score / quiz.totalQuestions) * 100);
            const c = pctColor(pct);
            const colorText = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", red: "text-red-500 dark:text-red-400" }[c];
            const colorBadge = { emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300", amber: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-300", red: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300" }[c];
            return (
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-extrabold ${colorBadge}`}>
                  <Award className="w-4 h-4" />{quiz.score}/{quiz.totalQuestions}
                </span>
                <span className={`text-lg font-extrabold ${colorText}`}>{pct}%</span>
              </div>
            );
          })()}
          <button type="button"
            onClick={() => router.push(`/entretiens/${candidatureId}/quiz-result`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 hover:bg-[#E9F5E3] border border-gray-200 hover:border-[#4E8F2F] dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#4E8F2F] dark:text-gray-300 dark:hover:text-emerald-400 transition-all">
            <BookOpen className="w-4 h-4" />Voir détails
          </button>
        </>
      )}
    </div>
  );
}

/* ── Card résumé Fiche ─────────────────────────────────────────── */
function FicheSummaryCard({ fiche, candidatureId }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col gap-4">
      <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fiche de Renseignement</p>
      {!fiche ? (
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <FileText className="w-4 h-4 opacity-50" />
          <span className="text-sm">Pas encore soumise</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4" />Soumise
            </span>
            {fiche.finishedAt && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(fiche.finishedAt)}</span>
            )}
          </div>
          <button type="button"
            onClick={() => router.push(`/entretiens/${candidatureId}/fiche-result`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-purple-950/30 dark:hover:border-purple-700 py-2.5 text-sm font-semibold text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-all">
            <FileText className="w-4 h-4" />Voir détails
          </button>
        </>
      )}
    </div>
  );
}

/* ── Tab: Quiz détails ─────────────────────────────────────────── */
function QuizTab({ quiz, onBack }) {
  if (!quiz) return null;
  const pct = quiz.percentage ?? Math.round((quiz.score / quiz.totalQuestions) * 100);
  const correct   = (quiz.answers || []).filter(a => a.isCorrect);
  const incorrect = (quiz.answers || []).filter(a => !a.isCorrect);

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
        ← Retour
      </button>

      {/* Score global */}
      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke={pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-extrabold ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>{pct}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Résultat Quiz</h3>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <Award className="w-4 h-4 text-amber-500" />{quiz.score}/{quiz.totalQuestions} correctes
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4" />{correct.length} bonnes
            </span>
            <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300">
              <XCircle className="w-4 h-4" />{incorrect.length} fausses
            </span>
          </div>
        </div>
      </div>

      {/* Questions */}
      {quiz.answers?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Détail des réponses</h4>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {quiz.answers.map((a, i) => (
              <div key={i} className={`rounded-xl border p-4 ${a.isCorrect ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex-shrink-0 ${a.isCorrect ? "text-emerald-500" : "text-red-500"}`}>
                    {a.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      <span className="text-gray-400 font-normal mr-1">Q{a.order ?? i + 1}.</span>{a.question || "Question"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className={`rounded-lg px-3 py-1.5 font-semibold ${a.isCorrect ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                        Réponse : {a.selectedAnswer ?? "—"}
                      </div>
                      {!a.isCorrect && (
                        <div className="rounded-lg px-3 py-1.5 font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Correcte : {a.correctAnswer ?? "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Fiche détails ────────────────────────────────────────── */
function FicheTab({ fiche, onBack }) {
  if (!fiche) return null;
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
        ← Retour
      </button>
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 dark:text-white text-sm">Fiche de renseignement</p>
            <p className="text-xs text-gray-500">Soumise le {fiche.finishedAt ? formatDate(fiche.finishedAt) : "—"}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-[12px] font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          <CheckCircle className="w-3 h-3" />Soumise
        </span>
      </div>
      {fiche.answers?.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {fiche.answers.map((a, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">{a.label || `Question ${i + 1}`}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "—")}
              </p>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-gray-500 text-center py-6">Aucune réponse enregistrée</p>}
    </div>
  );
}

/* ── Tab: CV ───────────────────────────────────────────────────── */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * Normalise n'importe quel format de cvUrl stocké en DB vers une URL complète.
 * Le backend (Hono) sert les fichiers statiques via :
 *   app.use("/uploads/*", serveStatic({ root: "./" }))
 * => URL finale attendue : http://localhost:5000/uploads/cvs/<filename>
 */
function resolveCvUrl(raw) {
  if (!raw) return null;

  // Cas objet : { fileUrl, path, filename, originalname, ... }
  if (typeof raw === "object") {
    const candidate = raw.fileUrl || raw.path || raw.filename || raw.originalname || null;
    if (!candidate) return null;
    return resolveCvUrl(candidate);
  }

  let s = String(raw).trim();
  if (!s) return null;

  // Deja une URL complete
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // Normalise les backslashes Windows
  s = s.replace(/\\/g, "/");

  // Supprime les prefixes "./" ou "/"
  s = s.replace(/^\.\//, "").replace(/^\/+/, "");

  // S'assure que le chemin commence par "uploads/"
  if (!s.startsWith("uploads/")) {
    s = `uploads/cvs/${s}`;
  }

  return `${API_BASE}/${s}`;
}

function CvTab({ cvUrl: cvUrlRaw }) {
  const cvUrl = resolveCvUrl(cvUrlRaw);

  if (!cvUrl) return (
    <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
      <FileText className="w-10 h-10 opacity-30" />
      <p className="text-sm">Aucun CV disponible</p>
    </div>
  );

  const isPdf = cvUrl.toLowerCase().includes(".pdf") || cvUrl.includes("application/pdf");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-gray-700 dark:text-gray-300">Curriculum Vitae</p>
        <a href={cvUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 hover:border-[#4E8F2F] hover:bg-[#E9F5E3] px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#4E8F2F] transition-colors">
          <ExternalLink className="w-3 h-3" />Ouvrir dans un onglet
        </a>
      </div>
      {/* URL debug — à retirer en prod */}
      <p className="text-[10px] text-gray-400 break-all font-mono bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">{cvUrl}</p>
      {isPdf ? (
        <iframe
          src={cvUrl}
          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50"
          style={{ height: "520px" }}
          title="CV du candidat"
          onError={() => {}}
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800" style={{ height: "520px" }}>
          <img src={cvUrl} alt="CV" className="w-full h-full object-contain"
            onError={e => { e.target.style.display="none"; }} />
        </div>
      )}
    </div>
  );
}

/* ── Tab: Matching ─────────────────────────────────────────────── */
// Normalise le score : si c'est un float 0-1, convertit en 0-100
function normalizeScore(s) {
  const n = Number(s ?? 0);
  return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function ScoreBar({ label, value }) {
  const v = normalizeScore(value);
  const cc = pctColor(v);
  const barC  = { emerald: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" }[cc];
  const textC = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", red: "text-red-500 dark:text-red-400" }[cc];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-extrabold ${textC}`}>{v}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barC}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, color = "text-gray-500" }) {
  return (
    <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 ${color}`}>
      {Icon && <Icon className="w-4 h-4" />}{label}
    </h4>
  );
}

function MatchingTab({ jobMatch }) {
  if (!jobMatch) return (
    <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
      <BarChart2 className="w-10 h-10 opacity-30" />
      <p className="text-sm">Analyse de matching non disponible</p>
    </div>
  );

  const score  = normalizeScore(jobMatch.score);
  const c      = pctColor(score);
  const colorText   = { emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-500" }[c];
  const colorBorder = { emerald: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20", amber: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20", red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" }[c];
  const svgColor    = { emerald: "#10b981", amber: "#f59e0b", red: "#ef4444" }[c];

  const scoreEntries = Object.entries(jobMatch.detailedScores || {});
  const skills       = jobMatch.skillsAnalysis    || {};
  const exp          = jobMatch.experienceAnalysis || {};
  const risk         = jobMatch.riskMitigation    || {};
  const next         = jobMatch.nextSteps          || {};

  const hardMatched = skills.hardSkillsMatched || [];
  const hardMissing = skills.hardSkillsMissing || [];
  const softMatched = skills.softSkillsMatched || [];
  const softMissing = skills.softSkillsMissing || [];

  const riskItems = Array.isArray(risk) ? risk
    : typeof risk === "string" ? [risk]
    : Object.entries(risk).filter(([, v]) => v).map(([k, v]) => ({ key: k, val: v }));

  // nextSteps
  const nextItems = Array.isArray(next) ? next
    : typeof next === "string" ? [next]
    : Object.values(next).filter(Boolean);

  return (
    <div className="space-y-6 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>

      {/* ── Score global ── */}
      <div className={`rounded-2xl border p-5 ${colorBorder}`}>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={svgColor}
                strokeWidth="3.5" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-extrabold ${colorText}`}>{score}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Score de matching CV / Offre</p>
            {jobMatch.recommendation && (
              <p className="text-base font-extrabold text-gray-900 dark:text-white capitalize">{jobMatch.recommendation}</p>
            )}
            {jobMatch.summary && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{jobMatch.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Scores détaillés ── */}
      {scoreEntries.length > 0 && (
        <div>
          <SectionTitle icon={BarChart2} label="Scores détaillés" color="text-gray-500 dark:text-gray-400" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoreEntries.map(([key, val]) => (
              <ScoreBar key={key} label={key} value={val} />
            ))}
          </div>
        </div>
      )}

      {/* ── Points forts ── */}
      {jobMatch.strengths?.length > 0 && (
        <div>
          <SectionTitle icon={TrendingUp} label="Points forts" color="text-emerald-600 dark:text-emerald-400" />
          <ul className="space-y-2">
            {jobMatch.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Star className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Points à améliorer ── */}
      {jobMatch.weaknesses?.length > 0 && (
        <div>
          <SectionTitle icon={TrendingDown} label="Points à améliorer" color="text-amber-600 dark:text-amber-400" />
          <ul className="space-y-2">
            {jobMatch.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Hard & Soft Skills ── */}
      {(hardMatched.length > 0 || hardMissing.length > 0 || softMatched.length > 0 || softMissing.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Hard skills */}
          {(hardMatched.length > 0 || hardMissing.length > 0) && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <SectionTitle icon={Zap} label="Hard Skills" />
              <div className="flex flex-wrap gap-1.5">
                {hardMatched.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="w-3 h-3" />{s}
                  </span>
                ))}
                {hardMissing.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400">
                    <XCircle className="w-3 h-3" />{s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Soft skills */}
          {(softMatched.length > 0 || softMissing.length > 0) && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <SectionTitle icon={Star} label="Soft Skills" />
              <div className="flex flex-wrap gap-1.5">
                {softMatched.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="w-3 h-3" />{s}
                  </span>
                ))}
                {softMissing.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400">
                    <XCircle className="w-3 h-3" />{s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Analyse expérience ── */}
      {Object.keys(exp).length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <SectionTitle icon={Briefcase} label="Analyse de l'expérience" />
          <div className="space-y-3">

            {/* Métriques clés */}
            {(exp.totalYears != null || exp.relevantYears != null || exp.seniorityLevel) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {exp.totalYears != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    🗓 {exp.totalYears} ans d'exp. totale
                  </span>
                )}
                {exp.relevantYears != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    🎯 {exp.relevantYears} ans pertinents
                  </span>
                )}
                {exp.seniorityLevel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 capitalize">
                    👤 {exp.seniorityLevel}
                  </span>
                )}
              </div>
            )}

            {/* Summary */}
            {exp.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{exp.summary}</p>
            )}

            {/* Breakdown — tableau d'expériences */}
            {(() => {
              const raw = exp.breakdown;
              if (!raw) return null;
              const items = Array.isArray(raw) ? raw
                : typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return [{ role: raw }]; } })()
                : typeof raw === "object" ? [raw] : null;
              if (!items?.length) return null;
              return (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Détail des expériences</p>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                        item.relevant
                          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60"
                      }`}>
                        <span className={`mt-0.5 flex-shrink-0 text-base`}>
                          {item.type === "stage" ? "🎓" : item.type === "freelance" ? "💼" : "🏢"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.role || "—"}</p>
                          {item.company && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.company}</p>}
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {item.duration && (
                              <span className="text-[11px] text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5">
                                ⏱ {item.duration}
                              </span>
                            )}
                            {item.type && (
                              <span className="text-[11px] text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5 capitalize">
                                {item.type}
                              </span>
                            )}
                            {item.relevant != null && (
                              <span className={`text-[11px] rounded-full px-2 py-0.5 font-semibold ${
                                item.relevant
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                              }`}>
                                {item.relevant ? "✓ Pertinent" : "Non pertinent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Autres champs inconnus */}
            {Object.entries(exp)
              .filter(([k]) => !["totalYears","relevantYears","seniorityLevel","summary","breakdown"].includes(k))
              .map(([k, v]) => (
                <div key={k} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mr-2">{k.replace(/_/g, " ")} :</span>
                  <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Mitigation des risques ── */}
      {riskItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
          <SectionTitle icon={AlertTriangle} label="Mitigation des risques" color="text-amber-600 dark:text-amber-400" />
          <div className="space-y-2">
            {riskItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                {typeof item === "string" ? <span>{item}</span> : (
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2">{item.key.replace(/_/g, " ")} :</span>
                    <span>{typeof item.val === "object" ? JSON.stringify(item.val) : String(item.val)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prochaines étapes ── */}
      {nextItems.length > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
          <SectionTitle icon={ChevronRight} label="Prochaines étapes recommandées" color="text-blue-600 dark:text-blue-400" />
          <ol className="space-y-2">
            {nextItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-extrabold flex items-center justify-center">{i + 1}</span>
                <span>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

    </div>
  );
}

/* ── Tab: Note DGA ─────────────────────────────────────────────── */
// ⚠️  Le backend note travaille sur la collection "candidatures"
//     avec candidatureId, body: { note, type, stars }
function NoteTab({ candidatureId }) {
  const [notes, setNotes]         = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [text, setText]           = useState("");
  const [editId, setEditId]       = useState(null);
  const [editText, setEditText]   = useState("");
  const [noteError, setNoteError] = useState(null);

  const loadNotes = useCallback(async () => {
    if (!candidatureId) return;
    try {
      setLoadingNotes(true);
      setNoteError(null);
      const { data } = await api.get(`/api/interviews/${candidatureId}/notes`);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setNoteError("Impossible de charger les notes.");
    } finally {
      setLoadingNotes(false);
    }
  }, [candidatureId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleAdd = async () => {
    if (!text.trim() || !candidatureId) return;
    try {
      setSaving(true); setNoteError(null);
      // body attendu par addEntretienNoteController : { note, type, stars }
      await api.post(`/api/interviews/${candidatureId}/notes`, {
        note:  text.trim(),
        type:  "dga",
        stars: 0,
      });
      setText("");
      await loadNotes();
    } catch { setNoteError("Erreur lors de l'ajout."); }
    finally   { setSaving(false); }
  };

  const handleEdit = async (noteId) => {
    if (!editText.trim() || !candidatureId) return;
    try {
      setSaving(true); setNoteError(null);
      await api.patch(`/api/interviews/${candidatureId}/notes/${noteId}`, {
        note: editText.trim(),
      });
      setEditId(null); setEditText("");
      await loadNotes();
    } catch { setNoteError("Erreur lors de la modification."); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (noteId) => {
    if (!candidatureId) return;
    try {
      setDeleting(noteId); setNoteError(null);
      await api.delete(`/api/interviews/${candidatureId}/notes/${noteId}`);
      await loadNotes();
    } catch { setNoteError("Erreur lors de la suppression."); }
    finally   { setDeleting(null); }
  };

  if (!candidatureId) return (
    <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
      <AlertCircle className="w-8 h-8 opacity-30" />
      <p className="text-sm">Candidature introuvable</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Zone de saisie */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        <p className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5" />Ajouter une note
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Votre observation sur ce candidat..."
          rows={3}
          className="w-full rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition"
        />
        <div className="flex justify-end mt-2">
          <button type="button" onClick={handleAdd} disabled={saving || !text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-bold text-white transition-colors">
            {saving
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
            Envoyer
          </button>
        </div>
      </div>

      {/* Erreur */}
      {noteError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{noteError}
        </div>
      )}

      {/* Liste */}
      {loadingNotes ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
          <Pencil className="w-8 h-8 opacity-30" />
          <p className="text-sm">Aucune note pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            {notes.length} note{notes.length > 1 ? "s" : ""}
          </p>
          {notes.map((n) => {
            const nid = n._id?.toString?.() || String(n._id || "");
            const isEditing = editId === nid;
            return (
              <div key={nid} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setEditId(null); setEditText(""); }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                        Annuler
                      </button>
                      <button type="button" onClick={() => handleEdit(nid)} disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50 transition-colors">
                        {saving
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <CheckCircle className="w-3 h-3" />}
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {n.note || "—"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {n.stars > 0 && (
                          <span className="text-[11px] text-amber-500 flex items-center gap-0.5">
                            {"★".repeat(n.stars)}{"☆".repeat(5 - n.stars)}
                          </span>
                        )}
                        {n.createdAt && (
                          <span className="text-[11px] text-gray-400">{formatDate(n.createdAt)}</span>
                        )}
                        {n.type && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                            {n.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button"
                        onClick={() => { setEditId(nid); setEditText(n.note || ""); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(nid)} disabled={deleting === nid}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors">
                        {deleting === nid
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
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
  );
}

function TabBtn({ active, onClick, children, icon: Icon }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        active ? "bg-[#4E8F2F] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
      }`}>
      {Icon && <Icon className="w-4 h-4" />}{children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  MODAL PRINCIPAL
 * ══════════════════════════════════════════════════════════════════ */
function CandidateModal({ iv, onClose, handleConfirmDGA, confirming }) {
  // "overview" | "quiz" | "fiche" | "cv" | "matching"
  const [view, setView] = useState("overview");
  if (!iv) return null;

  const dga  = iv.dgaInterview;
  const date = dga?.date || iv.confirmedDate;
  const time = dga?.time || iv.confirmedTime;
  const lieu = dga?.location || iv.location;

  const navTabs = [
    { key: "overview", label: "Aperçu",   icon: Eye },
    { key: "cv",       label: "CV",       icon: FileText },
    { key: "matching", label: "Matching", icon: BarChart2 },
    { key: "notes",    label: "Notes",    icon: Pencil },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
          <Avatar name={iv.candidateName} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">{iv.candidateName || "—"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />{iv.candidateEmail || "—"}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                <Briefcase className="w-3 h-3" />{iv.jobTitle || "—"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-full px-2.5 py-1">
                <Calendar className="w-3 h-3" />{formatDate(date)} à {formatTime(time)}
              </span>
              {lieu && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                  <MapPin className="w-3 h-3" />{lieu}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de confirmation */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
          {iv.dgaConfirmed ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />Candidature confirmée par la Direction
            </span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Candidature en attente de confirmation Direction</span>
          )}
          {!iv.dgaConfirmed && (
            <button type="button"
              onClick={e => handleConfirmDGA(e, iv.candidatureId)}
              disabled={confirming === iv.candidatureId}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-bold text-white transition-colors shadow-sm">
              {confirming === iv.candidatureId
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />}
              Confirmer la candidature
            </button>
          )}
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {navTabs.map(t => (
            <TabBtn key={t.key} active={view === t.key} onClick={() => setView(t.key)} icon={t.icon}>
              {t.label}
              {t.key === "matching" && iv.jobMatch && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/30 text-[10px] font-extrabold">{normalizeScore(iv.jobMatch.score)}%</span>
              )}
            </TabBtn>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Vue Aperçu : cards Quiz + Fiche côte à côte ── */}
          {view === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuizSummaryCard  quiz={iv.quiz}   candidatureId={iv.candidatureId} />
                <FicheSummaryCard fiche={iv.fiche} candidatureId={iv.candidatureId} />
              </div>
            </div>
          )}

          {/* ── Vue CV ── */}
          {view === "cv"       && <CvTab       cvUrl={iv.cvUrl} />}

          {/* ── Vue Matching ── */}
          {view === "matching" && <MatchingTab jobMatch={iv.jobMatch} />}

          {/* ── Vue Notes DGA ── */}
          {view === "notes" && <NoteTab candidatureId={iv.candidatureId} />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  PAGE PRINCIPALE
 * ══════════════════════════════════════════════════════════════════ */
const LIMIT = 15;
const TABLE_HEADERS = ["#","Candidat","Poste","Date DGA","Heure","Lieu","Responsable RH","Statut",""];

export default function EntretiensPage() {
  const [interviews, setInterviews] = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null); // modal
  const [confirming, setConfirming] = useState(null); // candidatureId en cours

  const handleConfirmDGA = async (e, candidatureId) => {
    e.stopPropagation();
    if (!candidatureId || confirming) return;
    try {
      setConfirming(candidatureId);
      await api.patch(`/candidatures/${candidatureId}/confirm-dga`);
      // Mettre à jour localement
      setInterviews(prev =>
        prev.map(iv =>
          iv.candidatureId === candidatureId
            ? { ...iv, dgaConfirmed: true }
            : iv
        )
      );
      if (selected?.candidatureId === candidatureId) {
        setSelected(prev => ({ ...prev, dgaConfirmed: true }));
      }
    } catch (err) {
      console.error("Erreur confirmation DGA:", err);
    } finally {
      setConfirming(null);
    }
  };

  const fetchData = useCallback(async (withRefresh = false) => {
    try {
      setError(null);
      if (withRefresh) setRefreshing(true); else setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search.trim()) params.set("search", search.trim());
      const { data } = await api.get(`/api/interviews/dga/my-interviews?${params.toString()}`);
      setInterviews(data?.interviews || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors du chargement");
    } finally { setLoading(false); setRefreshing(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const uniqueCandidates = useMemo(() => new Set(interviews.map(i => i.candidateEmail || i.candidateName)).size, [interviews]);
  const upcoming = useMemo(() => { const now = new Date(); return interviews.filter(i => { const d = i.dgaInterview?.date || i.confirmedDate; return d && new Date(d) >= now; }).length; }, [interviews]);
  const quizDone = useMemo(() => interviews.filter(i => i.quiz).length, [interviews]);

  return (
    <>
      {/* Modal */}
      {selected && <CandidateModal iv={selected} onClose={() => setSelected(null)} handleConfirmDGA={handleConfirmDGA} confirming={confirming} />}

      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">

          {/* En-tête */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-7 h-7 text-amber-500" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Mes Entretiens Direction</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {loading ? "Chargement..." : `${total} entretien${total > 1 ? "s" : ""} · ${uniqueCandidates} candidat${uniqueCandidates > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="Total entretiens"  value={total}            icon={CheckCircle2} colorClass="text-[#4E8F2F] dark:text-emerald-400" />
            <StatCard label="Candidats uniques" value={uniqueCandidates} icon={User}         colorClass="text-[#4E8F2F] dark:text-emerald-400" />
            <StatCard label="À venir"           value={upcoming}         icon={Calendar}     colorClass="text-amber-500 dark:text-amber-400" />
            <StatCard label="Quiz complétés"    value={quizDone}         icon={Award}        colorClass="text-violet-500 dark:text-violet-400" />
          </div>

          {/* Recherche */}
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-[#4E8F2F] flex-shrink-0" />
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Rechercher (nom, email, poste)…"
              className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500" />
            {searchInput && <button type="button" onClick={() => setSearchInput("")} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
            <button type="button" onClick={() => fetchData(true)} className="flex-shrink-0 text-gray-500 hover:text-[#4E8F2F] transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="text-sm font-medium text-gray-500 mb-4">
            {!loading && `${interviews.length} résultat${interviews.length > 1 ? "s" : ""}`}
          </div>

          {/* Tableau */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

            {loading && (
              <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
                <p className="text-sm text-gray-500">Chargement des entretiens...</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-8 h-8 text-red-500" /></div>
                <h2 className="text-xl font-bold">Une erreur est survenue</h2>
                <p className="text-gray-600 max-w-md">{error}</p>
                <button type="button" onClick={() => fetchData(true)} className="px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold text-sm">Réessayer</button>
              </div>
            )}

            {!loading && !error && interviews.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center"><Shield className="w-8 h-8 text-amber-500" /></div>
                <h2 className="text-xl font-bold">Aucun entretien trouvé</h2>
                <p className="text-gray-600">Aucun entretien Direction n'a encore été planifié pour vous.</p>
              </div>
            )}

            {!loading && !error && interviews.length > 0 && (
              <>
                {/* Desktop */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm border-collapse" style={{ minWidth: "1200px" }}>
                    <thead className="bg-amber-50 dark:bg-gray-700 text-amber-700 dark:text-amber-400">
                      <tr>
                        {TABLE_HEADERS.map(h => (
                          <th key={h} className="text-left px-5 py-5 font-extrabold uppercase text-xs tracking-wider whitespace-nowrap border-b border-amber-100 dark:border-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((iv, idx) => {
                        const dga  = iv.dgaInterview;
                        const date = dga?.date || iv.confirmedDate;
                        const time = dga?.time || iv.confirmedTime;
                        const lieu = dga?.location || iv.location;

                        return (
                          <tr key={String(iv._id)}
                            onClick={() => setSelected(iv)}
                            className={`${idx % 2 !== 0 ? "bg-gray-50/60 dark:bg-gray-750/40" : ""} hover:bg-amber-50/40 dark:hover:bg-gray-700/30 transition-colors border-t border-gray-100 dark:border-gray-700/50 cursor-pointer`}>

                            <td className="px-5 py-4 align-middle">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full font-extrabold text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                {(page - 1) * LIMIT + idx + 1}
                              </span>
                            </td>

                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <Avatar name={iv.candidateName} />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-gray-900 dark:text-white truncate max-w-[140px]">{iv.candidateName || "—"}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[140px] flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />{iv.candidateEmail || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">{iv.jobTitle || "—"}</span>
                              </span>
                            </td>

                            <td className="px-5 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />{formatDate(date)}
                              </div>
                            </td>

                            <td className="px-5 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />{formatTime(time)}
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{lieu || "—"}</span>
                              </div>
                            </td>

                            {/* Responsable */}
                            <td className="px-5 py-5">
                              {(iv.responsableName || iv.responsableEmail) ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#E9F5E3] dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                    <UserCheck className="w-3.5 h-3.5 text-[#4E8F2F]" />
                                  </div>
                                  <div className="min-w-0">
                                    {iv.responsableName && <p className="font-semibold text-xs truncate max-w-[120px]">{iv.responsableName}</p>}
                                    {iv.responsableEmail && <p className="text-[11px] text-gray-400 truncate max-w-[120px] flex items-center gap-1"><Mail className="w-2.5 h-2.5 flex-shrink-0" />{iv.responsableEmail}</p>}
                                  </div>
                                </div>
                              ) : <span className="text-xs text-gray-300">—</span>}
                            </td>

                            <td className="px-5 py-5"><DgaBadge /></td>

                            {/* Bouton détails */}
                            <td className="px-4 py-4 align-middle">
                              <div className="flex items-center gap-2">
                                <button type="button"
                                  onClick={e => { e.stopPropagation(); setSelected(iv); }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 hover:border-amber-400 hover:bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-amber-600 transition-colors">
                                  <Eye className="w-3.5 h-3.5" />Voir
                                </button>
                                {iv.dgaConfirmed ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <CheckCircle className="w-3.5 h-3.5" />Confirmé
                                  </span>
                                ) : (
                                  <button type="button"
                                    onClick={e => handleConfirmDGA(e, iv.candidatureId)}
                                    disabled={confirming === iv.candidatureId}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {confirming === iv.candidatureId
                                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    Confirmer
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="grid gap-4 p-4 lg:hidden">
                  {interviews.map((iv) => {
                    const dga  = iv.dgaInterview;
                    const date = dga?.date || iv.confirmedDate;
                    const time = dga?.time || iv.confirmedTime;
                    return (
                      <div key={String(iv._id)} onClick={() => setSelected(iv)}
                        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm cursor-pointer hover:border-amber-300 transition-colors">
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar name={iv.candidateName} />
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-gray-900 dark:text-white truncate">{iv.candidateName || "—"}</p>
                            <p className="text-xs text-gray-500 truncate">{iv.candidateEmail || "—"}</p>
                          </div>
                          <DgaBadge />
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Briefcase className="w-4 h-4 text-gray-400" />{iv.jobTitle || "—"}</div>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="w-4 h-4 text-amber-500" />{formatDate(date)}
                            <Clock className="w-4 h-4 text-gray-400 ml-2" />{formatTime(time)}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 flex items-center gap-1"><Eye className="w-3 h-3" />Voir détails</span>
                            {iv.dgaConfirmed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" />Confirmé
                              </span>
                            ) : (
                              <button type="button"
                                onClick={e => handleConfirmDGA(e, iv.candidatureId)}
                                disabled={confirming === iv.candidatureId}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 disabled:opacity-50 transition-all">
                                {confirming === iv.candidatureId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Confirmer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT}
                  onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}