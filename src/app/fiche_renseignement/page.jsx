"use client";

import { useEffect, useState } from "react";
import { getFiches } from "../services/fiche.api";
import {
  FileText, Eye, X, ChevronRight, AlignLeft, Hash,
  CheckSquare, Circle, List, BarChart2, Type, Clock,
} from "lucide-react";

/* ── Icône par type ── */
function TypeIcon({ type }) {
  const map = {
    text:        <Type className="w-3.5 h-3.5" />,
    number8:     <Hash className="w-3.5 h-3.5" />,
    textarea:    <AlignLeft className="w-3.5 h-3.5" />,
    radio:       <Circle className="w-3.5 h-3.5" />,
    checkbox:    <CheckSquare className="w-3.5 h-3.5" />,
    ranking:     <List className="w-3.5 h-3.5" />,
    scale_group: <BarChart2 className="w-3.5 h-3.5" />,
  };
  const labels = {
    text: "Texte", number8: "8 chiffres", textarea: "Paragraphe",
    radio: "Choix unique", checkbox: "Choix multiple",
    ranking: "Classement", scale_group: "Code niveau",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
      {map[type] || <Type className="w-3.5 h-3.5" />}
      {labels[type] || type}
    </span>
  );
}

/* ── Rendu d'une question en mode lecture ── */
function QuestionView({ q, idx }) {
  const scaleLabels = q.scale?.labels || { 0:"Néant",1:"Débutant",2:"Intermédiaire",3:"Avancé",4:"Expert" };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700">
      {/* Header question */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-[#4E8F2F]/10 text-[#4E8F2F] dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-snug">
              {q.label || <span className="italic text-gray-400">Sans titre</span>}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {q.timeLimit > 0 && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                <Clock className="w-3 h-3" /> {q.timeLimit} min
              </p>
            )}
          </div>
        </div>
        <TypeIcon type={q.type} />
      </div>

      {/* Contenu selon type */}
      {(q.type === "text" || q.type === "number8") && (
        <div className="ml-7">
          <div className="h-9 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 flex items-center">
            <span className="text-xs text-gray-400 italic">
              {q.type === "number8" ? "________" : q.placeholder || "Réponse courte..."}
            </span>
          </div>
        </div>
      )}

      {q.type === "textarea" && (
        <div className="ml-7">
          <div className="h-16 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 flex items-start">
            <span className="text-xs text-gray-400 italic">{q.placeholder || "Réponse longue..."}</span>
          </div>
        </div>
      )}

      {(q.type === "radio" || q.type === "checkbox") && q.options?.length > 0 && (
        <div className="ml-7 space-y-2 mt-1">
          {q.options.map((opt, i) => (
            <div key={opt.id || i} className="flex items-center gap-2">
              <span className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 dark:border-gray-500 ${q.type === "radio" ? "rounded-full" : "rounded"}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label || `Option ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}

      {q.type === "ranking" && q.options?.length > 0 && (
        <div className="ml-7 space-y-2 mt-1">
          {q.options.map((opt, i) => (
            <div key={opt.id || i} className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label || `Élément ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}

      {q.type === "scale_group" && q.items?.length > 0 && (
        <div className="ml-7 mt-2">
          {/* Échelle header */}
          <div className="flex gap-1 mb-2 justify-end">
            {Object.entries(scaleLabels).map(([k, v]) => (
              <span key={k} className="text-[10px] text-gray-400 text-center w-14 leading-tight">{v}</span>
            ))}
          </div>
          {q.items.map((item, i) => (
            <div key={item.id || i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{item.label || `Compétence ${i + 1}`}</span>
              <div className="flex gap-1">
                {Object.keys(scaleLabels).map((k) => (
                  <span key={k} className="w-14 h-6 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 flex items-center justify-center">
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">{k}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Modal détail fiche ── */
function FicheModal({ fiche, onClose }) {
  if (!fiche) return null;
  const questions = fiche.questions || [];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F5E3] dark:bg-[#4E8F2F]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 dark:text-white text-base">{fiche.title}</h2>
              {fiche.description && (
                <p className="text-xs text-gray-400 mt-0.5">{fiche.description}</p>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {questions.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-8">Aucune question dans cette fiche.</p>
          )}
          {questions.map((q, i) => (
            <QuestionView key={q.id || i} q={q} idx={i} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
          <span className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F5E3] dark:bg-[#4E8F2F]/20 text-[#4E8F2F] dark:text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4E8F2F] dark:bg-emerald-400" />
            Lecture seule
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function FichesPageRHNord() {
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiche, setSelectedFiche] = useState(null);

  useEffect(() => {
    getFiches()
      .then(res => setFiches(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <FicheModal fiche={selectedFiche} onClose={() => setSelectedFiche(null)} />

      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Fiches de renseignement</h1>
            <p className="text-gray-600 dark:text-gray-400">Consultez les formulaires de recrutement.</p>
          </div>

          {fiches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-bold text-gray-600 dark:text-gray-300">Aucune fiche disponible</p>
              <p className="text-sm text-gray-400 mt-1">Aucune fiche n'a été créée pour le moment.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fiches.map((f) => (
              <div key={f._id}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E9F5E3] dark:bg-[#4E8F2F]/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{f.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{f.description || "Aucune description"}</p>
                  </div>
                </div>

                {f.questions?.length > 0 && (
                  <>
                    <div className="my-4 h-px bg-gray-100 dark:bg-gray-700" />
                    <div className="flex flex-wrap gap-2">
                      {f.questions.slice(0, 5).map((q, i) => (
                        <span key={q.id || i}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {q.label || `Question ${i + 1}`}
                        </span>
                      ))}
                      {f.questions.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-400">
                          +{f.questions.length - 5} autres
                        </span>
                      )}
                    </div>
                  </>
                )}

                <div className="my-5 h-px bg-gray-100 dark:bg-gray-700" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{f.questions?.length || 0} question{f.questions?.length !== 1 ? "s" : ""}</span>
                  <button onClick={() => setSelectedFiche(f)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white text-sm font-semibold transition-colors">
                    <Eye size={15} />
                    Voir la fiche
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}