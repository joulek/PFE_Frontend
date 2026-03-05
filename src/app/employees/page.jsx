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
import { Search, Trash2, Pencil, X, UserPlus } from "lucide-react";

/* ========================= LISTES ========================= */
const GENRES      = [{ value: "F", label: "F" }, { value: "H", label: "H" }];
const SOCIETES    = [{ value: "optylab", label: "Optylab" }, { value: "optyGros", label: "OptyGros" }];
const CONTRAT_STE = [{ value: "optylab", label: "Optylab" }, { value: "optyGros", label: "OptyGros" }];
const TYPES_CONTRAT = [
  { value: "CIVP", label: "CIVP" }, { value: "CAIP", label: "CAIP" },
  { value: "Karama", label: "Karama" }, { value: "CDI avec PE", label: "CDI avec PE" },
  { value: "CDD (exp)", label: "CDD (exp)" }, { value: "CDI sans PE", label: "CDI sans PE" },
];
const AGENCES_TUNISIE = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba","Kairouan",
  "Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine","Monastir","Nabeul",
  "Sfax","Sidi Bouzid","Siliana","Sousse","Tataouine","Tozeur","Tunis","Zaghouan",
].map(v => ({ value: v, label: v }));

const FIELDS = [
  { key: "cin",              label: "N°CIN",              type: "text" },
  { key: "matricule",        label: "Matricule",           type: "text" },
  { key: "fullName",         label: "Nom & Prénom",        type: "text" },
  { key: "agence",           label: "Agence",              type: "select", options: AGENCES_TUNISIE },
  { key: "societe",          label: "Société",             type: "select", options: SOCIETES },
  { key: "poste",            label: "Poste",               type: "text" },
  { key: "departement",      label: "Département",         type: "text" },
  { key: "contratSociete",   label: "Contrat / Sté",       type: "select", options: CONTRAT_STE },
  { key: "typeContrat",      label: "Type de contrat",     type: "select", options: TYPES_CONTRAT },
  { key: "dateDebutContrat", label: "Date début contrat",  type: "date" },
  { key: "genre",            label: "Genre",               type: "select", options: GENRES },
  { key: "situation",        label: "Situation",           type: "text" },
  { key: "cnss",             label: "N°CNSS",              type: "text" },
  { key: "dateFinContrat",   label: "Date fin contrat",    type: "date" },
];

const CONTRACT_COLORS = {
  "CIVP":        "bg-purple-100 text-purple-700 border border-purple-200",
  "CAIP":        "bg-blue-100 text-blue-700 border border-blue-200",
  "Karama":      "bg-amber-100 text-amber-700 border border-amber-200",
  "CDI avec PE": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "CDI sans PE": "bg-green-100 text-green-700 border border-green-200",
  "CDD (exp)":   "bg-orange-100 text-orange-700 border border-orange-200",
};

const SOCIETE_COLORS = {
  optylab:  "bg-[#e8f5e1] text-[#3d7a1a] border border-[#b8dda0]",
  optyGros: "bg-blue-50 text-blue-700 border border-blue-200",
};

const PAGE_SIZE = 10;

/* ========================= UTILS ========================= */
function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function Avatar({ name }) {
  const letter = (name || "?")[0].toUpperCase();
  const palette = ["#4ade80","#60a5fa","#f472b6","#fb923c","#a78bfa","#34d399","#facc15"];
  const bg = palette[(name || "").charCodeAt(0) % palette.length];
  return (
    <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: bg }}>
      {letter}
    </div>
  );
}

/* ========================= MODAL ========================= */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-5 rounded-t-3xl">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

/* ========================= PAGE ========================= */
export default function EmployeesPage() {
  const router = useRouter();
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [error, setError]       = useState("");
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState("create");
  const [editId, setEditId]     = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map(f => [f.key, ""])));

  async function fetchData(search = "") {
    setLoading(true); setError("");
    try {
      const res = await getEmployees(search);
      setRows(res.data?.employees || []);
      setCurrentPage(1);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur chargement");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    // ✅ Guard : vérifier le token avant tout appel API
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");
    const role  = String(user?.role || "").toUpperCase();

    if (!token || (role !== "ADMIN" && role !== "ASSISTANTE_RH")) {
      router.replace("/login");
      return;
    }
    fetchData("");
  }, []);

  // ✅ Pagination
  const totalPages   = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated    = useMemo(() => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [rows, currentPage]);

  // Reset page quand search change
  useEffect(() => { setCurrentPage(1); }, [q]);

  function openCreate() {
    setForm(Object.fromEntries(FIELDS.map(f => [f.key, ""])));
    setMode("create"); setEditId(null); setOpen(true);
  }

  function openEdit(row) {
    const next = {};
    for (const f of FIELDS) next[f.key] = f.type === "date" ? toInputDate(row?.[f.key]) : (row?.[f.key] ?? "");
    setForm(next); setMode("edit"); setEditId(row._id); setOpen(true);
  }

  async function onSubmit(e) {
    e.preventDefault(); setError("");
    const payload = { ...form };
    payload.cin  = String(payload.cin  || "").replace(/\D/g, "");
    payload.cnss = String(payload.cnss || "").replace(/\D/g, "");
    if (!payload.dateDebutContrat) delete payload.dateDebutContrat;
    if (!payload.dateFinContrat)   delete payload.dateFinContrat;
    try {
      if (mode === "create") await createEmployee(payload);
      else await updateEmployee(editId, payload);
      setOpen(false); await fetchData(q);
    } catch (e2) { setError(e2?.response?.data?.message || "Erreur sauvegarde"); }
  }

  async function onDelete(id) {
    if (!confirm("Supprimer cet employé ?")) return;
    try { await deleteEmployee(id); await fetchData(q); }
    catch (e) { setError(e?.response?.data?.message || "Erreur suppression"); }
  }

  const inputCls  = "w-full h-11 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15 transition-colors";
  const selectCls = inputCls + " appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#eef7ea] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-8 py-10">

        {/* TITLE */}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-7">
          Liste des employés
        </h1>

        {/* TOOLBAR */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchData(q)}
              placeholder="Rechercher par nom, agence, CIN, matricule..."
              className="w-full h-12 pl-12 pr-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#6CB33F] focus:ring-4 focus:ring-[#6CB33F]/15 shadow-sm transition-colors"
            />
          </div>
          <button
            onClick={openCreate}
            className="h-12 px-6 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white text-sm font-bold flex items-center gap-2 shadow transition-colors whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un employé
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-5 py-3 text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* TABLE CARD — scroll horizontal */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {[
                    "Employé","N°CIN","Matricule","Agence","Société","Poste",
                    "Département","Contrat / Sté","Type contrat","Genre",
                    "N°CNSS","Date début","Date fin","Actions"
                  ].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={14} className="py-20 text-center text-sm text-gray-400 dark:text-gray-500">Chargement…</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={14} className="py-20 text-center text-sm text-gray-400 dark:text-gray-500">Aucun employé trouvé.</td></tr>
                ) : paginated.map(r => (
                  <tr key={r._id} className="hover:bg-[#f6fbf3] dark:hover:bg-gray-800/60 transition-colors">

                    {/* EMPLOYÉ */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.fullName} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.fullName || "—"}</span>
                      </div>
                    </td>

                    {/* CIN */}
                    <td className="px-5 py-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.cin || "—"}</td>

                    {/* MATRICULE */}
                    <td className="px-5 py-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.matricule || "—"}</td>

                    {/* AGENCE */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.agence || "—"}</td>

                    {/* SOCIÉTÉ */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.societe
                        ? <span className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full ${SOCIETE_COLORS[r.societe] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"}`}>{r.societe}</span>
                        : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                    </td>

                    {/* POSTE */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.poste || "—"}</td>

                    {/* DÉPARTEMENT */}
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.departement || "—"}</td>

                    {/* CONTRAT STE */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.contratSociete || "—"}</td>

                    {/* TYPE CONTRAT */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.typeContrat
                        ? <span className={`inline-flex text-xs font-semibold px-3 py-1 rounded-full ${CONTRACT_COLORS[r.typeContrat] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"}`}>{r.typeContrat}</span>
                        : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                    </td>

                    {/* GENRE */}
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{r.genre || "—"}</td>

                    {/* CNSS */}
                    <td className="px-5 py-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.cnss || "—"}</td>

                    {/* DATE DÉBUT */}
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {r.dateDebutContrat ? new Date(r.dateDebutContrat).toLocaleDateString("fr-FR") : "—"}
                    </td>

                    {/* DATE FIN */}
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {r.dateFinContrat ? new Date(r.dateFinContrat).toLocaleDateString("fr-FR") : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <button onClick={() => openEdit(r)} title="Modifier" className="text-[#6CB33F] hover:text-[#4E8F2F] transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(r._id)} title="Supprimer" className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER — count + pagination */}
        {rows.length > 0 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Total : <span className="font-semibold text-gray-600 dark:text-gray-300">{rows.length}</span> employé{rows.length > 1 ? "s" : ""} — Page {currentPage} / {totalPages}
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

      {/* MODAL */}
      <Modal
        open={open}
        title={mode === "create" ? "Ajouter un employé" : "Modifier l'employé"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={form[f.key] ?? ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="">Choisir {f.label.toLowerCase()}…</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    value={form[f.key] ?? ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={inputCls}
                    inputMode={f.key === "cin" || f.key === "cnss" ? "numeric" : undefined}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-semibold">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Annuler
            </button>
            <button type="submit" className="h-11 px-6 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white text-sm font-bold shadow transition-colors">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}