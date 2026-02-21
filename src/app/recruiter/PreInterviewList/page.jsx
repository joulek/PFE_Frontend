"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewList, sendDocuments } from "../../services/candidature.api";
import { getQuizByJob } from "../../services/quiz.api";
import api from "../../services/api";
import Link from "next/link";

import {
  UserCheck, FileText, Search, Calendar, ArrowLeft,

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
function getCvName(c) { return safeStr(c?.cv?.originalName) || "CV.pdf"; }
function getMatchScore(c) {
  const j = c?.analysis?.jobMatch;
  if (!j) return null;
  const s = j?.score?.score ?? j?.score ?? null;
  if (typeof s !== "number") return null;
  return s > 1 ? s / 100 : s;
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

// ── localStorage pour persister "envoyé" entre refreshes ──
function markSent(id) { try { localStorage.setItem(`docs_sent_${id}`, "1"); } catch { } }
function wasSent(id) { try { return localStorage.getItem(`docs_sent_${id}`) === "1"; } catch { return false; } }

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
        // Charger toutes les fiches
        const fichesRes = await api.get("/fiches");
        setFiches(Array.isArray(fichesRes?.data) ? fichesRes.data : []);

        // Charger quiz lié au job du candidat
        const jobOfferId = candidature?.jobOfferId;
        if (jobOfferId) {
          try {
            const qr = await getQuizByJob(jid.toString());
            const q = qr?.data || null;
            setQuiz(q);
            if (q) setIncludeQuiz(true); // cocher par défaut si quiz existe
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
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

          {/* ✅ État succès */}
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
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${includeQuiz
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-violet-300"
                    }`}>
                    <input
                      type="checkbox"
                      checked={includeQuiz}
                      onChange={(e) => setIncludeQuiz(e.target.checked)}
                      className="mt-0.5 accent-violet-600 w-4 h-4 shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {quiz.jobTitle || "Quiz technique"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {quiz.totalQuestions || 0} questions · ~{Math.ceil((quiz.totalQuestions || 0) * 2)} min
                      </p>
                      {includeQuiz && (
                        <span className="inline-block mt-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                          ✓ Sera inclus dans l'email
                        </span>
                      )}
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucun quiz disponible pour ce poste
                  </div>
                )}
              </div>

              {/* ── FICHE DE RENSEIGNEMENT ── */}
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
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucune fiche disponible
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {/* Option : aucune */}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${!selectedFicheId
                      ? "border-gray-400 bg-gray-50 dark:bg-gray-700"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                      }`}>
                      <input
                        type="radio" name="fiche" value=""
                        checked={!selectedFicheId}
                        onChange={() => setSelectedFicheId("")}
                        className="accent-gray-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-sm text-gray-400 italic">Ne pas envoyer de fiche</span>
                    </label>

                    {fiches.map((fiche) => (
                      <label
                        key={fiche._id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFicheId === fiche._id
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-green-300"
                          }`}
                      >
                        <input
                          type="radio" name="fiche" value={fiche._id}
                          checked={selectedFicheId === fiche._id}
                          onChange={() => setSelectedFicheId(fiche._id)}
                          className="mt-0.5 accent-green-600 w-4 h-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{fiche.title}</p>
                          {fiche.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{fiche.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{fiche.questions?.length || 0} question(s)</p>
                          {selectedFicheId === fiche._id && (
                            <span className="inline-block mt-1 text-xs font-medium text-green-600 dark:text-green-400">✓ Sélectionnée</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Résumé envoi */}
              {(selectedFicheId || (includeQuiz && quiz)) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    Ce qui sera envoyé à {email || "..."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFicheId && (
                      <span className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {fiches.find(f => f._id === selectedFicheId)?.title || "Fiche"}
                      </span>
                    )}
                    {includeQuiz && quiz && (
                      <span className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                        <Brain className="w-3.5 h-3.5" />
                        Quiz : {quiz.jobTitle}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer modal */}
        {!success && !loadingData && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
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


/* ================================================================
   CARD CANDIDAT
================================================================ */
/* ================================================================
   MODAL — Planifier Entretien
================================================================ */
function EntretienModal({ candidate, onClose }) {
  const [step, setStep] = useState("type"); // "type" | "note"
  const [selectedType, setSelectedType] = useState(null);

  const [noteText, setNoteText] = useState("");
  const [stars, setStars] = useState(0);

  const [loadingNote, setLoadingNote] = useState(false);
  const [existingNoteId, setExistingNoteId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  const name = getName(candidate);

  const types = [
    {
      id: "telephonique",
      label: "Entretien Téléphonique",
      icon: PhoneCall,
      color: "from-blue-500 to-cyan-500",
      desc: "Premier contact rapide par téléphone",
    },
    {
      id: "rh",
      label: "Entretien RH",
      icon: Users,
      color: "from-violet-500 to-purple-600",
      desc: "Évaluation RH et motivation",
    },
    {
      id: "rh_technique",
      label: "Entretien RH + Technique",
      icon: UserCog,
      color: "from-orange-500 to-red-500",
      desc: "Entretien complet RH et technique",
    },
  ];

  async function openType(tid) {
    setSelectedType(tid);
    setStep("note");

    // reset UI
    setSaved(false);
    setSaving(false);
    setDeleting(false);

    // load existing note
    setLoadingNote(true);
    try {
      const res = await api.get(
        `/candidatures/${candidate._id}/entretien-note?type=${tid}`
      );
      const n = res?.data?.note || null;

      if (n) {
        setExistingNoteId(n.noteId || null);
        setNoteText(n.note || "");
        setStars(Number(n.stars || 0));
      } else {
        setExistingNoteId(null);
        setNoteText("");
        setStars(0);
      }
    } catch (e) {
      console.error("Erreur chargement note:", e);
      setExistingNoteId(null);
      setNoteText("");
      setStars(0);
    } finally {
      setLoadingNote(false);
    }
  }

  async function handleCreate() {
    if (!noteText.trim() || !selectedType) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await api.post(`/candidatures/${candidate._id}/entretien-note`, {
        type: selectedType,
        note: noteText.trim(),
        stars,
        date: new Date().toISOString(),
      });

      const created = res?.data?.note;
      setExistingNoteId(created?.noteId || null);

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      console.error("Erreur création note:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!noteText.trim() || !existingNoteId || !selectedType) return;
    setSaving(true);
    setSaved(false);

    try {
      await api.patch(
        `/candidatures/${candidate._id}/entretien-note/${existingNoteId}`,
        { type: selectedType, note: noteText.trim(), stars }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      console.error("Erreur update note:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingNoteId) return;

    const ok = confirm("Supprimer cette note ?");
    if (!ok) return;

    setDeleting(true);
    try {
      await api.delete(
        `/candidatures/${candidate._id}/entretien-note/${existingNoteId}`
      );
      // reset
      setExistingNoteId(null);
      setNoteText("");
      setStars(0);
      setStep("type");
    } catch (e) {
      console.error("Erreur suppression note:", e);
    } finally {
      setDeleting(false);
    }
  }

  const selectedTypeObj = types.find((t) => t.id === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-extrabold text-lg">
                {step === "type" ? "Planifier un entretien" : "Note après entretien"}
              </h2>
              <p className="text-blue-200 text-sm mt-0.5">{name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Step 1 */}
        {step === "type" && (
          <div className="p-5 space-y-3">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => openType(t.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group text-left"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Step 2 */}
        {step === "note" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep("type")}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                ← Retour
              </button>

              {existingNoteId && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Mode édition
                </span>
              )}
            </div>

            {/* Type card */}
            {selectedTypeObj && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedTypeObj.color} flex items-center justify-center`}>
                  <selectedTypeObj.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {selectedTypeObj.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}

            {loadingNote ? (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Chargement de la note...</span>
              </div>
            ) : (
              <>
                {/* Note */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Note du recruteur
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Observations, impressions, points à retenir..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {noteText.length} caractères
                  </p>
                </div>

                <NoteStars stars={stars} onChange={setStars} />

                {/* Actions */}
                {!existingNoteId ? (
                  <button
                    onClick={handleCreate}
                    disabled={!noteText.trim() || saving}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      saved
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Note sauvegardée !
                      </>
                    ) : saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...
                      </>
                    ) : (
                      <>
                        <StickyNote className="w-4 h-4" /> Sauvegarder la note
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={!noteText.trim() || saving}
                      className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        saved
                          ? "bg-green-500 text-white col-span-2"
                          : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      {saved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Note mise à jour !
                        </>
                      ) : saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Mise à jour...
                        </>
                      ) : (
                        <>
                          <StickyNote className="w-4 h-4" /> Mettre à jour
                        </>
                      )}
                    </button>

                    {!saved && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="py-3 rounded-xl font-bold text-sm bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Suppression...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" /> Supprimer
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteStars({ stars, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        Appréciation :
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => onChange?.(s)}>
            <Star
              className={`w-5 h-5 transition-colors ${
                s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
function ScheduleInterviewForm({
  candidate,
  type,
  onBack,
  onClose,
  onSaved,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState("visio"); // "visio" | "presentiel"
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewers, setInterviewers] = useState(""); // "nom1, nom2"
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const [saving, setSaving] = useState(false);

  const typeLabel =
    type === "rh"
      ? "Entretien RH"
      : type === "rh_technique"
        ? "Entretien RH + Technique"
        : "Entretien";

  function buildISO() {
    // date: "2026-02-21" , time:"14:30"
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`).toISOString();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const startAt = buildISO();
    if (!startAt) return;

    setSaving(true);
    try {
      // ✅ هنا تحط API route متاعك كي تجهز backend
      // مثال:
      // await api.post(`/candidatures/${candidate._id}/interviews`, {
      //   type,
      //   startAt,
      //   durationMinutes: Number(duration),
      //   mode,
      //   location: mode === "presentiel" ? location : null,
      //   meetingLink: mode === "visio" ? meetingLink : null,
      //   interviewers: interviewers.split(",").map(s => s.trim()).filter(Boolean),
      //   message,
      //   sendEmail,
      // });

      // مؤقت: نخليها fake success
      await new Promise((r) => setTimeout(r, 500));

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("Erreur planification:", err);
      alert("Erreur lors de la planification");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Retour
        </button>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {typeLabel}
        </span>
      </div>

      <div className="space-y-4">
        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Durée (minutes)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {[15, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("visio")}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                mode === "visio"
                  ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              }`}
            >
              Visio
            </button>
            <button
              type="button"
              onClick={() => setMode("presentiel")}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                mode === "presentiel"
                  ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              }`}
            >
              Présentiel
            </button>
          </div>
        </div>

        {/* Location / Link */}
        {mode === "presentiel" ? (
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Lieu
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Optylab - Bureau, étage..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Lien meeting
            </label>
            <input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet... / teams..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        )}

        {/* Interviewers */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Interviewers
          </label>
          <input
            value={interviewers}
            onChange={(e) => setInterviewers(e.target.value)}
            placeholder="Ex: Yosr, Nourhene"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">Sépare par virgule.</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Message au candidat (optionnel)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Instructions, documents, etc..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        {/* Send email */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="rounded"
          />
          Envoyer un email de confirmation
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Planification..." : "Planifier l’entretien"}
        </button>
      </div>
    </form>
  );
}

=======
/* ================= CARD ================= */
>>>>>>> a2c229d38136507a9fd57b1b144c4ada5305149d
function PreInterviewCard({ c, index }) {
  const [sent, setSent] = useState(() => wasSent(c?._id));
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEntretienModal, setShowEntretienModal] = useState(false);

  const name = getName(c);
  const cvUrl = getCvUrl(c);
  const cvName = getCvName(c);
  const score = getMatchScore(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";
  const email = safeStr(c?.email);
  const telephone = safeStr(c?.telephone);
  const selectedAt = c?.preInterview?.selectedAt;
  const recommendation =
    c?.analysis?.jobMatch?.score?.recommendation ??
    c?.analysis?.jobMatch?.recommendation ??
    null;
  const linkedin = safeStr(c?.linkedin || c?.linkedinUrl || c?.linkedIn);
  function handleSuccess() {
    markSent(c._id);
    setSent(true);
  }

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

                <div className="flex flex-wrap gap-3 mt-2">
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
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" />LinkedIn
                    </a>
                  )}
                </div>

                {cvUrl && (
                  <a href={cvUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-green-700 dark:text-emerald-400 hover:text-green-800">
                    <FileText className="w-4 h-4" />Voir CV
                    <span className="text-gray-400 text-xs">({cvName})</span>
                  </a>
                )}
              </div>
            </div>

            {/* Score + Boutons */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Match Score</p>
                <div className={`text-2xl font-extrabold px-3 py-1 rounded-xl ${scoreBg(score)}`}>
                  {pct(score)}
                </div>
                {recommendation && (
                  <p className="text-xs text-gray-400 mt-1 capitalize">{recommendation.replace("_", " ")}</p>
                )}
              </div>

              {selectedAt && (
                <div className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Sélectionné le {formatDate(selectedAt)}
                </div>
              )}

              {/* ── BOUTONS ── */}
<<<<<<< HEAD
              <div className="flex flex-col gap-2 w-full min-w-[190px]">

                {/* 1. Envoyer — disabled si déjà envoyé */}
                {sent ? (
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-semibold w-full cursor-not-allowed select-none">
                    <CheckCircle2 className="w-4 h-4" />
                    Documents envoyés
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-all shadow-sm w-full"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer (fiche / quiz)
                  </button>
                )}

                {/* 2. Planifier entretien */}
                <button
                  onClick={() => setShowEntretienModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm w-full"
                >
                  <Calendar className="w-4 h-4" />
                  Planifier Entretien
                </button>

                {/* 3. Voir les résultats */}
                <Link
                  href={`/recruiter/PreInterviewList/${c._id}/results`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors w-full"
                >
                  <BarChart2 className="w-4 h-4" />
                  Voir les résultats
                </Link>
              </div>
=======
              
>>>>>>> a2c229d38136507a9fd57b1b144c4ada5305149d
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

      {/* Modal */}
      {showSendModal && (
        <SendDocumentsModal
          candidature={c}
          onClose={() => setShowSendModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEntretienModal && (
        <EntretienModal
          candidate={c}
          onClose={() => setShowEntretienModal(false)}
        />
      )}
    </>
  );
}

/* ================================================================
   PAGE PRINCIPALE
================================================================ */
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
      const n = getName(c).toLowerCase();
      const e = safeStr(c?.email).toLowerCase();
      const j = safeStr(c?.jobTitle).toLowerCase();
      return n.includes(q) || e.includes(q) || j.includes(q);
    });
  }, [candidates, search]);

  if (loading) return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-[#F0FAF0]/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-4">
          <a
            href="/recruiter/CandidatureAnalysis"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'analyse candidatures
          </a>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Candidats Pré-sélectionnés</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? "Chargement..."
                    : `${candidates.length} candidat${candidates.length > 1 ? "s" : ""} prêt${candidates.length > 1 ? "s" : ""} pour entretien`}
                </p>
              </div>
            </div>
            {!loading && candidates.length > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                <UserCheck className="w-4 h-4" />
                {candidates.length} pré-sélectionné{candidates.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {!loading && candidates.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-3">
              <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un candidat (nom, email, job)..."
                  className="w-full outline-none text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 pb-10 pt-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Chargement des candidats pré-sélectionnés...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-violet-300 dark:text-violet-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white mb-2">Aucun candidat pré-sélectionné</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Retournez sur la page d'analyse et cliquez sur{" "}
              <span className="font-semibold text-violet-500">Pré-entretien</span>{" "}
              sur les candidats que vous souhaitez retenir.
            </p>
            <a href="/recruiter/CandidatureAnalysis"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />Aller à l'analyse
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
            <p className="text-gray-500">Aucun résultat pour "{search}"</p>
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