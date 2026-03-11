"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewNordList, sendDocuments } from "../../services/candidature.api";
import { getQuizByJob } from "../../services/quiz.api";
import api from "../../services/api";
import Link from "next/link";

import {
  UserCheck,
  FileText,
  Search,
  Calendar,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Briefcase,
  Send,
  X,
  CheckCircle2,
  Brain,
  ClipboardList,
  AlertCircle,
  Loader2,
  BarChart2,
  PhoneCall,
  Users,
  Star,
  ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
  const f = safeStr(c?.fullName);
  if (f) return f;
  const b = `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();
  return b || safeStr(c?.email) || "Candidat";
}
function getCvUrl(c) {
  const u = safeStr(c?.cv?.fileUrl);
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}
function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}
function getMatchScore(c) {
  const j = c?.analysis?.jobMatch;
  if (!j) return null;
  const s = j?.score?.score ?? j?.score ?? null;
  if (typeof s !== "number") return null;
  return s > 1 ? s / 100 : s;
}
function scoreBg(s) {
  if (s === null) return "bg-gray-100 text-gray-500";
  if (s >= 0.75) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s >= 0.45) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── localStorage pour persister "envoyé" entre refreshes ──
function markSentFiche(id) {
  try { localStorage.setItem(`fiche_sent_${id}`, "1"); } catch { }
}
function wasSentFiche(id) {
  try { return localStorage.getItem(`fiche_sent_${id}`) === "1"; } catch { return false; }
}
function markSentQuiz(id) {
  try { localStorage.setItem(`quiz_sent_${id}`, "1"); } catch { }
}
function wasSentQuiz(id) {
  try { return localStorage.getItem(`quiz_sent_${id}`) === "1"; } catch { return false; }
}
function markSent(id) {
  try { localStorage.setItem(`docs_sent_${id}`, "1"); } catch { }
}
function wasSent(id) {
  try { return localStorage.getItem(`docs_sent_${id}`) === "1"; } catch { return false; }
}

/* ================================================================
   MODAL — Envoyer Fiche + Quiz
================================================================ */
function SendDocumentsModal({ candidature, onClose, onSuccess, initialSentFiche = false, initialSentQuiz = false }) {
  const [fiches, setFiches] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFicheId, setSelectedFicheId] = useState("");
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [email, setEmail] = useState(safeStr(candidature?.email));
  const [sending, setSending] = useState(false);
  const [sentFiche, setSentFiche] = useState(initialSentFiche);
  const [sentQuiz, setSentQuiz] = useState(initialSentQuiz);
  const [error, setError] = useState("");
  const name = getName(candidature);

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const fr = await api.get("/fiches");
        setFiches(Array.isArray(fr?.data) ? fr.data : []);
        const jid = candidature?.jobOfferId;
        if (jid) {
          try {
            const qr = await getQuizByJob(jid.toString());
            const q = qr?.data || null;
            setQuiz(q);
            if (q && !initialSentQuiz) setIncludeQuiz(true);
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
  }, [candidature, initialSentQuiz]);

  const canSend = email.trim() && (selectedFicheId || includeQuiz) && !sending && !(sentFiche && sentQuiz);
  const allSent = sentFiche && sentQuiz;

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

      let justSentFiche = false;
      let justSentQuiz = false;

      if (res.data?.sentFiche && !sentFiche) {
        setSentFiche(true);
        justSentFiche = true;
      }
      if (res.data?.sentQuiz && !sentQuiz) {
        setSentQuiz(true);
        justSentQuiz = true;
      }

      onSuccess?.(justSentFiche, justSentQuiz);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-green-50/60 dark:bg-green-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Envoyer des documents
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                à <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {allSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Tout envoyé !</h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {sentFiche && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <ClipboardList className="w-4 h-4" /> Fiche envoyée
                  </span>
                )}
                {sentQuiz && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <Brain className="w-4 h-4" /> Quiz envoyé
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Email envoyé à <strong>{email}</strong>
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : loadingData ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement des données...</span>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Email du candidat
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidat@email.com"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Quiz */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Brain className="w-4 h-4 inline mr-1.5 text-green-600" />
                  Quiz technique
                </p>
                {quiz ? (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      sentQuiz
                        ? "border-green-500 bg-green-50/60 dark:bg-green-900/20 opacity-60 cursor-not-allowed"
                        : includeQuiz
                          ? "border-green-500 bg-green-50/60 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={includeQuiz}
                      onChange={(e) => setIncludeQuiz(e.target.checked)}
                      disabled={sentQuiz}
                      className="mt-0.5 accent-green-600 w-4 h-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {quiz.jobTitle || "Quiz technique"}
                        </p>
                        {sentQuiz && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Envoyé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {quiz.totalQuestions || 0} questions · ~{Math.ceil((quiz.totalQuestions || 0) * 2)} min
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucun quiz disponible pour ce poste
                  </div>
                )}
              </div>

              {/* Fiches */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-1.5 text-green-600" />
                  Fiche de renseignement
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      !selectedFicheId
                        ? "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fiche"
                      value=""
                      checked={!selectedFicheId}
                      onChange={() => setSelectedFicheId("")}
                      disabled={sentFiche}
                      className="w-4 h-4 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ne pas envoyer de fiche</span>
                  </label>
                  {fiches.map((f) => (
                    <label
                      key={f._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        sentFiche
                          ? "border-green-500 bg-green-50/60 dark:bg-green-900/20 opacity-60 cursor-not-allowed"
                          : selectedFicheId === f._id
                            ? "border-green-500 bg-green-50/60 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fiche"
                        value={f._id}
                        checked={selectedFicheId === f._id}
                        onChange={() => setSelectedFicheId(f._id)}
                        disabled={sentFiche}
                        className="mt-0.5 accent-green-600 w-4 h-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{f.title}</p>
                          {sentFiche && selectedFicheId === f._id && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Envoyée
                            </span>
                          )}
                        </div>
                        {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{f.questions?.length || 0} questions</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Résumé */}
              {(selectedFicheId || includeQuiz) && !allSent && (
                <div className="bg-green-50/60 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 text-sm text-green-700 dark:text-green-300">
                  Sera envoyé :{" "}
                  {[includeQuiz && !sentQuiz && "Quiz technique", selectedFicheId && !sentFiche && "Fiche de renseignement"]
                    .filter(Boolean)
                    .join(" + ")}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Envoi en cours..." : "Envoyer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MODAL — Planifier Entretien (2 flows)
================================================================ */

// ── Flow 1: Téléphonique — confirmation directe ──────────────────────────
function TelephoniqueFlow({ candidate, onBack, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const name =
    candidate?.fullName ||
    `${candidate?.prenom || ""} ${candidate?.nom || ""}`.trim() ||
    "Candidat";
  const email = safeStr(candidate?.email) || "Email non renseigné";
  const phone =
    safeStr(candidate?.telephone) ||
    safeStr(candidate?.phone) ||
    safeStr(candidate?.personalInfoForm?.telephone) ||
    safeStr(candidate?.personalInfoForm?.phone) ||
    safeStr(candidate?.extracted?.parsed?.telephone) ||
    safeStr(candidate?.extracted?.parsed?.phone) ||
    "Téléphone non renseigné";
  const jobTitle = safeStr(candidate?.jobTitle) || "Poste non renseigné";

  async function confirmInterview() {
    setConfirming(true);
    setError("");
    try {
      // ✅ FIX : bonne route backend
      await api.patch(`/api/interviewNord/confirm-telephonique/${candidate._id}`);
      setDone(true);
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      console.error("confirmInterview error:", e?.response?.status, e?.response?.data);
      const msg = e?.response?.data?.error || e?.response?.data?.message || "Erreur lors de la confirmation. Réessayez.";
      setError(msg);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="p-5">
      <button
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4"
      >
        ← Retour
      </button>

      {/* Header entretien */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            Entretien Téléphonique
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Fiche candidat */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-extrabold text-sm flex-shrink-0">
            {name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-gray-800 dark:text-white truncate">{name}</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 break-all">
                <Mail className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 break-all">
                <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Briefcase className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="truncate">{jobTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Succès */}
      {done && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Entretien téléphonique confirmé avec succès !
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Bouton valider */}
      <button
        onClick={confirmInterview}
        disabled={confirming || done}
        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {confirming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : done ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        {done ? "Entretien confirmé !" : confirming ? "Confirmation..." : "Valider l'entretien"}
      </button>
    </div>
  );
}
// ── Flow 2: Entretien RH ──────────────────────────
function RHFlow({ candidate, onBack, onClose }) {
  const name =
    candidate?.fullName || `${candidate?.prenom || ""} ${candidate?.nom || ""}`.trim() || "Candidat";
  const email = candidate?.email || "";
  const jobTitle = candidate?.jobTitle || "";
  const candidId = candidate?._id || "";

  function openCalendar() {
    const params = new URLSearchParams({
      newEvent: "1",
      type: "entretien_rh",
      candidateName: name,
      candidateEmail: email,
      jobTitle,
      candidatureId: candidId,
    });
    onClose();
    window.location.href = `/Responsable_RH_Nord/calendar?${params.toString()}`;
  }

  return (
    <div className="p-5">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4">
        ← Retour
      </button>

      <div className="flex items-center gap-3 mb-6 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Entretien RH</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Planifier depuis votre calendrier Google</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm flex-shrink-0">
            {name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{name}</p>
            {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
          </div>
        </div>
        {jobTitle && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pl-10">
            <Briefcase className="w-3 h-3" />
            <span className="truncate">{jobTitle}</span>
          </div>
        )}
      </div>

      <div className="mb-6 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
          Vous allez être redirigé vers votre <strong>calendrier Google</strong> pour créer l&apos;événement directement.
          <span className="mt-1 block text-green-700/70 dark:text-green-300/70">
            Le formulaire sera pré-rempli avec les informations du candidat. Une fois l&apos;entretien créé, un email sera envoyé automatiquement.
          </span>
        </p>
      </div>

      <button
        onClick={openCalendar}
        className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4" />
        Ouvrir le calendrier &amp; Créer l&apos;entretien
      </button>
    </div>
  );
}

// ── Wrapper Modal principal ─────────────────────────────────────
function EntretienModal({ candidate, onClose, onRHScheduled }) {
  const [step, setStep] = useState("type");
  const name = getName(candidate);

  const types = [
    { id: "telephonique", label: "Entretien Téléphonique", icon: PhoneCall, desc: "Valider l'entretien téléphonique" },
    { id: "rh", label: "Entretien RH", icon: Users, desc: "Planifier + email candidat" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-5 bg-green-50/60 dark:bg-green-900/10 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-gray-900 dark:text-white font-extrabold text-lg truncate">Planifier un entretien</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">{name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {step === "type" && (
          <div className="p-5 space-y-3">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setStep(t.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/60 dark:hover:bg-green-900/10 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 dark:text-white text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {step === "telephonique" && (
          <TelephoniqueFlow
            candidate={candidate}
            onBack={() => setStep("type")}
            onClose={onClose}
          />
        )}
        {step === "rh" && (
          <RHFlow
            candidate={candidate}
            onBack={() => setStep("type")}
            onClose={onClose}
            onScheduled={onRHScheduled}
          />
        )}
      </div>
    </div>
  );
}

function NoteStars({ note }) {
  const [stars, setStars] = useState(0);
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appréciation :</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setStars(s)}>
            <Star
              className={`w-5 h-5 transition-colors ${s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   TABLE ROW — ligne de candidat (modals gérés dans la page parente)
================================================================ */
function PreInterviewRow({ c, index, onOpenSendModal, onOpenEntretienModal }) {
  const sentFiche = wasSentFiche(c._id);
  const sentQuiz = wasSentQuiz(c._id);

  const name = getName(c);
  const cvUrl = getCvUrl(c);
  const score = getMatchScore(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";
  const email = safeStr(c?.email);
  const selectedAt = c?.preInterviewNord?.selectedAt;

  const allSent = sentFiche && sentQuiz;
  const anySent = sentFiche || sentQuiz;

  function getDocumentsBadge() {
    if (allSent) return <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Envoyés</span>;
    if (sentFiche) return <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> Fiche ✓</span>;
    if (sentQuiz) return <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> Quiz ✓</span>;
    return <span className="text-xs text-gray-400">Aucun</span>;
  }

  function getSendButton() {
    if (allSent) return null;
    const label = sentFiche && !sentQuiz ? "Envoyer Quiz"
      : sentQuiz && !sentFiche ? "Envoyer Fiche"
        : "Envoyer Fiche / Quiz";
    const color = anySent ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700";
    return (
      <button
        onClick={() => onOpenSendModal(c)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${color} text-white text-xs font-semibold transition whitespace-nowrap`}
      >
        <Send className="w-3.5 h-3.5" />
        {label}
      </button>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors">
      {/* CANDIDAT */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-extrabold text-base">
              {name?.[0]?.toUpperCase() || "C"}
            </div>
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
              {index + 1}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{name}</p>
            {email && (
              <a href={`mailto:${email}`} className="text-xs text-blue-500 hover:underline truncate block">{email}</a>
            )}
          </div>
        </div>
      </td>

      {/* POSTE */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate max-w-[180px]">{jobTitle}</span>
        </div>
      </td>

      {/* CV */}
      <td className="px-4 py-4">
        {cvUrl ? (
          <a href={cvUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-green-400 hover:text-green-700 transition">
            <FileText className="w-3.5 h-3.5" />
            Voir CV
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* SCORE */}
      <td className="px-4 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold ${scoreBg(score)}`}>
          {pct(score)}
        </span>
      </td>

      {/* SÉLECTIONNÉ LE */}
      <td className="px-4 py-4">
        {selectedAt ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-green-500 shrink-0" />
            {formatDate(selectedAt)}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* DOCUMENTS */}
      <td className="px-4 py-4">{getDocumentsBadge()}</td>

      {/* ACTIONS */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex items-center gap-1.5">
            {getSendButton()}
            <button
              onClick={() => onOpenEntretienModal(c)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              Planifier
            </button>
          </div>
          <Link
            href={`/Responsable_RH_Nord/PreInterviewList/${c._id}/results`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition whitespace-nowrap"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Résultats
          </Link>
        </div>
      </td>
    </tr>
  );
}

/* ================================================================
   PAGE PRINCIPALE
================================================================ */

const LS_PREINTERVIEW_KEY = "preinterview_candidates_list";

function getStoredCandidates() {
  try {
    const raw = localStorage.getItem(LS_PREINTERVIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStoredCandidates(candidates) {
  try {
    localStorage.setItem(LS_PREINTERVIEW_KEY, JSON.stringify(candidates));
  } catch { }
}

export default function PreInterviewListPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [sendModalCandidate, setSendModalCandidate] = useState(null);
  const [entretienModalCandidate, setEntretienModalCandidate] = useState(null);
  const [sentMap, setSentMap] = useState({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const stored = getStoredCandidates();
        if (stored && stored.length > 0) {
          setCandidates(stored);
          setLoading(false);
        }
        const res = await getPreInterviewNordList();
        const fresh = Array.isArray(res?.data) ? res.data : [];
        if (stored && stored.length > 0) {
          const storedIds = new Set(stored.map((c) => c._id));
          const newFromApi = fresh.filter((c) => !storedIds.has(c._id));
          const updated = stored.map((c) => {
            const fromApi = fresh.find((f) => f._id === c._id);
            if (fromApi) return { ...fromApi, preInterviewNord: { ...fromApi.preInterviewNord, status: "SELECTED" } };
            return c;
          });
          const merged = [...updated, ...newFromApi];
          setCandidates(merged);
          saveStoredCandidates(merged);
        } else {
          setCandidates(fresh);
          saveStoredCandidates(fresh);
        }
      } catch (e) {
        console.error("Erreur chargement pré-entretien:", e?.message);
        const stored = getStoredCandidates();
        if (stored) setCandidates(stored);
        else setCandidates([]);
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
      const n = getName(c).toLowerCase();
      const e = safeStr(c?.email).toLowerCase();
      const j = safeStr(c?.jobTitle).toLowerCase();
      return n.includes(q) || e.includes(q) || j.includes(q);
    });
  }, [candidates, search]);

  function handleModalSuccess(candidateId, justSentFiche, justSentQuiz) {
    setSentMap((prev) => {
      const cur = prev[candidateId] || {};
      const next = {
        sentFiche: cur.sentFiche || justSentFiche,
        sentQuiz: cur.sentQuiz || justSentQuiz,
      };
      if (next.sentFiche) markSentFiche(candidateId);
      if (next.sentQuiz) markSentQuiz(candidateId);
      if (next.sentFiche && next.sentQuiz) markSent(candidateId);
      return { ...prev, [candidateId]: next };
    });
    setSendModalCandidate(null);
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              Candidats Pré-sélectionnés
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {candidates.length} candidat{candidates.length > 1 ? "s" : ""} prêt{candidates.length > 1 ? "s" : ""} pour entretien
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, poste)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400 transition-colors"
            />
          </div>
        </div>

        {/* Tableau */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "Aucun candidat trouvé" : "Aucun candidat pré-sélectionné"}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Candidat</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Poste</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">CV</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Sélectionné le</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <PreInterviewRow
                      key={c._id}
                      c={c}
                      index={i}
                      onOpenSendModal={setSendModalCandidate}
                      onOpenEntretienModal={setEntretienModalCandidate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
              {filtered.length} candidat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS EN DEHORS DU TABLEAU ── */}
      {sendModalCandidate && (
        <SendDocumentsModal
          candidature={sendModalCandidate}
          onClose={() => setSendModalCandidate(null)}
          onSuccess={(justSentFiche, justSentQuiz) =>
            handleModalSuccess(sendModalCandidate._id, justSentFiche, justSentQuiz)
          }
          initialSentFiche={wasSentFiche(sendModalCandidate._id)}
          initialSentQuiz={wasSentQuiz(sendModalCandidate._id)}
        />
      )}
      {entretienModalCandidate && (
        <EntretienModal
          candidate={entretienModalCandidate}
          onClose={() => setEntretienModalCandidate(null)}
          onRHScheduled={() => setEntretienModalCandidate(null)}
        />
      )}
    </div>
  );
}