"use client";

import { useEffect, useMemo, useState } from "react";
import { getUsers, createUser, updateUserRole, deleteUser } from "../../services/user.api";
import { getRoles } from "../../services/role.api";

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function normalizeRole(role) {
  return safeStr(role).toUpperCase();
}


export default function GestionUtilisateursPage() {
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // search
  const [q, setQ] = useState("");

  // modal add user
  const [openAdd, setOpenAdd] = useState(false);

  // drawer edit user
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // edit form
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  // add form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetAddForm(defaultRoleName) {
    setEmail("");
    setPassword("");
    setRole(defaultRoleName || roles?.[0]?.name || "");
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

      const unique = Array.from(new Map(cleaned.map((r) => [r.name, r])).values());

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
    setError("");
    setLoading(true);

    try {
      const res = await getUsers();
      const data = res.data;
      const arr = Array.isArray(data) ? data : data?.users || [];
      setUsers(arr);
    } catch (e) {
      setError(
        safeStr(e?.response?.data?.message) ||
          safeStr(e?.message) ||
          "Erreur lors du chargement des utilisateurs"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const rr = await fetchRoles();
      await fetchUsers();

      if (rr.length > 0 && !role) {
        resetAddForm(rr[0].name);
      }
    })();
  }, []);

  /* ================= ADD USER ================= */
  async function handleAddUser(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !role) {
      setError("Veuillez remplir email, mot de passe et rôle.");
      return;
    }

    setLoading(true);
    try {
      await createUser({
        email: safeStr(email).toLowerCase(),
        password: safeStr(password),
        role: normalizeRole(role),
      });

      setSuccess("Utilisateur ajouté avec succès ✅");
      resetAddForm(roles?.[0]?.name || "");
      setOpenAdd(false);
      await fetchUsers();
    } catch (e) {
      setError(
        safeStr(e?.response?.data?.message) ||
          safeStr(e?.message) ||
          "Erreur lors de l'ajout de l'utilisateur"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= OPEN EDIT DRAWER ================= */
  function openEditDrawer(user) {
    setSelectedUser(user);

    setEditEmail(safeStr(user?.email));
    setEditRole(normalizeRole(user?.role) || roles?.[0]?.name || "");

    setOpenEdit(true);
    setError("");
    setSuccess("");
  }

  /* ================= UPDATE USER (email + role) ================= */
  async function handleUpdateUser() {
    if (!selectedUser) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userId = selectedUser?._id || selectedUser?.id;

      await updateUser(userId, {
        email: safeStr(editEmail).toLowerCase(),
        role: normalizeRole(editRole),
      });

      setSuccess("Utilisateur modifié ✅");
      setOpenEdit(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (e) {
      setError(
        safeStr(e?.response?.data?.message) ||
          safeStr(e?.message) ||
          "Erreur lors de la modification"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= DELETE USER ================= */
  async function handleDeleteUser(user) {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const ok = confirm(`Supprimer l'utilisateur ${safeStr(user?.email)} ?`);
    if (!ok) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await deleteUser(userId);
      setSuccess("Utilisateur supprimé ✅");
      await fetchUsers();
    } catch (e) {
      setError(
        safeStr(e?.response?.data?.message) ||
          safeStr(e?.message) ||
          "Erreur lors de la suppression"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= FILTER + SORT ================= */
  const filteredUsers = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    const base = Array.isArray(users) ? users : [];

    if (!query) return base;

    return base.filter((u) => {
      const email = safeStr(u?.email).toLowerCase();
      const role = safeStr(u?.role).toLowerCase();
      return email.includes(query) || role.includes(query);
    });
  }, [users, q]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) =>
      safeStr(a?.email).localeCompare(safeStr(b?.email))
    );
  }, [filteredUsers]);

  return (
    <div className="min-h-screen bg-[#eef8ee] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-5xl font-extrabold text-slate-900">
            Liste des Utilisateurs
          </h1>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex w-full items-center gap-2 rounded-full bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
              <span className="text-slate-400">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (email, rôle)..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <button
              onClick={() => {
                setOpenAdd(true);
                resetAddForm(roles?.[0]?.name || "");
              }}
              className="rounded-full bg-[#6bb43f] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:brightness-95"
            >
              + Ajouter
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* TABLE */}
        <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#e8f6e3] text-[#3a7c2f]">
                <th className="px-6 py-5 font-extrabold uppercase tracking-wide">
                  Email
                </th>
                <th className="px-6 py-5 font-extrabold uppercase tracking-wide">
                  Rôle
                </th>
                <th className="px-6 py-5 font-extrabold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={3}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr key={u?._id || u?.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-6 font-semibold text-slate-900">
                      {safeStr(u?.email)}
                    </td>

                    <td className="px-6 py-6">
                      <span
                        className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold ring-1 ${
                          u?.role
                        }`}
                      >
                        {normalizeRole(u?.role)}
                      </span>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openEditDrawer(u)}
                          className="rounded-full bg-[#6bb43f] px-5 py-2 text-xs font-extrabold text-white hover:brightness-95 disabled:opacity-50"
                          disabled={loading}
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          disabled={loading}
                        >
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

      {/* ================= MODAL ADD USER ================= */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenAdd(false)} />

          <div className="relative z-10 w-[95%] max-w-3xl rounded-[28px] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 px-8 pt-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Ajouter un utilisateur
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Email + mot de passe + rôle (dynamique)
                </p>
              </div>

              <button
                onClick={() => setOpenAdd(false)}
                className="rounded-full px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 max-h-[65vh] overflow-auto px-8 pb-8">
              <form onSubmit={handleAddUser} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: user@optylab.tn"
                    className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                    Rôle
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    {roles.length === 0 ? (
                      <option value="">Aucun rôle</option>
                    ) : (
                      roles.map((r) => (
                        <option key={r?._id || r?.name} value={r?.name}>
                          {r?.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-[#6bb43f] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:brightness-95 disabled:opacity-50"
                  >
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenAdd(false)}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER EDIT USER ================= */}
      {openEdit && selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenEdit(false)} />

          <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Modifier utilisateur
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {safeStr(selectedUser?.email)}
                </p>
              </div>

              <button
                onClick={() => setOpenEdit(false)}
                className="rounded-full px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                  Rôle
                </label>

                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                >
                  {roles.map((r) => (
                    <option key={r?._id || r?.name} value={r?.name}>
                      {r?.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleUpdateUser}
                disabled={loading}
                className="w-full rounded-full bg-[#6bb43f] px-6 py-3 text-sm font-extrabold text-white hover:brightness-95 disabled:opacity-50"
              >
                {loading ? "Modification..." : "Enregistrer"}
              </button>

              <button
                onClick={() => handleDeleteUser(selectedUser)}
                disabled={loading}
                className="w-full rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Supprimer utilisateur
              </button>

              <button
                onClick={() => setOpenEdit(false)}
                className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
