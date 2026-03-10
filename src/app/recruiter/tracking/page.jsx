"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  Loader2,
  Eye,
  GripVertical,
  Briefcase,
  GraduationCap,
  Users,
} from "lucide-react";
import { getRecruitmentTracking } from "../../services/job.api";
import Pagination from "../../components/Pagination";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function formatDateWithTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status) {
  const styles = {
    EN_ATTENTE:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    VALIDEE:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    CONFIRMEE:
      "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400",
    REJETEE:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  const labels = {
    EN_ATTENTE: "● En attente",
    VALIDEE: "● Validée",
    CONFIRMEE: "● Publiée",
    REJETEE: "● Rejetée",
  };

  const style = styles[status] || styles.EN_ATTENTE;
  const label = labels[status] || status;

  return (
    <span
      className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

function prettySexe(v) {
  const s = String(v || "").toUpperCase().trim();
  if (!s) return "—";
  const map = { H: "H", F: "F", HF: "H/F" };
  return map[s] || v;
}

const DEFAULT_COLUMNS = [
  { id: "titre", label: "Poste prévu", visible: true, sortable: true },
  { id: "nombrePostes", label: "Nbre Demandé", visible: true, sortable: true },
  { id: "departement", label: "Département", visible: true, sortable: false },
  { id: "societe", label: "Société", visible: true, sortable: false },
  { id: "sexe", label: "Genre", visible: true, sortable: false },
  { id: "typeDiplome", label: "Diplôme exigé", visible: true, sortable: false },
  { id: "status", label: "Suivi", visible: true, sortable: true },
  { id: "dateCloture", label: "Date Clôture", visible: true, sortable: true },
  { id: "motif", label: "Motif", visible: true, sortable: false },
  { id: "createdByUser", label: "Créé par", visible: true, sortable: false },
  { id: "createdAt", label: "Date Création", visible: true, sortable: true },
];

const PAGE_SIZE = 10;


export default function RecruitmentTrackingPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Pas de token! Veuillez vous reconnecter.");
        router.push("/login");
        return;
      }

      const trackingRes = await getRecruitmentTracking();
      setJobs(trackingRes?.data?.data || []);
    } catch (e) {
      console.error("Erreur:", e);
      if (e.response?.status === 401) {
        setError("Token invalide ou expiré.");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      recrutement: jobs.filter((j) => !j.typeOffre || j.typeOffre !== "STAGE")
        .length,
      stages: jobs.filter((j) => j.typeOffre === "STAGE").length,
    };
  }, [jobs]);

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (job) =>
          job.titre?.toLowerCase().includes(term) ||
          job.createdByUser?.toLowerCase().includes(term) ||
          job.lieu?.toLowerCase().includes(term) ||
          job.departement?.toLowerCase().includes(term) ||
          job.societe?.toLowerCase().includes(term)
      );
    }

    if (typeFilter === "RECRUTEMENT") {
      result = result.filter((job) => !job.typeOffre || job.typeOffre !== "STAGE");
    } else if (typeFilter === "STAGES") {
      result = result.filter((job) => job.typeOffre === "STAGE");
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt" || sortConfig.key === "dateCloture") {
        aVal = new Date(aVal) || 0;
        bVal = new Date(bVal) || 0;
      } else if (sortConfig.key === "nombrePostes") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [jobs, searchTerm, typeFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedJobs = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleColumnVisibility(colId) {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId ? { ...col, visible: !col.visible } : col
      )
    );
  }

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newColumns = [...columns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedCol);
    setColumns(newColumns);
    setDraggedIndex(null);
  }

  function exportToCSV() {
    const visibleColumns = columns.filter((col) => col.visible);
    const headers = visibleColumns.map((col) => col.label);

    const rows = filtered.map((job) =>
      visibleColumns.map((col) => {
        switch (col.id) {
          case "titre":
            return `${job.titre} (${job.lieu || "—"})`;
          case "nombrePostes":
            return job.nombrePostes || "—";
          case "departement":
            return job.departement || "—";
          case "societe":
            return job.societe || "—";
          case "sexe":
            return prettySexe(job.sexe);
          case "typeDiplome":
            return job.typeDiplome || "—";
          case "status":
            return job.status || "—";
          case "dateCloture":
            return formatDate(job.dateCloture);
          case "motif":
            return job.motif || "—";
          case "createdByUser":
            return job.createdByUser || "—";
          case "createdAt":
            return formatDateWithTime(job.createdAt);
          default:
            return "—";
        }
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "string" && cell.includes(",")) {
              return `"${cell}"`;
            }
            return cell;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suivi-recrutement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef7ea] dark:bg-gray-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="animate-spin" size={20} />
          Chargement du tableau de suivi...
        </div>
      </div>
    );
  }

  const visibleColumns = columns.filter((col) => col.visible);
  const visibleIndices = columns.reduce((acc, col, idx) => {
    if (col.visible) acc.push(idx);
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-[#eef7ea] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-7">
          Suivi des Recrutements
        </h1>

        <div className="flex flex-col lg:flex-row lg:items-center gap-5 mb-5">
          {columns.filter((c) => !c.visible).length > 0 && (
            <div className="relative">
              <button
                onClick={() => setColumnMenuOpen(!columnMenuOpen)}
                className="h-[56px] px-6 rounded-full
                  bg-orange-50 dark:bg-orange-900/20
                  border border-orange-200 dark:border-orange-900/50
                  text-orange-700 dark:text-orange-400
                  font-semibold text-[15px]
                  shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30
                  transition
                  inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Eye className="h-5 w-5" />
                {columns.filter((c) => !c.visible).length} masquée
                {columns.filter((c) => !c.visible).length > 1 ? "s" : ""}
              </button>

              {columnMenuOpen && (
                <div className="fixed inset-0 z-50">
                  <div
                    className="absolute inset-0 bg-black/20 dark:bg-black/40"
                    onClick={() => setColumnMenuOpen(false)}
                  />
                  <div className="absolute top-0 left-0 mt-12 ml-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-orange-200 dark:border-orange-900/50 overflow-hidden z-50 min-w-[300px]">
                    <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-900">
                      <p className="text-sm font-extrabold text-orange-700 dark:text-orange-400">
                        Colonnes masquées
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        Cliquez pour réafficher
                      </p>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {columns
                        .filter((c) => !c.visible)
                        .map((col) => (
                          <button
                            key={col.id}
                            onClick={() => {
                              toggleColumnVisibility(col.id);
                              setColumnMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-orange-50 dark:border-orange-900/30 last:border-b-0 flex items-center gap-3"
                          >
                            <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {col.label}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, agence, lieu, département, société..."
              className="w-full h-[56px] rounded-full bg-white dark:bg-gray-900
                border border-[#D7EBCF] dark:border-gray-800
                pl-14 pr-6 text-[15px] text-gray-700 dark:text-gray-200
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                shadow-sm outline-none
                focus:border-[#6CB33F] dark:focus:border-emerald-500
                focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/15
                transition"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="h-[56px] flex-1 lg:flex-none px-8 rounded-full
              bg-[#6CB33F] hover:bg-[#4E8F2F]
              dark:bg-emerald-600 dark:hover:bg-emerald-500
              text-white font-extrabold text-[15px]
              shadow-md transition
              inline-flex items-center justify-center gap-3 whitespace-nowrap"
          >
            <Download className="h-5 w-5" />
            Exporter Excel
          </button>
        </div>


        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-[#E9F5E3] dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-[#E9F5E3] dark:bg-gray-800 border-b border-[#D7EBCF] dark:border-gray-700">
                  {visibleColumns.map((col, idx) => (
                    <th
                      key={col.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, visibleIndices[idx])}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, visibleIndices[idx])}
                      className={`px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-[#3d7a1a] dark:text-emerald-400 whitespace-nowrap cursor-move select-none transition-all ${
                        draggedIndex === visibleIndices[idx]
                          ? "opacity-50 bg-yellow-100 dark:bg-yellow-900/30"
                          : "hover:bg-[#d9f0cd] dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 opacity-60" />
                          {col.sortable ? (
                            <button
                              onClick={() => handleSort(col.id)}
                              className="inline-flex items-center gap-1 hover:text-[#4E8F2F] dark:hover:text-emerald-300 transition"
                            >
                              {col.label}
                              {sortConfig.key === col.id ? (
                                sortConfig.direction === "asc" ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )
                              ) : (
                                <ChevronUp size={12} className="opacity-30" />
                              )}
                            </button>
                          ) : (
                            <span>{col.label}</span>
                          )}
                        </span>
                        <button
                          onClick={() => toggleColumnVisibility(col.id)}
                          title="Masquer cette colonne"
                          className="p-1 rounded hover:bg-white/60 dark:hover:bg-gray-600/60 transition-colors flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="py-20 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : paginatedJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="py-20 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      Aucune offre trouvée.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <tr
                      key={job._id}
                      className="hover:bg-[#f0faef] dark:hover:bg-gray-800/60 transition-colors"
                    >
                      {visibleColumns.map((col) => {
                        if (col.id === "titre") {
                          return (
                            <td key={col.id} className="px-6 py-5 max-w-xs">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white break-words">
                                  {job.titre || "—"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {job.lieu || "—"}
                                </p>
                              </div>
                            </td>
                          );
                        }

                        if (col.id === "nombrePostes") {
                          return (
                            <td key={col.id} className="px-6 py-5 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 font-bold text-sm">
                                {job.nombrePostes || "—"}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === "departement") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                            >
                              {job.departement || "—"}
                            </td>
                          );
                        }

                        if (col.id === "societe") {
                          return (
                            <td key={col.id} className="px-6 py-5 whitespace-nowrap">
                              {job.societe ? (
                                <span className="inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-[#e8f5e1] dark:bg-emerald-900/30 text-[#3d7a1a] dark:text-emerald-400 border border-[#b8dda0] dark:border-emerald-800">
                                  {job.societe}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        }

                        if (col.id === "sexe") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                            >
                              {prettySexe(job.sexe)}
                            </td>
                          );
                        }

                        if (col.id === "typeDiplome") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 max-w-xs break-words"
                            >
                              {job.typeDiplome || "—"}
                            </td>
                          );
                        }

                        if (col.id === "status") {
                          return (
                            <td key={col.id} className="px-6 py-5 whitespace-nowrap">
                              {getStatusBadge(job.status)}
                            </td>
                          );
                        }

                        if (col.id === "dateCloture") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            >
                              {formatDate(job.dateCloture)}
                            </td>
                          );
                        }

                        if (col.id === "createdAt") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            >
                              {formatDateWithTime(job.createdAt)}
                            </td>
                          );
                        }

                        if (col.id === "createdByUser") {
                          return (
                            <td key={col.id} className="px-6 py-5 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {job.createdByUser}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {job.createdByEmail}
                                </p>
                              </div>
                            </td>
                          );
                        }

                        if (col.id === "motif") {
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 max-w-xs break-words line-clamp-2"
                            >
                              {job.motif || "—"}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col.id}
                            className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                          >
                            {job[col.id] || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden px-5 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
            Astuce : glissez les en-têtes pour réorganiser, cliquez l'oeil pour masquer.
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Total :
                <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">
                  {filtered.length}
                </span>
                offre{filtered.length > 1 ? "s" : ""} — Page {currentPage} /{" "}
                {totalPages}
              </p>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}