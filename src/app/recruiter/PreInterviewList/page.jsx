"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewList, sendDocuments } from "../../services/candidature.api";
import { getQuizByJob } from "../../services/quiz.api";
import api from "../../services/api";

import {
  UserCheck,
  FileText,
  Search,
  Calendar,
  ArrowLeft,
  Mail,
  Phone,
  Linkedin as LinkedinIcon,
  Clock,
  Briefcase,
  Send,
  X,
  CheckCircle2,
  Brain,
  ClipboardList,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= OPTYLAB THEME (inline) ================= */
const OPTY = {
  primary: "#6DB33F",
  primaryHover: "#5EA735",
  mintBg: "#F0FAF0",
  mintSoft: "#EAF7EF",
  mintBorder: "#D6EEDD",
  mintText: "#2E6B3A",
};

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}

function pct(score) {
  if (typeof score !== "number") return "—";
  const val = score > 1 ? score : score * 100;
  return `${Math.round(val)}%`;
}

function getName(c) {
  const fullName = safeStr(c?.fullName);
  if (fullName) return fullName;
  const combined = `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();
  if (combined) return combined;
  return safeStr(c?.email) || "Candidat";
}

function getCvUrl(c) {
  const fileUrl = safeStr(c?.cv?.fileUrl);
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}

function getMatchScore(c) {
  const jobMatch = c?.analysis?.jobMatch;
  if (!jobMatch) return null;
  const score = jobMatch?.score?.score ?? jobMatch?.score ?? null;
  if (typeof score !== "number") return null;
  return score > 1 ? score / 100 : score;
}

function scoreBg(s) {
  if (s === null) return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300";
  if (s >= 0.75) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-300";
  if (s >= 0.45) return "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-300";
  return "bg-rose-100 text-rose-800 dark:bg-rose-900/25 dark:text-rose-300";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ================================================================
   MODAL — Envoyer Fiche + Quiz
================================================================ */
function SendDocumentsModal({ candidature, onClose, onSuccess }) {
  const [fiches, setFiches] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedFicheId, setSelectedFicheId] = useState("");
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [email, setEmail] = useState(safeStr(candidature?.email));

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const name = getName(candidature);

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const fichesRes = await api.get("/fiches");
        setFiches(Array.isArray(fichesRes?.data) ? fichesRes.data : []);

        const jobOfferId = candidature?.jobOfferId;
        if (jobOfferId) {
          try {
            const quizRes = await getQuizByJob(jobOfferId.toString());
            const q = quizRes?.data || null;
            setQuiz(q);
            if (q) setIncludeQuiz(true);
          } catch {
            setQuiz(null);
          }
        }
      } catch (e) {
        console.error("Erreur chargement modal:", e?.message);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [candidature]);

  const canSend = email.trim() && (selectedFicheId || includeQuiz) && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      const res = await sendDocuments(candidature._id, {
        ficheId: selectedFicheId || undefined,
        includeQuiz,
        email: email.trim(),
      });
      setSuccess({ sentFiche: res.data?.sentFiche, sentQuiz: res.data?.sentQuiz });
      onSuccess?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: OPTY.mintSoft, color: OPTY.mintText }}
              >
                <Send className="w-4 h-4" />
              </span>
              Envoyer des documents
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              à <span className="font-semibold text-slate-700 dark:text-slate-200">{name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/25 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Envoyé avec succès !</h3>

              <div className="flex gap-2 flex-wrap justify-center">
                {success.sentFiche && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium">
                    <ClipboardList className="w-4 h-4" /> Fiche envoyée
                  </span>
                )}
                {success.sentQuiz && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    bg-[#EAF7EF] dark:bg-emerald-900/15 text-[#2E6B3A] dark:text-emerald-300"
                  >
                    <Brain className="w-4 h-4" /> Quiz envoyé
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-400">
                Email envoyé à <strong className="text-slate-600 dark:text-slate-200">{email}</strong>
              </p>

              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-colors"
                style={{ background: OPTY.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.background = OPTY.primaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = OPTY.primary)}
              >
                Fermer
              </button>
            </div>
          ) : loadingData ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement des données...</span>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1.5 text-slate-400" />
                  Email du candidat
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidat@email.com"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition
                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    border border-slate-200 dark:border-slate-700
                    focus:ring-2"
                  style={{ boxShadow: "none" }}
                />
              </div>

              {/* Quiz */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: OPTY.mintSoft, color: OPTY.mintText }}
                  >
                    <Brain className="w-4 h-4" />
                  </span>
                  Quiz technique
                </p>

                {quiz ? (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${includeQuiz
                      ? "bg-[#EAF7EF] dark:bg-emerald-900/15"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    style={includeQuiz ? { borderColor: OPTY.mintBorder } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={includeQuiz}
                      onChange={(e) => setIncludeQuiz(e.target.checked)}
                      className="mt-0.5 w-4 h-4 shrink-0"
                      style={{ accentColor: OPTY.primary }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {quiz.jobTitle || "Quiz technique"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {quiz.totalQuestions || 0} questions · ~{Math.ceil((quiz.totalQuestions || 0) * 2)} min
                      </p>
                      {includeQuiz && (
                        <span className="inline-block mt-1.5 text-xs font-medium" style={{ color: OPTY.mintText }}>
                          ✓ Sera inclus dans l'email
                        </span>
                      )}
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucun quiz disponible pour ce poste ({safeStr(candidature?.jobTitle) || "—"})
                  </div>
                )}
              </div>

              {/* Fiche */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: OPTY.mintSoft, color: OPTY.mintText }}
                  >
                    <ClipboardList className="w-4 h-4" />
                  </span>
                  Fiche de renseignement
                </p>

                {fiches.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucune fiche disponible
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${!selectedFicheId
                        ? "border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="fiche"
                        value=""
                        checked={!selectedFicheId}
                        onChange={() => setSelectedFicheId("")}
                        className="w-4 h-4 shrink-0"
                      />
                      <span className="text-sm text-slate-400 italic">Ne pas envoyer de fiche</span>
                    </label>

                    {fiches.map((fiche) => (
                      <label
                        key={fiche._id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFicheId === fiche._id
                          ? "bg-[#EAF7EF] dark:bg-emerald-900/15"
                          : "border-slate-200 dark:border-slate-700 hover:border-[#D6EEDD]"
                          }`}
                        style={selectedFicheId === fiche._id ? { borderColor: OPTY.mintBorder } : undefined}
                      >
                        <input
                          type="radio"
                          name="fiche"
                          value={fiche._id}
                          checked={selectedFicheId === fiche._id}
                          onChange={() => setSelectedFicheId(fiche._id)}
                          className="mt-0.5 w-4 h-4 shrink-0"
                          style={{ accentColor: OPTY.primary }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{fiche.title}</p>
                          {fiche.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{fiche.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">{fiche.questions?.length || 0} question(s)</p>
                          {selectedFicheId === fiche._id && (
                            <span className="inline-block mt-1 text-xs font-medium" style={{ color: OPTY.mintText }}>
                              ✓ Sélectionnée
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Résumé */}
              {(selectedFicheId || (includeQuiz && quiz)) && (
                <div className="rounded-xl px-4 py-3 border" style={{ background: OPTY.mintSoft, borderColor: OPTY.mintBorder }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: OPTY.mintText }}>
                    Ce qui sera envoyé à {email || "..."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFicheId && (
                      <span
                        className="inline-flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border px-2.5 py-1 rounded-full font-medium"
                        style={{ borderColor: OPTY.mintBorder, color: OPTY.mintText }}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        {fiches.find((f) => f._id === selectedFicheId)?.title || "Fiche"}
                      </span>
                    )}
                    {includeQuiz && quiz && (
                      <span
                        className="inline-flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border px-2.5 py-1 rounded-full font-medium"
                        style={{ borderColor: OPTY.mintBorder, color: OPTY.mintText }}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        Quiz : {quiz.jobTitle}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-700 rounded-xl text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !loadingData && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors
              border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200
              hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm
              disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: OPTY.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.background = OPTY.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = OPTY.primary)}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Envoi en cours..." : "Envoyer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= CARD (ORGANISÉE, PAS DE BARRE VERTE EN HAUT) ================= */
function PreInterviewCard({ c, index }) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [sent, setSent] = useState(false);

  const name = getName(c);
  const cvUrl = getCvUrl(c);
  const cvName = getCvName(c);
  const score = getMatchScore(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";
  const email = safeStr(c?.email);
  const telephone = safeStr(c?.telephone);
  const linkedin = safeStr(c?.linkedin);
  const selectedAt = c?.preInterview?.selectedAt;

  const recommendation =
    c?.analysis?.jobMatch?.score?.recommendation ??
    c?.analysis?.jobMatch?.recommendation ??
    null;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* BODY */}
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* LEFT: Infos candidat */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl"
                  style={{ background: OPTY.mintSoft, color: OPTY.mintText }}
                >
                  {name?.[0]?.toUpperCase() || "C"}
                </div>
                <span
                  className="absolute -top-1 -left-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow"
                  style={{ background: OPTY.primary }}
                >
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">{name}</h2>

                <div className="flex items-center gap-1.5 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{jobTitle}</p>
                </div>

                {/* Contacts + CV en mini-cards */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-slate-800"
                      style={{ borderColor: OPTY.mintBorder, color: OPTY.mintText }}
                      title={email}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{email}</span>
                    </a>
                  )}

                  {telephone && (
                    <div
                      className="inline-flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      style={{ borderColor: OPTY.mintBorder }}
                      title={telephone}
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{telephone}</span>
                    </div>
                  )}

                  {linkedin && (
                    <a
                      href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-slate-800 hover:opacity-90"
                      style={{ borderColor: OPTY.mintBorder, color: OPTY.mintText }}
                    >
                      <LinkedinIcon className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}

                  {cvUrl && (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-slate-800 hover:opacity-90"
                      style={{ borderColor: OPTY.mintBorder, color: OPTY.mintText }}
                      title={cvName}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="truncate">Voir CV</span>
                      <span className="text-slate-400">({cvName})</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Score + Statut */}
            <div className="shrink-0 w-full md:w-[220px]">
              <div className="rounded-2xl border bg-white dark:bg-slate-800 p-4" style={{ borderColor: OPTY.mintBorder }}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Match score</p>

                <div className="flex items-end justify-between gap-3">
                  <div className={`text-2xl font-extrabold px-3 py-1 rounded-xl ${scoreBg(score)}`}>
                    {pct(score)}
                  </div>
                  <span className="text-xs text-slate-400 text-right">
                    {recommendation ? recommendation.replaceAll("_", " ") : ""}
                  </span>
                </div>

                {selectedAt && (
                  <div
                    className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border w-full"
                    style={{
                      background: OPTY.mintSoft,
                      borderColor: OPTY.mintBorder,
                      color: OPTY.mintText,
                    }}
                  >
                    <Clock className="w-4 h-4" />
                    Sélectionné le {formatDate(selectedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div
          className="px-5 py-4 border-t flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end bg-white dark:bg-slate-900"
          style={{ borderColor: OPTY.mintBorder }}
        >
          <button
            onClick={() => setShowSendModal(true)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border ${sent
              ? "bg-emerald-100 dark:bg-emerald-900/25 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "text-white border-transparent"
              }`}
            style={sent ? undefined : { background: OPTY.primary }}
            onMouseEnter={(e) => {
              if (!sent) e.currentTarget.style.background = OPTY.primaryHover;
            }}
            onMouseLeave={(e) => {
              if (!sent) e.currentTarget.style.background = OPTY.primary;
            }}
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Documents envoyés
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer (fiche / quiz)
              </>
            )}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border hover:shadow-sm"
            style={{
              borderColor: OPTY.mintBorder,
              color: OPTY.mintText,
              background: "white",
            }}
          >
            <Calendar className="w-4 h-4" />
            Planifier entretien
          </button>
        </div>
      </div>

      {showSendModal && (
        <SendDocumentsModal
          candidature={c}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setSent(true)}
        />
      )}
    </>
  );
}

/* ================= PAGE ================= */
export default function PreInterviewListPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getPreInterviewList();
        setCandidates(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        console.error("Erreur chargement pré-entretien:", e?.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const name = getName(c).toLowerCase();
      const email = safeStr(c?.email).toLowerCase();
      const job = safeStr(c?.jobTitle).toLowerCase();
      return name.includes(q) || email.includes(q) || job.includes(q);
    });
  }, [candidates, search]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#F0FAF0] dark:bg-[#0B1220]">      {/* Header sticky */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-[#F0FAF0]/90 dark:bg-[#0B1220]/90">        <div className="max-w-5xl mx-auto px-6 pt-5 pb-4">
        <a
          href="/recruiter/CandidatureAnalysis"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'analyse candidatures
        </a>

        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: OPTY.mintSoft }}>
              <UserCheck className="w-5 h-5" style={{ color: OPTY.mintText }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Candidats Pré-sélectionnés
              </h1>              <p className="text-sm text-slate-500">
                {loading
                  ? "Chargement..."
                  : `${candidates.length} candidat${candidates.length > 1 ? "s" : ""} prêt${candidates.length > 1 ? "s" : ""} pour entretien`}
              </p>
            </div>
          </div>

          {!loading && candidates.length > 0 && (
            <div
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-sm"
              style={{ background: OPTY.primary }}
            >
              <UserCheck className="w-4 h-4" />
              {candidates.length} pré-sélectionné{candidates.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {!loading && candidates.length > 0 && (
          <div className="bg-white dark:bg-[#0F1A2F] rounded-2xl border shadow-sm p-3 border-[#D6EEDD] dark:border-slate-800">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-white dark:bg-[#0B1220] border-[#D6EEDD] dark:border-slate-700">            <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un candidat (nom, email, job)..."
                className="w-full outline-none text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-10 pt-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center border" style={{ borderColor: OPTY.mintBorder }}>
            <div
              className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: `${OPTY.mintBorder}`, borderTopColor: OPTY.primary }}
            />
            <p className="text-slate-500">Chargement des candidats pré-sélectionnés...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm p-16 text-center" style={{ borderColor: OPTY.mintBorder }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: OPTY.mintSoft }}
            >
              <UserCheck className="w-8 h-8" style={{ color: OPTY.mintText }} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Aucun candidat pré-sélectionné</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Retournez sur la page d'analyse et cliquez sur{" "}
              <span className="font-semibold" style={{ color: OPTY.mintText }}>
                Pré-entretien
              </span>{" "}
              sur les candidats que vous souhaitez retenir.
            </p>
            <a
              href="/recruiter/CandidatureAnalysis"
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-full font-semibold text-sm transition-colors"
              style={{ background: OPTY.primary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Aller à l'analyse
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: OPTY.mintBorder }}>
            <p className="text-slate-500">Aucun résultat pour "{search}"</p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filtered.map((c, i) => (
              <PreInterviewCard key={c._id} c={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}