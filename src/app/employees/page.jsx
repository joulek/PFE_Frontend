"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employee.api";
import { Plus, Search, Trash2, Pencil, X } from "lucide-react";

/* =========================
   LISTES (SELECT)
========================= */

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

// Toutes les villes / gouvernorats de Tunisie (liste utilisée pour "Agence")
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

/* =========================
   FIELDS
========================= */

const FIELDS = [
  { key: "cin", label: "N°CIN", type: "text" },
  { key: "matricule", label: "Matricule", type: "text" },
  { key: "fullName", label: "Nom & Prénom", type: "text" },

  // SELECT
  { key: "agence", label: "Agence", type: "select", options: AGENCES_TUNISIE },
  { key: "societe", label: "Société", type: "select", options: SOCIETES },

  { key: "poste", label: "Poste", type: "text" },
  { key: "departement", label: "Département", type: "text" },

  // SELECT
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

  // SELECT
  { key: "genre", label: "Genre", type: "select", options: GENRES },

  { key: "situation", label: "Situation", type: "text" },
  { key: "cnss", label: "N°CNSS", type: "text" },
  { key: "dateFinContrat", label: "Date fin contrat", type: "date" },
];

function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
    >
      <option value="">{placeholder || "Choisir..."}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function EmployeesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, ""]))
  );

  const columns = useMemo(
    () => [
      "cin",
      "matricule",
      "fullName",
      "agence",
      "societe",
      "poste",
      "departement",
      "contratSociete",
      "typeContrat",
      "genre",
      "cnss",
      "dateDebutContrat",
      "dateFinContrat",
    ],
    []
  );

  async function fetchData(search = "") {
    setLoading(true);
    setError("");
    try {
      const res = await getEmployees(search);
      setRows(res.data?.employees || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur chargement employés");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData("");
  }, []);

  function resetForm() {
    const base = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

    // valeurs par défaut utiles
    base.genre = "";
    base.societe = "";
    base.contratSociete = "";
    base.typeContrat = "";
    base.agence = "";

    setForm(base);
  }

  function openCreate() {
    resetForm();
    setMode("create");
    setEditId(null);
    setOpen(true);
  }

  function openEdit(row) {
    const next = {};
    for (const f of FIELDS) {
      if (f.type === "date") next[f.key] = toInputDate(row?.[f.key]);
      else next[f.key] = row?.[f.key] ?? "";
    }
    setForm(next);
    setMode("edit");
    setEditId(row?._id);
    setOpen(true);
  }

  function normalizePayload(values) {
    const payload = { ...values };

    // cin/cnss digits only
    payload.cin = String(payload.cin || "").replace(/\D/g, "");
    payload.cnss = String(payload.cnss || "").replace(/\D/g, "");

    // dates: si vide => supprimer
    if (!payload.dateDebutContrat) delete payload.dateDebutContrat;
    if (!payload.dateFinContrat) delete payload.dateFinContrat;

    return payload;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = normalizePayload(form);

    try {
      if (mode === "create") {
        await createEmployee(payload);
      } else {
        await updateEmployee(editId, payload);
      }
      setOpen(false);
      await fetchData(q);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Erreur sauvegarde");
    }
  }

  async function onDelete(id) {
    if (!confirm("Supprimer cet employé ?")) return;
    setError("");
    try {
      await deleteEmployee(id);
      await fetchData(q);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur suppression");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Gestion des employés
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            CRUD employés (CIN, Matricule, contrat, agence, société...)
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[360px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, agence, cin, matricule...)"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-slate-300"
            />
          </div>
          <button
            onClick={() => fetchData(q)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Rechercher
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#63A63B] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <Plus className="h-5 w-5" />
            Ajouter
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((k) => (
                  <th
                    key={k}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    {FIELDS.find((f) => f.key === k)?.label || k}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-slate-600"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-slate-600"
                  >
                    Aucun employé
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id} className="border-t">
                    {columns.map((k) => (
                      <td key={k} className="px-4 py-3 text-sm text-slate-800">
                        {k.includes("date")
                          ? r?.[k]
                            ? new Date(r[k]).toLocaleDateString("fr-FR")
                            : "—"
                          : r?.[k] ?? "—"}
                      </td>
                    ))}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => onDelete(r._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title={mode === "create" ? "Ajouter un employé" : "Modifier l'employé"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-sm font-semibold text-slate-800">
                  {f.label}
                </label>

                {f.type === "select" ? (
                  <SelectField
                    value={form[f.key]}
                    onChange={(val) =>
                      setForm((prev) => ({ ...prev, [f.key]: val }))
                    }
                    options={f.options || []}
                    placeholder={`Choisir ${f.label.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                    inputMode={
                      f.key === "cin" || f.key === "cnss" ? "numeric" : undefined
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#63A63B] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}