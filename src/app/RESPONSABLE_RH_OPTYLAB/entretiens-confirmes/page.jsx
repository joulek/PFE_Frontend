"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Save,
  Trash2,
  X,
  StickyNote,
} from "lucide-react";
import Pagination from "../../components/Pagination";
import {
  getConfirmedInterviews,
  saveRhNordNote,
  deleteRhNordNote,
} from "../../services/interviewApi";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TypeBadge({ type }) {
  const isRhTech = type === "rh_technique";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${
        isRhTech
          ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
          : "border-[#d7ebcf] bg-[#E9F5E3] text-[#4E8F2F] dark:border-gray-600 dark:bg-gray-700 dark:text-emerald-400"
      }`}
    >
      {isRhTech ? "RH + Tech" : "Entretien RH"}
    </span>
  );
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Confirmé
    </span>
  );
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
      }`}
    >
      <span>{label}</span>
      <span>{count}</span>
    </button>
  );
}

function CandidateAvatar({ name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
      {initial}
    </div>
  );
}

export default function ConfirmedInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const LIMIT = 5;

  const [noteState, setNoteState] = useState({});

  function startEdit(iv) {
    setNoteState((prev) => ({
      ...prev,
      [iv._id]: {
        editing: true,
        text: iv.rhNordNote?.text || "",
        saving: false,
      },
    }));
  }

  function cancelEdit(id) {
    setNoteState((prev) => ({
      ...prev,
      [id]: { ...prev[id], editing: false },
    }));
  }

  async function handleSaveNote(iv) {
    const text = noteState[iv._id]?.text?.trim() || "";
    setNoteState((prev) => ({
      ...prev,
      [iv._id]: { ...prev[iv._id], saving: true },
    }));
    try {
      await saveRhNordNote(iv._id, text);
      setInterviews((prev) =>
        prev.map((item) =>
          String(item._id) === String(iv._id)
            ? { ...item, rhNordNote: text ? { text } : null }
            : item
        )
      );
      setNoteState((prev) => ({
        ...prev,
        [iv._id]: { editing: false, text, saving: false },
      }));
    } catch (e) {
      setNoteState((prev) => ({
        ...prev,
        [iv._id]: { ...prev[iv._id], saving: false },
      }));
      alert(e?.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  }

  async function handleDeleteNote(iv) {
    if (!confirm("Supprimer cette note ?")) return;
    setNoteState((prev) => ({
      ...prev,
      [iv._id]: { editing: false, text: "", saving: true },
    }));
    try {
      await deleteRhNordNote(iv._id);
      setInterviews((prev) =>
        prev.map((item) =>
          String(item._id) === String(iv._id)
            ? { ...item, rhNordNote: null }
            : item
        )
      );
      setNoteState((prev) => ({
        ...prev,
        [iv._id]: { editing: false, text: "", saving: false },
      }));
    } catch (e) {
      setNoteState((prev) => ({
        ...prev,
        [iv._id]: { ...prev[iv._id], saving: false },
      }));
      alert(e?.response?.data?.message || "Erreur lors de la suppression.");
    }
  }

  const fetchData = useCallback(
    async (withRefresh = false) => {
      try {
        setError(null);
        if (withRefresh) setRefreshing(true);
        else setLoading(true);

        const data = await getConfirmedInterviews({ page, limit: LIMIT, search });

        setInterviews(data?.interviews || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      } catch (e) {
        setError(e?.response?.data?.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const counts = useMemo(() => {
    const all = interviews.length;
    const rhTech = interviews.filter((i) => i.interviewType === "rh_technique").length;
    const rh = interviews.filter((i) => i.interviewType !== "rh_technique").length;
    return { all, rhTech, rh };
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    if (activeFilter === "rh") return interviews.filter((i) => i.interviewType !== "rh_technique");
    if (activeFilter === "rh_technique") return interviews.filter((i) => i.interviewType === "rh_technique");
    return interviews;
  }, [interviews, activeFilter]);

  /* ── Note cell (shared between table and cards) ── */
  function NoteCell({ iv }) {
    if (noteState[iv._id]?.editing) {
      return (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            rows={3}
            value={noteState[iv._id]?.text || ""}
            onChange={(e) =>
              setNoteState((prev) => ({
                ...prev,
                [iv._id]: { ...prev[iv._id], text: e.target.value },
              }))
            }
            placeholder="Saisir une note..."
            className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-[#4E8F2F]/30 focus:border-[#4E8F2F] resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveNote(iv)}
              disabled={noteState[iv._id]?.saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4E8F2F] hover:bg-[#3d7524] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Save className="w-3 h-3" />
              {noteState[iv._id]?.saving ? "..." : "Sauv."}
            </button>
            <button
              type="button"
              onClick={() => cancelEdit(iv._id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Annuler
            </button>
          </div>
        </div>
      );
    }

    if (iv.rhNordNote?.text) {
      return (
        <div className="group flex flex-col gap-1.5">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {iv.rhNordNote.text}
          </p>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => startEdit(iv)}
              className="flex items-center gap-1 text-[11px] text-[#4E8F2F] font-semibold hover:underline"
            >
              <Pencil className="w-3 h-3" /> Modifier
            </button>
            <button
              type="button"
              onClick={() => handleDeleteNote(iv)}
              className="flex items-center gap-1 text-[11px] text-red-500 font-semibold hover:underline"
            >
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => startEdit(iv)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4E8F2F] transition-colors group"
      >
        <StickyNote className="w-3.5 h-3.5 group-hover:text-[#4E8F2F]" />
        <span>Ajouter une note</span>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Liste des Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Administration · Vue globale de tous les entretiens confirmés
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => fetchData(true)}
            title="Actualiser"
            className="flex-shrink-0 text-gray-500 hover:text-[#4E8F2F] dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={activeFilter === "all"} label="Tous" count={counts.all} onClick={() => setActiveFilter("all")} />
            <FilterChip active={activeFilter === "rh"} label="RH" count={counts.rh} onClick={() => setActiveFilter("rh")} />
            <FilterChip active={activeFilter === "rh_technique"} label="RH + Tech" count={counts.rhTech} onClick={() => setActiveFilter("rh_technique")} />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${filteredInterviews.length} résultat${filteredInterviews.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des entretiens...</p>
            </div>
          ) : error ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Une erreur est survenue</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchData(true)}
                  className="mt-2 px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full font-semibold transition-colors text-sm"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#4E8F2F] dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aucun entretien trouvé</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Aucun entretien confirmé ne correspond au filtre actuel.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm min-w-[1120px]">
                  <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                    <tr>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Candidat</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Poste</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Type</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Statut</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Planification</th>
                      <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">Note RH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredInterviews.map((iv) => (
                      <tr key={String(iv._id)} className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-3">
                            <CandidateAvatar name={iv.candidateName} />
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 dark:text-white truncate">{iv.candidateName || "—"}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{iv.candidateEmail || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[190px]">{iv.jobTitle || "—"}</span>
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-5"><TypeBadge type={iv.interviewType} /></td>
                        <td className="px-6 lg:px-8 py-5"><StatusBadge /></td>
                        <td className="px-6 lg:px-8 py-5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col gap-2">
                            {iv.createdAt && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400" />
                                <span>Planifié {formatDate(iv.createdAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Confirmé {formatDate(iv.confirmedDate || iv.proposedDate || iv.createdAt)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5 max-w-[260px]">
                          <NoteCell iv={iv} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="grid gap-4 p-4 lg:hidden">
                {filteredInterviews.map((iv, idx) => (
                  <div key={String(iv._id)} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <CandidateAvatar name={iv.candidateName} />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-gray-900 dark:text-white truncate">{iv.candidateName || "—"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{iv.candidateEmail || "—"}</p>
                        <p className="text-[11px] text-gray-400 mt-1">#{(page - 1) * LIMIT + idx + 1}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Poste</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{iv.jobTitle || "—"}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TypeBadge type={iv.interviewType} />
                        <StatusBadge />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Planification</p>
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          {iv.createdAt && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              <span>Planifié {formatDate(iv.createdAt)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Confirmé {formatDate(iv.confirmedDate || iv.proposedDate || iv.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Note RH</p>
                        <NoteCell iv={iv} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── PAGINATION — en dehors du tableau ── */}
        {!loading && !error && filteredInterviews.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium">
              Total : <span className="font-extrabold text-gray-700 dark:text-gray-200">{total}</span> candidature{total > 1 ? "s" : ""}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}