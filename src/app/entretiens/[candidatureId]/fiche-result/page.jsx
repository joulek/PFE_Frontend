"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../services/api";
import {
  ClipboardList,
  Loader2,
  Clock3,
  Mail,
  Phone,
  Download,
  FileQuestion,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}
function safeStr(v) { return v ? String(v).trim() : ""; }
function firstNonEmpty(...vals) {
  for (const v of vals) { const s = safeStr(v); if (s) return s; }
  return "";
}
function getCandidateName(c) {
  return firstNonEmpty(
    c?.fullName,
    `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim(),
    c?.extracted?.parsed?.full_name,
    `${safeStr(c?.extracted?.parsed?.first_name)} ${safeStr(c?.extracted?.parsed?.last_name)}`.trim(),
    c?.email
  ) || "Candidat";
}
function getCandidateEmail(c) {
  return firstNonEmpty(c?.email, c?.personalInfoForm?.email, c?.extracted?.parsed?.email) || "—";
}
function getCandidatePhone(c) {
  return firstNonEmpty(c?.telephone, c?.phone, c?.personalInfoForm?.telephone, c?.extracted?.parsed?.phone) || "—";
}
function getCandidateJobTitle(c) {
  return firstNonEmpty(c?.jobTitle, c?.offreTitle, c?.poste, c?.job?.titre, c?.offre?.titre) || "—";
}

// ─── PDF button ──────────────────────────────────────────────────────────────
function PdfDownloadButton({ submissionId }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fiche-submissions/${submissionId}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "fiche_candidature.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement du PDF"); }
    finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium shadow-md disabled:opacity-60 transition-all text-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Télécharger le PDF
    </button>
  );
}

// ─── Value normalization ─────────────────────────────────────────────────────
function isLevelQ(q) {
  const t = safeStr(q?.type).toLowerCase();
  return t.includes("niveau") || t.includes("level") || t.includes("scale_group");
}
function isOrderQ(q) {
  const t = safeStr(q?.type).toLowerCase();
  return t.includes("ordre") || t.includes("ranking") || t.includes("order");
}
function getLevelLabel(val, q) {
  const raw = safeStr(val);
  const labels = q?.scale?.labels;
  if (labels?.[raw]) return safeStr(labels[raw]);
  const opts = Array.isArray(q?.options) ? q.options : [];
  for (const opt of opts) {
    const ov = typeof opt === "string" ? opt : safeStr(opt?.value || opt?.label);
    const ol = typeof opt === "string" ? opt : safeStr(opt?.label || opt?.text);
    if (ov === raw || ol === raw) return ol;
  }
  return { "0":"Néant","1":"Débutant","2":"Intermédiaire","3":"Avancé","4":"Expert" }[raw] || raw || "—";
}
function normalizeValue(value, q) {
  if (value === null || value === undefined) return { mode: "text", value: "—" };
  if (isOrderQ(q)) {
    const items = Array.isArray(value)
      ? value.flatMap(i => typeof i === "string" ? i.split(",").map(p=>p.trim()).filter(Boolean) : [String(i)])
      : typeof value === "string" ? value.split(",").map(p=>p.trim()).filter(Boolean) : [String(value)];
    return { mode: "list", value: items };
  }
  if (isLevelQ(q)) {
    if (typeof value === "object" && !Array.isArray(value))
      return { mode: "kv-list", value: Object.entries(value).map(([k,v]) => ({ label: k, value: getLevelLabel(v, q) })) };
    return { mode: "text", value: getLevelLabel(value, q) };
  }
  if (typeof value === "string") return { mode: "text", value: value.trim() || "—" };
  if (typeof value === "number" || typeof value === "boolean") return { mode: "text", value: String(value) };
  if (Array.isArray(value)) {
    if (!value.length) return { mode: "text", value: "—" };
    const hasObj = value.some(i => i && typeof i === "object");
    if (!hasObj) return { mode: "text", value: value.map(String).join(", ") };
    return { mode: "list", value: value.map(i => typeof i === "object" ? Object.entries(i).map(([k,v])=>`${k} : ${v??'—'}`).join(" • ") : String(i)) };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return { mode: "text", value: "—" };
    return { mode: "kv-list", value: entries.map(([k,v]) => ({ label: k, value: isLevelQ(q) ? getLevelLabel(v,q) : v ?? "—" })) };
  }
  return { mode: "text", value: String(value) };
}

// ─── Answer display ──────────────────────────────────────────────────────────
function AnswerContent({ answer }) {
  if (answer.mode === "list") return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
      <ol className="space-y-2">
        {answer.value.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span className="w-6 h-6 rounded-full bg-[#E9F5E3] dark:bg-green-900/40 text-[#4E8F2F] dark:text-green-300 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
            <span className="break-words whitespace-pre-wrap">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
  if (answer.mode === "kv-list") return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
      <div className="space-y-2">
        {answer.value.map((item, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
            <span className="font-semibold text-[#4E8F2F] dark:text-green-300">{item.label} :</span>
            <span className="break-words whitespace-pre-wrap">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-[#cfe4c4] dark:border-green-800/40 p-4">
      <div className="flex items-start gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        <FileQuestion className="w-4 h-4 mt-0.5 text-[#4E8F2F] dark:text-green-400 shrink-0" />
        <span className="break-words whitespace-pre-wrap">{answer.value}</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function FicheResultPage() {
  const params = useParams();
  const router = useRouter();
  const candidatureId = params?.candidatureId;

  const [fiche, setFiche]               = useState(null);
  const [ficheDefinition, setFicheDef]  = useState(null);
  const [candidature, setCandidature]   = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!candidatureId) return;
    (async () => {
      setLoading(true);
      try {
        const [cRes, fRes] = await Promise.all([
          api.get(`/candidatures/${candidatureId}`),
          api.get(`/fiche-submissions/candidature/${candidatureId}`),
        ]);
        setCandidature(cRes.data);
        const list = Array.isArray(fRes.data) ? fRes.data
          : Array.isArray(fRes.data?.submissions) ? fRes.data.submissions : [];
        const latest = list[0] || null;
        setFiche(latest);
        if (latest?.ficheId) {
          try {
            const r = await api.get(`/fiches/${latest.ficheId}`);
            setFicheDef(r.data || null);
          } catch { setFicheDef(null); }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [candidatureId]);

  const name     = useMemo(() => getCandidateName(candidature),    [candidature]);
  const email    = useMemo(() => getCandidateEmail(candidature),   [candidature]);
  const phone    = useMemo(() => getCandidatePhone(candidature),   [candidature]);
  const jobTitle = useMemo(() => getCandidateJobTitle(candidature),[candidature]);
  const initials = name.split(" ").filter(Boolean).slice(0,2).map(p=>p[0]).join("").toLowerCase() || "c";
  const statusLabel = safeStr(candidature?.statusLabel) || safeStr(candidature?.status) || "En attente";

  const answers = useMemo(() => {
    if (!fiche) return [];
    const qMap = new Map();
    (ficheDefinition?.questions || []).forEach((q, i) => {
      if (q?._id) qMap.set(String(q._id), { ...q, index: i });
      if (q?.id)  qMap.set(String(q.id),  { ...q, index: i });
    });
    return (fiche.answers || []).map((a, i) => {
      const q = qMap.get(String(a.questionId)) || null;
      return {
        key: `${a.questionId}-${i}`,
        order: q?.index !== undefined ? q.index + 1 : i + 1,
        label: q?.label || a.label || `Question ${i + 1}`,
        normalizedAnswer: normalizeValue(a.value, q),
        timeSpent: a.timeSpent,
      };
    });
  }, [fiche, ficheDefinition]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5faf3] dark:bg-slate-950 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Retour ── */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E8F2F] dark:text-green-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* ── Header candidat ── */}
        <div className="mb-6 rounded-[1.75rem] border border-[#dfead6] dark:border-slate-700 bg-[#eef6e8] dark:bg-slate-900 shadow-sm px-5 sm:px-7 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#74bf37] dark:bg-green-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1430] dark:text-white leading-tight">{name}</h1>
                <div className="mt-2 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-[#69b332]" />{email}</span>
                    <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4 text-[#69b332]" />{phone}</span>
                  </div>
                  <p className="text-base sm:text-xl text-[#69b332] dark:text-green-400 font-semibold">{jobTitle}</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4df9f] dark:bg-amber-900/40 text-[#c55b00] dark:text-amber-300 px-4 py-2 text-sm font-semibold whitespace-nowrap self-start lg:self-center">
              <Clock3 className="w-4 h-4" />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!fiche ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#dfead6] dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EEF7E9] dark:bg-slate-700 mx-auto flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-[#4E8F2F] dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune fiche soumise</h3>
            <p className="text-gray-500 dark:text-gray-400">Ce candidat n'a pas encore soumis de fiche de renseignements.</p>
          </div>
        ) : (

          /* ── Fiche answers ── */
          <div className="bg-white dark:bg-slate-800 border border-[#dfead6] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-[#dfead6] dark:border-slate-700 bg-[#F4FAF0] dark:bg-slate-900/50">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-[#4E8F2F] dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Réponses de la Fiche de Renseignements
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Soumise
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(fiche.finishedAt || fiche.updatedAt || fiche.createdAt)}
                    </span>
                  </div>
                  <PdfDownloadButton submissionId={fiche._id} />
                </div>
              </div>
            </div>

            {/* Answers list */}
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
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-3 leading-snug">{a.label}</p>
                        <AnswerContent answer={a.normalizedAnswer} />
                        {typeof a.timeSpent === "number" && a.timeSpent > 0 && (
                          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Temps passé : {a.timeSpent}s</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!answers.length && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6">Aucune réponse disponible.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
