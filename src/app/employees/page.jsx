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
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Médenine",
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse",
  "Tataouine", "Tozeur", "Tunis", "Zaghouan",
].map((v) => ({ value: v, label: v }));

const INITIAL_COLUMNS_ORDER = [
  "cin", "matricule", "fullName", "agence", "societe", "poste", "departement",
  "contratSociete", "typeContrat", "dateDebutContrat", "genre", "situation",
  "cnss", "dateFinContrat",
];

// Champs avec leur configuration + required
const FIELDS = [
  { key: "cin", label: "N°CIN", type: "text", required: true },
  { key: "matricule", label: "Matricule", type: "text", required: true },
  { key: "fullName", label: "Nom & Prénom", type: "text", required: true },
  { key: "agence", label: "Agence", type: "select", required: true, options: AGENCES_TUNISIE },
  { key: "societe", label: "Société", type: "select", required: true, options: SOCIETES },
  { key: "poste", label: "Poste", type: "text", required: true },
  { key: "departement", label: "Département", type: "text", required: false },
  { key: "contratSociete", label: "Contrat / Sté", type: "select", required: true, options: CONTRAT_STE },
  { key: "typeContrat", label: "Type de contrat", type: "select", required: true, options: TYPES_CONTRAT },
  { key: "dateDebutContrat", label: "Date début contrat", type: "date", required: true },
  { key: "genre", label: "Genre", type: "select", required: false, options: GENRES },
  { key: "situation", label: "Situation", type: "text", required: false },
  { key: "cnss", label: "N°CNSS", type: "text", required: false },
  { key: "dateFinContrat", label: "Date fin contrat", type: "date", required: false },
];

const FIELDS_MAP = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

const DEFAULT_VISIBLE_COLUMNS = [
  "fullName", "cin", "matricule", "agence", "societe", "poste", "typeContrat",
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

const PAGE_SIZE = 5;

/* ========================= VALIDATION ========================= */
function validateForm(form) {
  const errors = {}; // { fieldKey: "message" }

  for (const f of FIELDS) {
    const val = String(form[f.key] || "").trim();

    if (f.required && !val) {
      errors[f.key] = `Le champ "${f.label}" est obligatoire.`;
      continue;
    }

    // Validations spécifiques
    if (f.key === "cin" && val) {
      const digits = val.replace(/\D/g, "");
      if (digits.length !== 8) {
        errors[f.key] = `Le N°CIN doit contenir exactement 8 chiffres (saisi : ${digits.length}).`;
      }
    }

    if (f.key === "cnss" && val) {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 6 || digits.length > 12) {
        errors[f.key] = `Le N°CNSS semble invalide (${digits.length} chiffres).`;
      }
    }

    if (f.key === "dateFinContrat" && val && form.dateDebutContrat) {
      if (new Date(val) <= new Date(form.dateDebutContrat)) {
        errors[f.key] = "La date de fin doit être postérieure à la date de début.";
      }
    }
  }

  return errors;
}

/* ========================= UTILS ========================= */
function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Avatar({ name }) {
  const letter = (name || "?")[0].toUpperCase();
  const palette = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399", "#facc15"];
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
function BaseModal({ open, title, subtitle, onClose, children, maxWidth = "max-w-4xl", headerIcon = null, footer = null }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[92vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800`}>
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
              {headerIcon ? (
                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-2xl bg-[#E9F5E3] dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <div className="h-4 w-4 sm:h-5 sm:w-5">{headerIcon}</div>
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 dark:text-white truncate">{title}</h3>
                {subtitle ? <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{subtitle}</p> : null}
              </div>
            </div>
            <button onClick={onClose} className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0" aria-label="Fermer">
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(92vh-80px-72px)] overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </div>

        {/* FOOTER */}
        {footer ? (
          <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-4">
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
          <button type="button" onClick={onClose} disabled={loading}
            className="h-11 px-5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold shadow-sm transition-colors disabled:opacity-60 inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
            <>{cin ? <span className="mr-3">{cin}</span> : null}{matricule ? <span>{matricule}</span> : null}</>
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
  const [pageError, setPageError] = useState(""); // erreurs de la PAGE uniquement (chargement, suppression)

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editId, setEditId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, ""])));

  // Erreurs de formulaire : { fieldKey: message } + erreur serveur
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [formServerError, setFormServerError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");

  const [columnsOrder, setColumnsOrder] = useState(INITIAL_COLUMNS_ORDER);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  async function fetchData(search = "") {
    setLoading(true);
    setPageError("");
    try {
      const res = await getEmployees(search);
      setRows(res.data?.employees || []);
      setCurrentPage(1);
    } catch (e) {
      setPageError(e?.response?.data?.message || "Erreur chargement");
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
    const savedOrder = localStorage.getItem("columnsOrder");
    const savedVisible = localStorage.getItem("visibleColumns");
    if (savedOrder) { try { setColumnsOrder(JSON.parse(savedOrder)); } catch { setColumnsOrder(INITIAL_COLUMNS_ORDER); } }
    if (savedVisible) { try { setVisibleColumns(JSON.parse(savedVisible)); } catch { setVisibleColumns(DEFAULT_VISIBLE_COLUMNS); } }
    fetchData("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { localStorage.setItem("columnsOrder", JSON.stringify(columnsOrder)); }, [columnsOrder]);
  useEffect(() => { localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns)); }, [visibleColumns]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated = useMemo(() => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [rows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [q]);

  function resetModalErrors() {
    setFormFieldErrors({});
    setFormServerError("");
    setSuccessMsg("");
  }

  function openCreate() {
    resetModalErrors();
    setForm(Object.fromEntries(FIELDS.map((f) => [f.key, ""])));
    setMode("create");
    setEditId(null);
    setOpen(true);
  }

  function openEdit(row) {
    resetModalErrors();
    const next = {};
    for (const f of FIELDS) {
      next[f.key] = f.type === "date" ? toInputDate(row?.[f.key]) : row?.[f.key] ?? "";
    }
    setForm(next);
    setMode("edit");
    setEditId(row._id);
    setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    resetModalErrors();

    // --- Validation côté client ---
    const clientErrors = validateForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFormFieldErrors(clientErrors);
      return; // stopper ici, pas d'appel API
    }

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
      setTimeout(() => { setOpen(false); resetModalErrors(); }, 700);
    } catch (e2) {
      // Erreur serveur → affichée dans la modal
      const msg = e2?.response?.data?.message || "Une erreur est survenue lors de la sauvegarde.";
      setFormServerError(msg);

      // Si le serveur retourne des erreurs par champ (optionnel)
      const serverFieldErrors = e2?.response?.data?.errors;
      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        setFormFieldErrors(serverFieldErrors);
      }
    }
  }

  function askDelete(row) {
    setPageError("");
    setDeleteTarget(row);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    setPageError("");
    try {
      await deleteEmployee(deleteTarget._id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchData(q);
    } catch (e) {
      setPageError(e?.response?.data?.message || "Erreur suppression");
    } finally {
      setDeleteLoading(false);
    }
  }

  function toggleColumnVisibility(key) {
    setVisibleColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function handleDragStart(e, columnKey) { setDraggedColumn(columnKey); e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function handleDrop(e, targetColumnKey) {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnKey) { setDraggedColumn(null); return; }
    const di = columnsOrder.indexOf(draggedColumn);
    const ti = columnsOrder.indexOf(targetColumnKey);
    if (di === -1 || ti === -1) { setDraggedColumn(null); return; }
    const newOrder = [...columnsOrder];
    newOrder.splice(di, 1);
    newOrder.splice(ti, 0, draggedColumn);
    setColumnsOrder(newOrder);
    setDraggedColumn(null);
  }

  const visibleFields = columnsOrder
    .filter((key) => visibleColumns.includes(key))
    .map((key) => FIELDS_MAP[key])
    .filter(Boolean);

  // Nombre total d'erreurs pour le résumé
  const totalFieldErrors = Object.keys(formFieldErrors).length;

  const inputBaseCls = "w-full h-11 rounded-2xl border px-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors bg-white dark:bg-gray-800";
  const inputValidCls = "border-gray-200 dark:border-gray-700 focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/15";
  const inputErrorCls = "border-red-400 dark:border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:border-red-500 focus:ring-4 focus:ring-red-400/20";

  function getInputCls(key) {
    return `${inputBaseCls} ${formFieldErrors[key] ? inputErrorCls : inputValidCls}`;
  }
  function getSelectCls(key) {
    return `${getInputCls(key)} appearance-none cursor-pointer pr-10`;
  }

  return (
    <div className="min-h-screen bg-[#eef7ea] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-5 sm:mb-7">
          Liste des employés
        </h1>

        {/* TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#4E8F2F] dark:text-emerald-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData(q)}
              placeholder="Rechercher par nom, agence, CIN, matricule..."
              className="w-full h-11 sm:h-14 rounded-full bg-white dark:bg-gray-900 border border-[#D7EBCF] dark:border-gray-800 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm sm:text-[15px] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/15 transition"
            />
          </div>

          <div className="flex gap-2 sm:gap-3 w-full lg:w-auto">
            {columnsOrder.filter((k) => !visibleColumns.includes(k)).length > 0 && (
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setColumnMenuOpen(!columnMenuOpen)}
                  className="h-11 sm:h-14 px-3 sm:px-6 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 font-semibold text-xs sm:text-[15px] shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{columnsOrder.filter((k) => !visibleColumns.includes(k)).length} masquée(s)</span>
                  <span className="sm:hidden text-xs">{columnsOrder.filter((k) => !visibleColumns.includes(k)).length}</span>
                </button>

                {columnMenuOpen && (
                  <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={() => setColumnMenuOpen(false)} />
                    <div className="absolute top-0 right-0 mt-2 sm:mt-12 mr-2 sm:mr-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-orange-200 dark:border-orange-900/50 overflow-hidden z-50 min-w-[280px] sm:min-w-[300px]">
                      <div className="px-4 py-2 sm:py-3 border-b border-orange-100 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-900">
                        <p className="text-xs sm:text-sm font-extrabold text-orange-700 dark:text-orange-400">Colonnes masquées</p>
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5 sm:mt-1 hidden sm:block">Cliquez pour réafficher</p>
                      </div>
                      <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                        {columnsOrder.filter((k) => !visibleColumns.includes(k)).map((key) => {
                          const field = FIELDS_MAP[key];
                          if (!field) return null;
                          return (
                            <button key={key} onClick={() => { toggleColumnVisibility(key); setColumnMenuOpen(false); }}
                              className="w-full text-left px-4 py-2 sm:py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-orange-50 dark:border-orange-900/30 last:border-b-0 flex items-center gap-3">
                              <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{field.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={openCreate}
              className="h-11 sm:h-14 flex-1 sm:flex-none px-4 sm:px-8 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-[15px] shadow-md transition inline-flex items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap">
              <span className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="hidden sm:inline">Ajouter un employé</span>
              <span className="sm:hidden text-xs">Ajouter</span>
            </button>
          </div>
        </div>

        {/* PAGE-LEVEL ERROR (chargement / suppression uniquement) */}
        {pageError && (
          <div className="mb-5 rounded-xl sm:rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400">
            {pageError}
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-sm border border-[#E9F5E3] dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] sm:min-w-[1200px]">
              <thead>
                <tr className="bg-[#E9F5E3] dark:bg-gray-800 border-b border-[#D7EBCF] dark:border-gray-700">
                  {visibleFields.map((f) => (
                    <th key={f.key} draggable
                      onDragStart={(e) => handleDragStart(e, f.key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, f.key)}
                      className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-extrabold uppercase tracking-wider text-[#3d7a1a] dark:text-emerald-400 whitespace-nowrap cursor-move select-none transition-all ${draggedColumn === f.key ? "opacity-50 bg-yellow-100 dark:bg-yellow-900/30" : "hover:bg-[#d9f0cd] dark:hover:bg-gray-700/50"}`}>
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <span className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 opacity-60 flex-shrink-0" />
                          <span className="truncate">{f.label}</span>
                        </span>
                        <button onClick={() => toggleColumnVisibility(f.key)} title="Masquer cette colonne"
                          className="p-1 rounded hover:bg-white/60 dark:hover:bg-gray-600/60 transition-colors flex-shrink-0 hidden sm:block">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-[#4E8F2F] dark:text-emerald-400" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-extrabold uppercase tracking-wider text-[#3d7a1a] dark:text-emerald-400 whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={visibleFields.length + 1} className="py-12 sm:py-20 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">Chargement…</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={visibleFields.length + 1} className="py-12 sm:py-20 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">Aucun employé trouvé.</td></tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r._id} className="hover:bg-[#f0faef] dark:hover:bg-gray-800/60 transition-colors">
                      {visibleFields.map((f) => {
                        if (f.key === "fullName") return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar name={r.fullName} />
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white hidden sm:inline">{r.fullName || "—"}</span>
                            </div>
                          </td>
                        );
                        if (f.key === "societe") return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                            {r.societe ? (
                              <span className={`inline-flex text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${SOCIETE_COLORS[r.societe] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{r.societe}</span>
                            ) : <span className="text-xs text-gray-400 dark:text-gray-500">—</span>}
                          </td>
                        );
                        if (f.key === "typeContrat") return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                            {r.typeContrat ? (
                              <span className={`inline-flex text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${CONTRACT_COLORS[r.typeContrat] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{r.typeContrat}</span>
                            ) : <span className="text-xs text-gray-400 dark:text-gray-500">—</span>}
                          </td>
                        );
                        if (f.key === "dateDebutContrat" || f.key === "dateFinContrat") return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {r[f.key] ? new Date(r[f.key]).toLocaleDateString("fr-FR") : "—"}
                          </td>
                        );
                        if (f.key === "cin" || f.key === "matricule" || f.key === "cnss") return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 text-xs sm:text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{r[f.key] || "—"}</td>
                        );
                        return (
                          <td key={f.key} className="px-3 sm:px-6 py-3 sm:py-5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r[f.key] || "—"}</td>
                        );
                      })}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button onClick={() => openEdit(r)} title="Modifier"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center hover:bg-[#E9F5E3] dark:hover:bg-gray-800 transition-colors">
                            <Pencil className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400" />
                          </button>
                          <button onClick={() => askDelete(r)} title="Supprimer"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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
          <div className="sm:hidden px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">Astuce : glissez pour réorganiser.</div>
        </div>

        {/* PAGINATION */}
        {rows.length > 0 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
            <p className="text-gray-400 dark:text-gray-500">
              Total :{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{rows.length}</span>{" "}
              employé{rows.length > 1 ? "s" : ""} — Page {currentPage} / {totalPages}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ===================== ADD/EDIT MODAL ===================== */}
      <BaseModal
        open={open}
        onClose={() => { setOpen(false); resetModalErrors(); }}
        title={mode === "create" ? "Ajouter un employé" : "Modifier l'employé"}
        subtitle={
          mode === "create"
            ? "Complétez les informations de l'employé puis enregistrez."
            : "Mettez à jour les informations puis enregistrez."
        }
        headerIcon={
          mode === "create"
            ? <UserPlus className="h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
            : <Pencil className="h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
        }
        footer={
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3 ml-auto">
              <button type="button"
                onClick={() => { setOpen(false); resetModalErrors(); }}
                className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Annuler
              </button>
              <button type="submit" form="employee-form"
                className="h-11 px-6 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-extrabold shadow-sm transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        }
      >
        {successMsg ? (
          <div className="rounded-2xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">{successMsg}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Mise à jour effectuée.</p>
            </div>
          </div>
        ) : (
          <form id="employee-form" onSubmit={onSubmit} className="space-y-4 sm:space-y-6">

            {/* ── BANDEAU D'ERREURS (résumé + serveur) ── */}
            {(totalFieldErrors > 0 || formServerError) && (
              <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 overflow-hidden">

                {/* Liste des erreurs de champs */}
                {totalFieldErrors > 0 && (
                  <ul className="px-4 py-3 space-y-1.5">
                    {Object.entries(formFieldErrors).map(([key, msg]) => (
                      <li key={key} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span><span className="font-bold">{FIELDS_MAP[key]?.label || key} :</span> {msg}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Erreur serveur */}
                {formServerError && (
                  <p className="px-4 py-3 text-xs text-red-700 dark:text-red-400">{formServerError}</p>
                )}
              </div>
            )}

            {/* ── EN-TÊTE DE SECTION ── */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Les champs marqués <span className="text-red-500 font-bold">*</span> sont obligatoires.
              </p>
            </div>

            {/* ── GRILLE DES CHAMPS ── */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              {FIELDS.map((f) => {
                const hasError = !!formFieldErrors[f.key];
                return (
                  <div key={f.key}>
                    <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      {f.label}
                      {f.required && (
                        <span className="ml-1 text-red-500 font-bold" title="Champ obligatoire">*</span>
                      )}
                    </label>

                    {f.type === "select" ? (
                      <div className="relative">
                        <select
                          value={form[f.key] ?? ""}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, [f.key]: e.target.value }));
                            if (formFieldErrors[f.key]) {
                              setFormFieldErrors((prev) => { const n = { ...prev }; delete n[f.key]; return n; });
                            }
                          }}
                          className={getSelectCls(f.key)}
                        >
                          <option value="">Choisir {f.label.toLowerCase()}…</option>
                          {f.options.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">▾</div>
                      </div>
                    ) : (
                      <input
                        type={f.type}
                        value={form[f.key] ?? ""}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, [f.key]: e.target.value }));
                          if (formFieldErrors[f.key]) {
                            setFormFieldErrors((prev) => { const n = { ...prev }; delete n[f.key]; return n; });
                          }
                        }}
                        className={getInputCls(f.key)}
                        inputMode={f.key === "cin" || f.key === "cnss" ? "numeric" : undefined}
                        placeholder={f.type === "date" ? "jj/mm/aaaa" : `Saisir ${f.label.toLowerCase()}`}
                      />
                    )}

                    {/* Message d'erreur inline sous le champ */}
                    {hasError && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {formFieldErrors[f.key]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </form>
        )}
      </BaseModal>


      {/* DELETE MODAL */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => { if (deleteLoading) return; setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        employee={deleteTarget}
      />
    </div>
  );
}