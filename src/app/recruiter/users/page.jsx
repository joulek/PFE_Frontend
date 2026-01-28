"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/user.api";

import {
  User,
  Mail,
  Lock,
  Users,
  ChevronDown,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";

import { getRoles } from "../../services/role.api";
import Pagination from "../../components/Pagination";

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}
function normalizeRole(role) {
  return safeStr(role).toUpperCase();
}

/* ================= ROLE BADGE STYLES ================= */
const getRoleBadgeStyle = () => {
  return "bg-[#E9F5E3] text-[#4E8F2F] border border-[#d7ebcf]";
};

export default function GestionUtilisateursPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [q, setQ] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  function resetForm(nextRoles = roles) {
    setEmail("");
    setPassword("");
    setNom("");
    setPrenom("");
    setRole(nextRoles?.[0]?.name || "");
    setSelectedUser(null);
  }

  /* ================= FETCH ROLES ================= */
  async function fetchRoles() {
    try {
      const res = await getRoles();
      const data = res.data;
      const arr = Array.isArray(data) ? data : data?.roles || [];

      const cleaned = arr
        .map((r) => ({
          ...r,
          name: normalizeRole(r?.name),
        }))
        .filter((r) => r.name);

      const unique = Array.from(
        new Map(cleaned.map((r) => [r.name, r])).values(),
      );

      setRoles(unique);

      if (!role && unique.length > 0) {
        setRole(unique[0].name);
      }

      return unique;
    } catch (e) {
      console.log("fetchRoles error:", e?.message);
      return [];
    }
  }

  /* ================= FETCH USERS ================= */
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
    fetchUsers();
  }, []);

  /* ================= MODALS ================= */
  function openAddModal() {
    setModalMode("add");
    resetForm();
    setOpenModal(true);
  }

  function openEditModal(user) {
    setModalMode("edit");
    setSelectedUser(user);

    setEmail(safeStr(user?.email));
    setNom(safeStr(user?.nom)); // ✅ AJOUT
    setPrenom(safeStr(user?.prenom)); // ✅ AJOUT

    setPassword("");
    setRole(normalizeRole(user?.role));
    setOpenModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (modalMode === "add") {
        await createUser({
          nom: safeStr(nom),
          prenom: safeStr(prenom),
          email: safeStr(email).toLowerCase(),
          password: safeStr(password),
          role: normalizeRole(role),
        });
      } else {
    const userId = selectedUser?._id || selectedUser?.id;

    const payload = {};
    if (safeStr(nom)) payload.nom = safeStr(nom);
    if (safeStr(prenom)) payload.prenom = safeStr(prenom);
    if (safeStr(email)) payload.email = safeStr(email).toLowerCase();
    if (safeStr(role)) payload.role = normalizeRole(role);

    await updateUser(userId, payload);
  }

      setOpenModal(false);
      await fetchUsers();
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

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    const base = Array.isArray(users) ? users : [];
    if (!query) return base;
    return base.filter(
      (u) =>
        safeStr(u?.email).toLowerCase().includes(query) ||
        safeStr(u?.prenom).toLowerCase().includes(query) ||
        safeStr(u?.nom).toLowerCase().includes(query) ||
        safeStr(u?.role).toLowerCase().includes(query),
    );
  }, [users, q]);

  const sortedUsers = [...filteredUsers].sort((a, b) =>
    safeStr(a?.email).localeCompare(safeStr(b?.email)),
  );

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // إذا user كتب search، رجّع للصفحة 1
  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
          Liste des utilisateurs
        </h1>

        {/* SEARCH + ADD (نفس design متاعك) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F]" />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (email, rôle)…"
              className="
                w-full rounded-full bg-white shadow-sm border border-gray-100
                pl-12 pr-5 py-3
                text-sm text-gray-700 outline-none
                focus:border-[#6CB33F]
                focus:ring-1 focus:ring-[#6CB33F]
              "
            />
          </div>

          <button
            onClick={openAddModal}
            className="rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] px-6 py-3 text-sm font-semibold text-white"
          >
            + Ajouter un utilisateur
          </button>
        </div>

        {/* ================= DESKTOP TABLE (نفس design متاعك) ================= */}
        <div className="hidden lg:block bg-white rounded-3xl shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
              <tr>
                <th className="px-8 py-5 text-xs font-extrabold uppercase">
                  Prénom
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase">
                  Nom
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase">
                  Utilisateur
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase">
                  Rôle
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase">
                  Date
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((u) => (
                <tr key={u._id} className="hover:bg-green-50/40 transition">
                  {/* PRENOM */}
                  <td className="px-8 py-5 font-semibold text-gray-900">
                    {safeStr(u?.prenom) || "-"}
                  </td>

                  {/* NOM */}
                  <td className="px-8 py-5 font-semibold text-gray-900">
                    {safeStr(u?.nom) || "-"}
                  </td>

                  {/* UTILISATEUR (avatar + email) */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-[#E9F5E3] text-[#4E8F2F]
                          flex items-center justify-center font-extrabold"
                      >
                        {(
                          safeStr(u?.prenom)[0] || safeStr(u?.email)[0]
                        ).toUpperCase()}
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">
                          {safeStr(u?.email)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeStyle(
                        u?.role,
                      )}`}
                    >
                      {normalizeRole(u?.role)}
                    </span>
                  </td>

                  {/* DATE */}
                  <td className="px-8 py-5 text-gray-600">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="text-[#4E8F2F] font-semibold hover:underline mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(u);
                        setOpenDeleteModal(true);
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-8 py-5 flex items-center justify-between text-sm text-gray-500">
            <p>Total : {sortedUsers.length}</p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* ================= MOBILE CARDS (زيادة فقط) ================= */}
        <div className="lg:hidden space-y-6">
          {paginatedUsers.map((u) => (
            <div key={u._id} className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {safeStr(u.email).split("@")[0]}
                  </h3>
                  <p className="text-sm text-gray-600">{safeStr(u.email)}</p>

                  <p className="text-sm text-gray-600">—</p>

                  <p className="text-sm text-[#4E8F2F] font-semibold underline">
                    Profil utilisateur
                  </p>
                </div>

                <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#E9F5E3] text-[#4E8F2F]">
                  {normalizeRole(u.role)}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </span>

                <button
                  onClick={() => openEditModal(u)}
                  className="rounded-full bg-[#E9F5E3] px-5 py-2 text-sm font-semibold text-[#4E8F2F]"
                >
                  Modifier
                </button>
              </div>

              {/* نفس actions متاع desktop في mobile (اختياري: delete) */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setUserToDelete(u);
                    setOpenDeleteModal(true);
                  }}
                  className="text-red-500 hover:underline text-sm font-semibold"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ================= MODAL ADD/EDIT (نفس design متاعك) ================= */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenModal(false)}
          />

          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            {/* ICON */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F5E3]">
              <User className="h-7 w-7 text-[#4E8F2F]" />
            </div>

            {/* TITLE */}
            <h2 className="text-center text-2xl font-extrabold text-gray-900">
              {modalMode === "add"
                ? "Ajouter un utilisateur"
                : "Modifier un utilisateur"}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Remplissez les informations ci-dessous pour créer un nouvel accès
              à la plateforme.
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* EMAIL */}
              {/* PRENOM */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-900">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex : Ahmed"
                  required
                  className="w-full rounded-xl border border-[#D7EBCF] bg-white py-3 px-4
      text-sm outline-none focus:border-[#6CB33F]
      focus:ring-1 focus:ring-[#6CB33F]"
                />
              </div>

              {/* NOM */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-900">
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Ben Ali"
                  required
                  className="w-full rounded-xl border border-[#D7EBCF] bg-white py-3 px-4
      text-sm outline-none focus:border-[#6CB33F]
      focus:ring-1 focus:ring-[#6CB33F]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-900">
                  Email professionnel
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F]" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@entreprise.com"
                    required
                    className="w-full rounded-xl border border-[#D7EBCF] bg-white py-3 pl-10 pr-4
                      text-sm outline-none focus:border-[#6CB33F]
                      focus:ring-1 focus:ring-[#6CB33F]"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-900">
                  Mot de passe
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F]" />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={modalMode === "add"}
                    className="w-full rounded-xl border border-[#D7EBCF] bg-white py-3 pl-10 pr-4
                      text-sm outline-none focus:border-[#6CB33F]
                      focus:ring-1 focus:ring-[#6CB33F]"
                  />
                </div>

                {modalMode === "add" && (
                  <p className="mt-1 text-xs text-gray-500">
                    L&apos;utilisateur devra changer son mot de passe à la
                    première connexion.
                  </p>
                )}
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-900">
                  Rôle de l&apos;utilisateur
                </label>

                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F]" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full appearance-none rounded-xl border border-[#D7EBCF]
                      bg-white py-3 pl-10 pr-10 text-sm outline-none
                      focus:border-[#6CB33F] focus:ring-1 focus:ring-[#6CB33F]"
                  >
                    <option value="">Choisir un rôle</option>
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#6CB33F] py-3 text-sm font-semibold text-white
                    hover:bg-[#4E8F2F] disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DELETE (نفس design متاعك) ================= */}
      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenDeleteModal(false)}
          />

          {/* MODAL */}
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-extrabold text-gray-900">
                Supprimer l&apos;utilisateur
              </h2>
              <button onClick={() => setOpenDeleteModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="mt-1 text-sm font-semibold text-red-500">
              Cette action est irréversible
            </p>

            {/* CONTENT */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <div>
                <p className="text-gray-700">
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ?
                </p>
                <p className="font-bold text-gray-900">
                  {safeStr(userToDelete?.email)}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUserConfirmed}
                className="rounded-full bg-red-500 px-6 py-2 text-sm font-semibold text-white hover:bg-red-600"
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
