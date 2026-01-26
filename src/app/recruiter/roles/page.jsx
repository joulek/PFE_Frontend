"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/role.api";

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}


function normalizeRoleName(name) {
  return safeStr(name).toUpperCase().replace(/\s+/g, "_");
}

/* ================= PAGE ================= */
export default function GestionRolesPage() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  // search
  const [q, setQ] = useState("");

  // add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [roleName, setRoleName] = useState("");

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  // alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

useEffect(() => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    window.location.href = "/jobs";
    return;
  }

  if (String(user.role).toUpperCase() !== "ADMIN") {
    window.location.href = "/jobs"; // ولا /404
    return;
  }

  fetchRoles();
}, []);


  async function fetchRoles() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await getRoles();
      const data = res?.data;

      const arr = Array.isArray(data) ? data : data?.roles || [];
      setRoles(arr);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          safeStr(e?.message) ||
          "Erreur lors du chargement des rôles"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  async function handleAddRole(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalName = normalizeRoleName(roleName);
    if (!finalName) {
      setError("Veuillez saisir le nom du rôle.");
      return;
    }

    setLoading(true);
    try {
      await createRole(finalName);
      setSuccess("Rôle ajouté avec succès ✅");
      setRoleName("");
      setOpenAdd(false);
      await fetchRoles();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          safeStr(e?.message) ||
          "Erreur lors de l'ajout du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditRole(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalName = normalizeRoleName(editName);
    if (!finalName) {
      setError("Veuillez saisir le nom du rôle.");
      return;
    }

    setLoading(true);
    try {
      await updateRole(editId, finalName);
      setSuccess("Rôle modifié avec succès ✅");

      setOpenEdit(false);
      setEditId(null);
      setEditName("");

      await fetchRoles();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          safeStr(e?.message) ||
          "Erreur lors de la modification du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRole(roleId, roleLabel) {
    const ok = confirm(`Supprimer le rôle "${roleLabel}" ?`);
    if (!ok) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await deleteRole(roleId);
      setSuccess("Rôle supprimé ✅");
      await fetchRoles();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          safeStr(e?.message) ||
          "Erreur lors de la suppression du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRoles = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    const base = Array.isArray(roles) ? roles : [];
    if (!query) return base;

    return base.filter((r) => safeStr(r?.name).toLowerCase().includes(query));
  }, [roles, q]);

  const sortedRoles = useMemo(() => {
    return [...filteredRoles].sort((a, b) =>
      safeStr(a?.name).localeCompare(safeStr(b?.name))
    );
  }, [filteredRoles]);

  return (
    <div className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* TITLE */}
        <h1 className="text-[48px] font-extrabold text-slate-900">
          Liste des Rôles
        </h1>

        {/* ALERTS */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {/* SEARCH + ADD */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un rôle..."
              className="w-full rounded-full border border-slate-200 bg-white px-12 py-4 text-sm outline-none shadow-sm focus:border-slate-400"
            />
          </div>

          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-[#6bb43f] px-8 py-4 text-sm font-extrabold text-white shadow-md hover:brightness-95"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>

        {/* TABLE CARD */}
        <div className="mt-8 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-green-100 text-green-800">
                <tr>
                  <th className="px-6 py-5 text-sm font-extrabold uppercase tracking-wide">
                    Nom du rôle
                  </th>
                  <th className="px-6 py-5 text-sm font-extrabold uppercase tracking-wide text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {sortedRoles.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-500" colSpan={2}>
                      Aucun rôle trouvé.
                    </td>
                  </tr>
                ) : (
                  sortedRoles.map((r) => {
                    const id = r?._id || r?.id;
                    const name = safeStr(r?.name);

                    return (
                      <tr key={id}>
                        <td className="px-6 py-6">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-5 py-2 text-sm font-bold text-green-800 ring-1 ring-green-200">
                            {name || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-6">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                setOpenEdit(true);
                                setEditId(id);
                                setEditName(name);
                              }}
                              className="rounded-full bg-blue-50 px-6 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-200 hover:brightness-95"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() => handleDeleteRole(id, name)}
                              disabled={loading}
                              className="rounded-full bg-red-50 px-6 py-2 text-sm font-extrabold text-red-700 ring-1 ring-red-200 hover:brightness-95 disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          
        </div>
      </div>

      {/* ================= MODAL ADD ================= */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenAdd(false)}
          />

          <div className="relative z-10 w-[95%] max-w-3xl rounded-[28px] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 px-8 pt-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Ajouter un rôle
                </h2>
              
              </div>

              <button
                onClick={() => setOpenAdd(false)}
                className="rounded-full px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 max-h-[65vh] overflow-auto px-8 pb-8">
              <form onSubmit={handleAddRole} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                    Nom du rôle
                  </label>

                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="ex: IT_MANAGER"
                    className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                  />

               
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-[#6bb43f] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:brightness-95 disabled:opacity-50"
                  >
                    {loading ? "Ajout..." : "Enregistrer"}
                  </button>

                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT ================= */}
      {openEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setOpenEdit(false);
              setEditId(null);
              setEditName("");
            }}
          />

          <div className="relative z-10 w-[95%] max-w-3xl rounded-[28px] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 px-8 pt-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Modifier un rôle
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Modifier le nom du rôle sélectionné.
                </p>
              </div>

              <button
                onClick={() => {
                  setOpenEdit(false);
                  setEditId(null);
                  setEditName("");
                }}
                className="rounded-full px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 max-h-[65vh] overflow-auto px-8 pb-8">
              <form onSubmit={handleEditRole} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-extrabold uppercase tracking-wide text-slate-700">
                    Nouveau nom
                  </label>

                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="ex: HR_MANAGER"
                    className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-[#6bb43f] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:brightness-95 disabled:opacity-50"
                  >
                    {loading ? "Modification..." : "Enregistrer"}
                  </button>

                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
