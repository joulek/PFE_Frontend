"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewList, sendDocuments } from "../../services/candidature.api";
import { getQuizByJob } from "../../services/quiz.api";
import api from "../../services/api";
import Link from "next/link";

import {
  UserCheck, FileText, Search, Calendar, ArrowLeft,
  Mail, Phone, Clock, Briefcase, Send, X, CheckCircle2,
  Brain, ClipboardList, AlertCircle, Loader2, BarChart2,
  PhoneCall, Users, UserCog, Star, ChevronRight, StickyNote,
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
function getCvName(c) { return safeStr(c?.cv?.originalName) || "CV.pdf"; }
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
function markSent(id) { try { localStorage.setItem(`docs_sent_${id}`, "1"); } catch {} }
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
        const fr = await api.get("/fiches");
        setFiches(Array.isArray(fr?.data) ? fr.data : []);
        const jid = candidature?.jobOfferId;
        if (jid) {
          try {
            const qr = await getQuizByJob(jid.toString());
            const q = qr?.data || null;
            setQuiz(q);
            if (q) setIncludeQuiz(true);
          } catch { setQuiz(null); }
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
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-violet-500" />
              Envoyer des documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              à <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Succès */}
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Envoyé avec succès !</h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {success.sentFiche && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <ClipboardList className="w-4 h-4" /> Fiche envoyée
                  </span>
                )}
                {success.sentQuiz && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full text-sm font-medium">
                    <Brain className="w-4 h-4" /> Quiz envoyé
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">Email envoyé à <strong>{email}</strong></p>
              <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-sm transition-colors">
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              {/* Quiz */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Brain className="w-4 h-4 inline mr-1.5 text-violet-500" />
                  Quiz technique
                </p>
                {quiz ? (
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    includeQuiz
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-violet-300"
                  }`}>
                    <input type="checkbox" checked={includeQuiz} onChange={(e) => setIncludeQuiz(e.target.checked)}
                      className="mt-0.5 accent-violet-600 w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{quiz.jobTitle || "Quiz technique"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {quiz.totalQuestions || 0} questions · ~{Math.ceil((quiz.totalQuestions || 0) * 2)} min
                      </p>
                      {includeQuiz && <span className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-1 inline-block">✓ Sera inclus</span>}
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
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    !selectedFicheId ? "border-gray-400 bg-gray-50 dark:bg-gray-700" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="fiche" value="" checked={!selectedFicheId}
                      onChange={() => setSelectedFicheId("")} className="w-4 h-4" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ne pas envoyer de fiche</span>
                  </label>
                  {fiches.map((f) => (
                    <label key={f._id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedFicheId === f._id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-green-300"
                    }`}>
                      <input type="radio" name="fiche" value={f._id} checked={selectedFicheId === f._id}
                        onChange={() => setSelectedFicheId(f._id)} className="mt-0.5 accent-green-600 w-4 h-4 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{f.title}</p>
                        {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{f.questions?.length || 0} questions</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              {/* Résumé */}
              {(selectedFicheId || includeQuiz) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
                  Sera envoyé : {[includeQuiz && "Quiz technique", selectedFicheId && "Fiche de renseignement"].filter(Boolean).join(" + ")}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    c?.analysis?.jobMatch?.recommendation ?? null;

  function handleSuccess() {
    markSent(c._id);
    setSent(true);
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">

            {/* Avatar + Infos */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-300 font-extrabold text-xl">
                  {name?.[0]?.toUpperCase() || "C"}
                </div>
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">{name}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{jobTitle}</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {email && (
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      <Mail className="w-3.5 h-3.5" />{email}
                    </a>
                  )}
                  {telephone && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5" />{telephone}
                    </span>
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
              {/* Match Score */}
              <div className="text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Match Score</p>
                <div className={`text-2xl font-extrabold px-3 py-1 rounded-xl ${scoreBg(score)}`}>
                  {pct(score)}
                </div>
                {recommendation && (
                  <p className="text-xs text-gray-400 mt-1 capitalize">{recommendation.replace("_", " ")}</p>
                )}
              </div>

              {/* Date sélection */}
              {selectedAt && (
                <div className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Sélectionné le {formatDate(selectedAt)}
                </div>
              )}

              {/* ── BOUTONS ── */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Modal envoi */}
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/recruiter/CandidatureAnalysis"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à l'analyse candidatures
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-violet-500" />
              Candidats Pré-sélectionnés
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {candidates.length} candidat{candidates.length > 1 ? "s" : ""} prêt{candidates.length > 1 ? "s" : ""} pour entretien
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-semibold text-sm shrink-0">
            <UserCheck className="w-4 h-4" />
            {candidates.length} pré-sélectionné{candidates.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un candidat (nom, email, job)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400 transition-colors"
          />
        </div>

        {/* Banner info */}
        {candidates.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800 text-sm">
            <span className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-medium">
              <UserCheck className="w-4 h-4" />
              <strong>{candidates.length} candidats</strong> sélectionnés pour pré-entretien
            </span>
            <span className="text-violet-500 dark:text-violet-400 text-xs hidden sm:block">
              Envoyez les documents ou planifiez leurs entretiens
            </span>
          </div>
        )}

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {search ? "Aucun candidat trouvé" : "Aucun candidat pré-sélectionné"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c, i) => (
              <PreInterviewCard key={c._id} c={c} index={i} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}