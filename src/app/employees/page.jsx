"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employee.api";
import Pagination from "../components/Pagination";
import {
  Search,
  Trash2,
  Pencil,
  X,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

/* ========================= LISTES ========================= */
const GENRES = [
  { value: "F", label: "F" },
  { value: "H", label: "H" },
];
const SOCIETES = [
  { value: "optylab", label: "Optylab" },
  { value: "optyGros", label: "OptyGros" },
];
const CONTRAT_STE = [
  { value: "optylab", label: "Optylab" },
  { value: "optyGros", label: "OptyGros" },
];
const TYPES_CONTRAT = [
  { value: "CIVP", label: "CIVP" },
  { value: "CAIP", label: "CAIP" },
  { value: "Karama", label: "Karama" },
  { value: "CDI avec PE", label: "CDI avec PE" },
  { value: "CDD (exp)", label: "CDD (exp)" },
  { value: "CDI sans PE", label: "CDI sans PE" },
];
const AGENCES_TUNISIE = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
].map((v) => ({ value: v, label: v }));

// Ordre initial des colonnes
const INITIAL_COLUMNS_ORDER = [
  "cin",
  "matricule",
  "fullName",
  "agence",
  "societe",
  "poste",
  "departement",
  "contratSociete",
  "typeContrat",
  "dateDebutContrat",
  "genre",
  "situation",
  "cnss",
  "dateFinContrat",
];

const FIELDS = [
  { key: "cin", label: "N°CIN", type: "text" },
  { key: "matricule", label: "Matricule", type: "text" },
  { key: "fullName", label: "Nom & Prénom", type: "text" },
  { key: "agence", label: "Agence", type: "select", options: AGENCES_TUNISIE },
  { key: "societe", label: "Société", type: "select", options: SOCIETES },
  { key: "poste", label: "Poste", type: "text" },
  { key: "departement", label: "Département", type: "text" },
  {
    key: "contratSociete",
    label: "Contrat / Sté",
    type: "select",
    options: CONTRAT_STE,
  },
  {
    key: "typeContrat",
    label: "Type de contrat",
    type: "select",
    options: TYPES_CONTRAT,
  },
  { key: "dateDebutContrat", label: "Date début contrat", type: "date" },
  { key: "genre", label: "Genre", type: "select", options: GENRES },
  { key: "situation", label: "Situation", type: "text" },
  { key: "cnss", label: "N°CNSS", type: "text" },
  { key: "dateFinContrat", label: "Date fin contrat", type: "date" },
];

// Créer une map pour accès rapide aux FIELDS
const FIELDS_MAP = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = [
  "fullName",
  "cin",
  "matricule",
  "agence",
  "societe",
  "poste",
  "typeContrat",
];

const CONTRACT_COLORS = {
  CIVP: "bg-purple-100 text-purple-700 border border-purple-200",
  CAIP: "bg-blue-100 text-blue-700 border border-blue-200",
  Karama: "bg-amber-100 text-amber-700 border border-amber-200",
  "CDI avec PE": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "CDI sans PE": "bg-green-100 text-green-700 border border-green-200",
  "CDD (exp)": "bg-orange-100 text-orange-700 border border-orange-200",
};

const SOCIETE_COLORS = {
  optylab: "bg-[#e8f5e1] text-[#3d7a1a] border border-[#b8dda0]",
  optyGros: "bg-blue-50 text-blue-700 border border-blue-200",
};

const PAGE_SIZE = 10;

/* ========================= UTILS ========================= */
function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function Avatar({ name }) {
  const letter = (name || "?")[0].toUpperCase();
  const palette = [
    "#4ade80",
    "#60a5fa",
    "#f472b6",
    "#fb923c",
    "#a78bfa",
    "#34d399",
    "#facc15",
  ];
  const bg = palette[(name || "").charCodeAt(0) % palette.length];
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
      style={{ backgroundColor: bg }}
    >
      {letter}
    </div>
  );
}

/* ========================= MODALS ========================= */
function BaseModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-4xl",
  headerIcon = null,
  footer = null,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800`}
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {headerIcon ? (
                <div className="mt-0.5 h-10 w-10 rounded-2xl bg-[#E9F5E3] dark:bg-gray-800 flex items-center justify-center shrink-0">
                  {headerIcon}
                </div>
              ) : null}

              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(92vh-84px-72px)] overflow-y-auto px-6 sm:px-8 py-6">
          {children}
        </div>

        {/* FOOTER */}
        {footer ? (
          <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, loading, employee }) {
  const name = employee?.fullName || "cet employé";
  const cin = employee?.cin ? `CIN: ${employee.cin}` : "";
  const matricule = employee?.matricule ? `Matricule: ${employee.matricule}` : "";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Confirmer la suppression"
      subtitle="Cette action est irréversible."
      maxWidth="max-w-lg"
      headerIcon={<AlertTriangle className="h-5 w-5 text-red-500" />}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 px-5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold shadow-sm transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Supprimer
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/20 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Voulez-vous vraiment supprimer{" "}
          <span className="text-red-600 dark:text-red-400">{name}</span> ?
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {cin || matricule ? (
            <>
              {cin ? <span className="mr-3">{cin}</span> : null}
              {matricule ? <span>{matricule}</span> : null}
            </>
          ) : (
            "Les données associées à cet employé seront supprimées."
          )}
        </p>
      </div>
    </BaseModal>
  );
}

/* ========================= PAGE ========================= */
export default function EmployeesPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editId, setEditId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, ""]))
  );

  // ✅ delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ success toast/message in modal (optional)
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ column management
  const [columnsOrder, setColumnsOrder] = useState(INITIAL_COLUMNS_ORDER);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  async function fetchData(search = "") {
    setLoading(true);
    setError("");
    try {
      const res = await getEmployees(search);
      setRows(res.data?.employees || []);
      setCurrentPage(1);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const role = String(user?.role || "").toUpperCase();

    if (!token || (role !== "ADMIN" && role !== "ASSISTANTE_RH")) {
      router.replace("/login");
      return;
    }

    // Charger les colonnes depuis localStorage
    const savedOrder = localStorage.getItem("columnsOrder");
    const savedVisible = localStorage.getItem("visibleColumns");

    if (savedOrder) {
      try {
        setColumnsOrder(JSON.parse(savedOrder));
      } catch (e) {
        setColumnsOrder(INITIAL_COLUMNS_ORDER);
      }
    }

    if (savedVisible) {
      try {
        setVisibleColumns(JSON.parse(savedVisible));
      } catch (e) {
        setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
      }
    }

    fetchData("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder l'ordre et la visibilité
  useEffect(() => {
    localStorage.setItem("columnsOrder", JSON.stringify(columnsOrder));
  }, [columnsOrder]);

  useEffect(() => {
    localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated = useMemo(
    () => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [rows, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  function openCreate() {
    setSuccessMsg("");
    setError("");
    setForm(Object.fromEntries(FIELDS.map((f) => [f.key, ""])));
    setMode("create");
    setEditId(null);
    setOpen(true);
  }

  function openEdit(row) {
    setSuccessMsg("");
    setError("");
    const next = {};
    for (const f of FIELDS) {
      next[f.key] =
        f.type === "date" ? toInputDate(row?.[f.key]) : row?.[f.key] ?? "";
    }
    setForm(next);
    setMode("edit");
    setEditId(row._id);
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const payload = { ...form };
    payload.cin = String(payload.cin || "").replace(/\D/g, "");
    payload.cnss = String(payload.cnss || "").replace(/\D/g, "");

    if (!payload.dateDebutContrat) delete payload.dateDebutContrat;
    if (!payload.dateFinContrat) delete payload.dateFinContrat;

    try {
      if (mode === "create") {
        await createEmployee(payload);
        setSuccessMsg("Employé ajouté avec succès.");
      } else {
        await updateEmployee(editId, payload);
        setSuccessMsg("Employé modifié avec succès.");
      }

      await fetchData(q);

      setTimeout(() => {
        setOpen(false);
        setSuccessMsg("");
      }, 700);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Erreur sauvegarde");
    }
  }

  function askDelete(row) {
    setError("");
    setDeleteTarget(row);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    setError("");

    try {
      await deleteEmployee(deleteTarget._id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchData(q);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur suppression");
    } finally {
      setDeleteLoading(false);
    }
  }

  function toggleColumnVisibility(key) {
    setVisibleColumns((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  }

  function handleDragStart(e, columnKey) {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetColumnKey) {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      return;
    }

    const draggedIndex = columnsOrder.indexOf(draggedColumn);
    const targetIndex = columnsOrder.indexOf(targetColumnKey);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      return;
    }

    const newOrder = [...columnsOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnsOrder(newOrder);
    setDraggedColumn(null);
  }

  // Filtrer les colonnes à afficher dans l'ordre
  const visibleFields = columnsOrder
    .filter((key) => visibleColumns.includes(key))
    .map((key) => FIELDS_MAP[key])
    .filter(Boolean);

  const inputCls =
    "w-full h-11 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/15 transition-colors";
  const selectCls = inputCls + " appearance-none cursor-pointer pr-10";

  return (
    <div className="min-h-screen bg-[#eef7ea] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        {/* TITLE */}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-7">
          Liste des employés
        </h1>

        {/* ✅ TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData(q)}
              placeholder="Rechercher par nom, agence, CIN, matricule..."
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

          <div className="flex gap-3 w-full lg:w-auto">
            {/* Bouton Afficher colonnes cachées (si y en a) */}
            {columnsOrder.filter((k) => !visibleColumns.includes(k)).length > 0 && (
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
                  <EyeOff className="h-5 w-5" />
                  {columnsOrder.filter((k) => !visibleColumns.includes(k)).length} masquée(s)
                </button>

                {/* Menu déroulant des colonnes cachées */}
                {columnMenuOpen && (
                  <div className="fixed inset-0 z-50">
                    <div
                      className="absolute inset-0 bg-black/20 dark:bg-black/40"
                      onClick={() => setColumnMenuOpen(false)}
                    />
                    <div className="absolute top-0 right-0 mt-12 mr-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-orange-200 dark:border-orange-900/50 overflow-hidden z-50 min-w-[300px]">
                      <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-900">
                        <p className="text-sm font-extrabold text-orange-700 dark:text-orange-400">
                          Colonnes masquées
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                          Cliquez pour réafficher
                        </p>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto">
                        {columnsOrder
                          .filter((k) => !visibleColumns.includes(k))
                          .map((key) => {
                            const field = FIELDS_MAP[key];
                            if (!field) return null;
                            return (
                              <button
                                key={key}
                                onClick={() => {
                                  toggleColumnVisibility(key);
                                  setColumnMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-orange-50 dark:border-orange-900/30 last:border-b-0 flex items-center gap-3"
                              >
                                <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                  {field.label}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={openCreate}
              className="h-[56px] flex-1 lg:flex-none px-8 rounded-full
                bg-[#6CB33F] hover:bg-[#4E8F2F]
                dark:bg-emerald-600 dark:hover:bg-emerald-500
                text-white font-extrabold text-[15px]
                shadow-md transition
                inline-flex items-center justify-center gap-3 whitespace-nowrap"
            >
              <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </span>
              Ajouter un employé
            </button>
          </div>
        </div>

        {/* ERROR (global) */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* TABLE CARD — scroll horizontal */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-[#E9F5E3] dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-[#E9F5E3] dark:bg-gray-800 border-b border-[#D7EBCF] dark:border-gray-700">
                  {visibleFields.map((f) => (
                    <th
                      key={f.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, f.key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, f.key)}
                      className={`px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-[#3d7a1a] dark:text-emerald-400 whitespace-nowrap cursor-move select-none transition-all ${
                        draggedColumn === f.key
                          ? "opacity-50 bg-yellow-100 dark:bg-yellow-900/30"
                          : "hover:bg-[#d9f0cd] dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 opacity-60" />
                          {f.label}
                        </span>
                        <button
                          onClick={() => toggleColumnVisibility(f.key)}
                          title="Masquer cette colonne"
                          className="p-1 rounded hover:bg-white/60 dark:hover:bg-gray-600/60 transition-colors flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400" />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-[#3d7a1a] dark:text-emerald-400 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleFields.length + 1}
                      className="py-20 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleFields.length + 1}
                      className="py-20 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      Aucun employé trouvé.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-[#f0faef] dark:hover:bg-gray-800/60 transition-colors"
                    >
                      {/* Cellules de données visibles */}
                      {visibleFields.map((f) => {
                        // Case spéciale: fullName avec Avatar
                        if (f.key === "fullName") {
                          return (
                            <td
                              key={f.key}
                              className="px-6 py-5 whitespace-nowrap"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar name={r.fullName} />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {r.fullName || "—"}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // Case spéciale: societe (badge)
                        if (f.key === "societe") {
                          return (
                            <td
                              key={f.key}
                              className="px-6 py-5 whitespace-nowrap"
                            >
                              {r.societe ? (
                                <span
                                  className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full ${
                                    SOCIETE_COLORS[r.societe] ||
                                    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  {r.societe}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        }

                        // Case spéciale: typeContrat (badge)
                        if (f.key === "typeContrat") {
                          return (
                            <td
                              key={f.key}
                              className="px-6 py-5 whitespace-nowrap"
                            >
                              {r.typeContrat ? (
                                <span
                                  className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full ${
                                    CONTRACT_COLORS[r.typeContrat] ||
                                    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  {r.typeContrat}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        }

                        // Case spéciale: dates
                        if (f.key === "dateDebutContrat" || f.key === "dateFinContrat") {
                          return (
                            <td
                              key={f.key}
                              className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            >
                              {r[f.key]
                                ? new Date(r[f.key]).toLocaleDateString("fr-FR")
                                : "—"}
                            </td>
                          );
                        }

                        // Colonnes numéros (monospace)
                        if (f.key === "cin" || f.key === "matricule" || f.key === "cnss") {
                          return (
                            <td
                              key={f.key}
                              className="px-6 py-5 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            >
                              {r[f.key] || "—"}
                            </td>
                          );
                        }

                        // Colonnes texte normales
                        return (
                          <td
                            key={f.key}
                            className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                          >
                            {r[f.key] || "—"}
                          </td>
                        );
                      })}

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(r)}
                            title="Modifier"
                            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-[#E9F5E3] dark:hover:bg-gray-800 transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400" />
                          </button>

                          <button
                            onClick={() => askDelete(r)}
                            title="Supprimer"
                            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
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

        {/* FOOTER — count + pagination */}
        {rows.length > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Total :{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {rows.length}
              </span>{" "}
              employé{rows.length > 1 ? "s" : ""} — Page {currentPage} /{" "}
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
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      <BaseModal
        open={open}
        onClose={() => {
          setOpen(false);
          setError("");
          setSuccessMsg("");
        }}
        title={mode === "create" ? "Ajouter un employé" : "Modifier l'employé"}
        subtitle={
          mode === "create"
            ? "Complétez les informations de l'employé puis enregistrez."
            : "Mettez à jour les informations puis enregistrez."
        }
        headerIcon={
          mode === "create" ? (
            <UserPlus className="h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
          ) : (
            <Pencil className="h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
          )
        }
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
                setSuccessMsg("");
              }}
              className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              form="employee-form"
              className="h-11 px-6 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-extrabold shadow-sm transition-colors"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        {successMsg ? (
          <div className="rounded-2xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                {successMsg}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Mise à jour effectuée.
              </p>
            </div>
          </div>
        ) : (
          <form id="employee-form" onSubmit={onSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Informations employé
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Champs principaux (CIN, matricule, agence, etc.)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    {f.label}
                  </label>

                  {f.type === "select" ? (
                    <div className="relative">
                      <select
                        value={form[f.key] ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        className={selectCls}
                      >
                        <option value="">
                          Choisir {f.label.toLowerCase()}…
                        </option>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        ▾
                      </div>
                    </div>
                  ) : (
                    <input
                      type={f.type}
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      className={inputCls}
                      inputMode={
                        f.key === "cin" || f.key === "cnss"
                          ? "numeric"
                          : undefined
                      }
                      placeholder={
                        f.type === "date"
                          ? "jj/mm/aaaa"
                          : `Saisir ${f.label.toLowerCase()}`
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        )}
      </BaseModal>

      {/* DELETE MODAL */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        employee={deleteTarget}
      />
    </div>
  );
}