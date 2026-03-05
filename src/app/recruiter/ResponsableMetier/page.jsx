"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/ResponsableMetier.api";
import { getRoles } from "../../services/role.api";
import { getEmployees } from "../../services/employee.api";

import Pagination from "../../components/Pagination";
import { Trash2, Edit2 } from "lucide-react";
import {
  User,
  Mail,
  Users,
  ChevronDown,
  AlertTriangle,
  X,
  Search,
  Send,
  Check,
} from "lucide-react";

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function normalizeRole(role) {
  return safeStr(role).toUpperCase();
}

function splitFullName(fullName) {
  const s = safeStr(fullName);
  if (!s) return { prenom: "", nom: "" };
  const parts = s.split(/\s+/).filter(Boolean);
  const prenom = parts.shift() || "";
  const nom = parts.join(" ");
  return { prenom, nom };
}

const getRoleBadgeStyle = () => {
  return "bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 border border-[#d7ebcf] dark:border-gray-600";
};

/* ================= COMBOBOX EMPLOYEE ================= */
function EmployeeCombobox({
  employees,
  value,
  onChange,
  placeholder = "Choisir un employé...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  const selected = useMemo(() => {
    return employees.find((e) => String(e?._id) === String(value)) || null;
  }, [employees, value]);

  const filtered = useMemo(() => {
    const q = safeStr(query).toLowerCase();
    if (!q) return employees;

    return employees.filter((emp) => {
      const fullName = safeStr(emp?.fullName).toLowerCase();
      const poste = safeStr(emp?.poste).toLowerCase();
      const cin = safeStr(emp?.cin).toLowerCase();
      const matricule = safeStr(emp?.matricule).toLowerCase();
      return (
        fullName.includes(q) ||
        poste.includes(q) ||
        cin.includes(q) ||
        matricule.includes(q)
      );
    });
  }, [employees, query]);

  const label = selected
    ? `${safeStr(selected?.fullName)} — ${safeStr(selected?.poste) || "—"}`
    : "";

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-[#D7EBCF] dark:border-gray-600
          bg-white dark:bg-gray-700 px-4 py-3 text-left text-sm
          text-gray-800 dark:text-gray-100
          outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
          focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
          transition-colors flex items-center justify-between gap-3"
      >
        <span className={label ? "" : "text-gray-400 dark:text-gray-500"}>
          {label || placeholder}
        </span>
        <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-full rounded-2xl border border-[#D7EBCF] dark:border-gray-600
            bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
        >
          {/* Search inside dropdown */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom / poste / cin / matricule..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900 px-9 py-2.5 text-sm
                  text-gray-800 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-500
                  outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
                  focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Aucun résultat.
              </div>
            ) : (
              filtered.map((emp) => {
                const id = String(emp?._id);
                const isSelected = String(value) === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3
                      hover:bg-[#F0FAF0] dark:hover:bg-gray-700 transition-colors
                      ${isSelected ? "bg-[#E9F5E3] dark:bg-gray-700/60" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {safeStr(emp?.fullName) || "—"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {safeStr(emp?.poste) || "—"}
                        {safeStr(emp?.matricule) ? ` • ${safeStr(emp?.matricule)}` : ""}
                        {safeStr(emp?.cin) ? ` • CIN: ${safeStr(emp?.cin)}` : ""}
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400 shrink-0" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} employé(s)
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionResponsableMetierPage() {
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [q, setQ] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add|edit
  const [selectedUser, setSelectedUser] = useState(null);

  // form fields
  const [employeeId, setEmployeeId] = useState("");
  const [poste, setPoste] = useState("");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function resetForm(nextRoles = roles) {
    setEmployeeId("");
    setPoste("");

    setEmail("");
    setNom("");
    setPrenom("");
    setRole(nextRoles?.[0]?.name || "");

    setSelectedUser(null);
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function fetchRoles() {
    try {
      const res = await getRoles();
      const data = res.data;
      const arr = Array.isArray(data) ? data : data?.roles || [];

      const cleaned = arr
        .map((r) => ({ ...r, name: normalizeRole(r?.name) }))
        .filter((r) => r.name);

      const unique = Array.from(new Map(cleaned.map((r) => [r.name, r])).values());

      setRoles(unique);
      if (!role && unique.length > 0) setRole(unique[0].name);
      return unique;
    } catch (e) {
      console.log("fetchRoles error:", e?.message);
      return [];
    }
  }

  async function fetchEmployees() {
    try {
      const res = await getEmployees("");
      const arr = res.data?.employees || [];
      arr.sort((a, b) =>
        safeStr(a?.fullName).localeCompare(safeStr(b?.fullName))
      );
      setEmployees(arr);
      return arr;
    } catch (e) {
      console.log("fetchEmployees error:", e?.message);
      setEmployees([]);
      return [];
    }
  }

  function getFriendlyError(err) {
    const apiMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "";

    const msg = String(apiMsg);

    if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate")) {
      return "Cet email est déjà utilisé. Essayez un autre email.";
    }

    if (err?.response?.status === 409) {
      return "Cet email est déjà utilisé. Essayez un autre email.";
    }

    return "Une erreur est survenue. Veuillez réessayer.";
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await getUsers();
      const data = res.data;
      const arr = Array.isArray(data) ? data : data?.users || [];
      setUsers(arr);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
    fetchEmployees();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAddModal() {
    setModalMode("add");
    resetForm();
    setOpenModal(true);
  }

  function openEditModal(user) {
    setModalMode("edit");
    setSelectedUser(user);

    setEmployeeId(safeStr(user?.employeeId));
    setPoste(safeStr(user?.poste));

    setEmail(safeStr(user?.email));
    setNom(safeStr(user?.nom));
    setPrenom(safeStr(user?.prenom));
    setRole(normalizeRole(user?.role));

    setSuccessMessage("");
    setErrorMessage("");
    setOpenModal(true);
  }

  function onSelectEmployee(id) {
    const emp = employees.find((e) => String(e?._id) === String(id));
    setEmployeeId(id || "");

    if (!emp) {
      setPoste("");
      return;
    }

    setPoste(safeStr(emp?.poste));

    // Auto-fill nom/prenom depuis fullName (si champs vides)
    const { prenom: p, nom: n } = splitFullName(emp?.fullName);
    if (!safeStr(prenom)) setPrenom(p);
    if (!safeStr(nom)) setNom(n);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (modalMode === "add") {
        await createUser({
          employeeId: safeStr(employeeId),
          poste: safeStr(poste),

          nom: safeStr(nom),
          prenom: safeStr(prenom),
          email: safeStr(email).toLowerCase(),
          role: normalizeRole(role),
        });

        setSuccessMessage(
          `✅ Compte créé ! Un email d'activation a été envoyé à ${safeStr(email).toLowerCase()}.`
        );

        await fetchUsers();

        setTimeout(() => {
          setOpenModal(false);
          resetForm();
        }, 2500);
      } else {
        const userId = selectedUser?._id || selectedUser?.id;

        const payload = {};
        if (safeStr(employeeId)) payload.employeeId = safeStr(employeeId);
        if (safeStr(poste)) payload.poste = safeStr(poste);

        if (safeStr(nom)) payload.nom = safeStr(nom);
        if (safeStr(prenom)) payload.prenom = safeStr(prenom);
        if (safeStr(email)) payload.email = safeStr(email).toLowerCase();
        if (safeStr(role)) payload.role = normalizeRole(role);

        await updateUser(userId, payload);
        setOpenModal(false);
        await fetchUsers();
      }
    } catch (err) {
      setErrorMessage(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUserConfirmed() {
    if (!userToDelete) return;
    const userId = userToDelete?._id || userToDelete?.id;
    await deleteUser(userId);
    setOpenDeleteModal(false);
    setUserToDelete(null);
    fetchUsers();
  }

  const filteredUsers = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    const base = Array.isArray(users) ? users : [];
    if (!query) return base;

    return base.filter(
      (u) =>
        safeStr(u?.email).toLowerCase().includes(query) ||
        safeStr(u?.prenom).toLowerCase().includes(query) ||
        safeStr(u?.nom).toLowerCase().includes(query) ||
        safeStr(u?.role).toLowerCase().includes(query) ||
        safeStr(u?.poste).toLowerCase().includes(query)
    );
  }, [users, q]);

  const sortedUsers = [...filteredUsers].sort((a, b) =>
    safeStr(a?.email).localeCompare(safeStr(b?.email))
  );

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 px-6 py-10 transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
          Liste des responsables métier
        </h1>

        {/* SEARCH + ADD */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom, email, rôle, poste..."
              className="w-full rounded-full border border-[#D7EBCF] dark:border-gray-700 
                bg-white dark:bg-gray-800 py-3 pl-12 pr-5
                text-sm text-gray-800 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
                focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                shadow-sm transition-colors"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-full bg-[#6CB33F] dark:bg-emerald-600 
              px-6 py-3 text-sm font-semibold text-white 
              hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 
              shadow-md transition-colors whitespace-nowrap"
          >
            <User className="h-4 w-4" />
            Ajouter un responsable
          </button>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-colors duration-300">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6CB33F] border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0FAF0] dark:bg-gray-700 text-left">
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Poste
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Rôle
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Statut
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-gray-400 dark:text-gray-500"
                    >
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr
                      key={u._id || u.id}
                      className="hover:bg-[#F9FFF6] dark:hover:bg-transparent transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 font-bold text-sm">
                            {safeStr(u?.prenom).charAt(0).toUpperCase() ||
                              safeStr(u?.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {[safeStr(u?.prenom), safeStr(u?.nom)]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {safeStr(u?.email)}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {safeStr(u?.poste) || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeStyle()}`}
                        >
                          {safeStr(u?.role)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {u?.passwordSet ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            En attente
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#E9F5E3] dark:hover:bg-gray-700 transition-colors"
                          >
                            <Edit2 className="h-4 w-4 text-[#4E8F2F] dark:text-emerald-400" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setOpenDeleteModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ================= MODAL ADD / EDIT ================= */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => {
              setOpenModal(false);
              resetForm();
            }}
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-2xl transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {modalMode === "add"
                    ? "Ajouter un responsable métier"
                    : "Modifier l'utilisateur"}
                </h2>
                {modalMode === "add" && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-[#4E8F2F] dark:text-emerald-400 font-medium">
                    <Send className="h-3.5 w-3.5" />
                    Un email d&apos;activation sera envoyé automatiquement
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
              >
                <X className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              </button>
            </div>

            {successMessage && (
              <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-400">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* ✅ EMPLOYEE DROPDOWN WITH SEARCH INSIDE */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Employé
                  </label>

                  <EmployeeCombobox
                    employees={employees}
                    value={employeeId}
                    onChange={(id) => onSelectEmployee(id)}
                    placeholder="Choisir un employé..."
                  />
                </div>

                {/* POSTE (readonly) */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Poste
                  </label>
                  <input
                    type="text"
                    value={poste}
                    readOnly
                    className="w-full rounded-xl border border-[#D7EBCF] dark:border-gray-600 
                      bg-gray-50 dark:bg-gray-700/60 py-3 px-4
                      text-sm text-gray-700 dark:text-gray-200 
                      outline-none"
                    placeholder="Auto depuis l'employé sélectionné"
                  />
                </div>

                {/* PRENOM */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#D7EBCF] dark:border-gray-600 
                      bg-white dark:bg-gray-700 py-3 px-4
                      text-sm text-gray-800 dark:text-gray-100 
                      placeholder-gray-400 dark:placeholder-gray-500
                      outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
                      focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500"
                  />
                </div>

                {/* NOM */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#D7EBCF] dark:border-gray-600 
                      bg-white dark:bg-gray-700 py-3 px-4
                      text-sm text-gray-800 dark:text-gray-100 
                      placeholder-gray-400 dark:placeholder-gray-500
                      outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
                      focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F] dark:text-emerald-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#D7EBCF] dark:border-gray-600 
                        bg-white dark:bg-gray-700 py-3 pl-10 pr-4
                        text-sm text-gray-800 dark:text-gray-100 
                        placeholder-gray-400 dark:placeholder-gray-500
                        outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500
                        focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* ROLE */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
                    Rôle de l&apos;utilisateur
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F] dark:text-emerald-400" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="w-full appearance-none rounded-xl border border-[#D7EBCF] dark:border-gray-600
                        bg-white dark:bg-gray-700 py-3 pl-10 pr-10 
                        text-sm text-gray-800 dark:text-gray-100
                        outline-none focus:border-[#6CB33F] dark:focus:border-emerald-500 
                        focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500"
                    >
                      {roles.map((r) => (
                        <option key={r._id || r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenModal(false);
                      resetForm();
                    }}
                    className="rounded-full border border-[#D7EBCF] dark:border-gray-600 px-6 py-2.5
                      text-sm font-semibold text-gray-700 dark:text-gray-200 
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    disabled={loading}
                    className="rounded-full bg-[#6CB33F] dark:bg-emerald-600 px-6 py-2.5
                      text-sm font-semibold text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500
                      shadow-md transition-colors disabled:opacity-60"
                  >
                    {loading ? "En cours..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => {
              setOpenDeleteModal(false);
              setUserToDelete(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Confirmer la suppression ?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Supprimer{" "}
              <span className="font-semibold">
                {safeStr(userToDelete?.email)}
              </span>{" "}
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="rounded-full border border-[#D7EBCF] dark:border-gray-600 px-5 py-2
                  text-sm font-semibold text-gray-700 dark:text-gray-200
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUserConfirmed}
                className="rounded-full bg-red-600 px-5 py-2
                  text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}