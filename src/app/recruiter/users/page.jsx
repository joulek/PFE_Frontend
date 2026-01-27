"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  createUser,
  updateUserRole,
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

const getRoleBadgeStyle = () =>
  "bg-[#E9F5E3] text-[#4E8F2F] border border-[#d7ebcf]";

export default function GestionUtilisateursPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [q, setQ] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  function resetForm() {
    setEmail("");
    setPassword("");
    setRole(roles?.[0]?.name || "");
    setSelectedUser(null);
  }

  async function fetchRoles() {
    const res = await getRoles();
    const arr = Array.isArray(res.data) ? res.data : res.data?.roles || [];
    setRoles(arr.map((r) => ({ ...r, name: normalizeRole(r.name) })));
  }

  async function fetchUsers() {
    const res = await getUsers();
    const arr = Array.isArray(res.data) ? res.data : res.data?.users || [];
    setUsers(arr);
  }

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  function openEditModal(user) {
    setModalMode("edit");
    setSelectedUser(user);
    setEmail(user.email);
    setRole(normalizeRole(user.role));
    setOpenModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (modalMode === "add") {
      await createUser({
        email: safeStr(email).toLowerCase(),
        password,
        role,
      });
    } else {
      await updateUserRole(selectedUser._id, role);
    }

    setOpenModal(false);
    fetchUsers();
  }

  const filteredUsers = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    return users.filter(
      (u) =>
        safeStr(u.email).toLowerCase().includes(query) ||
        safeStr(u.role).toLowerCase().includes(query)
    );
  }, [users, q]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#F0FAF0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
          Liste des utilisateurs
        </h1>

        {/* SEARCH */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (email, rôle)…"
            className="w-full rounded-full bg-white shadow-sm border border-gray-100 pl-12 pr-5 py-3"
          />
        </div>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden lg:block bg-white rounded-3xl shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#E9F5E3] text-[#4E8F2F]">
              <tr>
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
                <tr key={u._id}>
                  <td className="px-8 py-5">{u.email}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeStyle()}`}>
                      {normalizeRole(u.role)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="text-[#4E8F2F] mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(u);
                        setOpenDeleteModal(true);
                      }}
                      className="text-red-500"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-8 py-5 flex justify-between text-sm text-gray-500">
            <p>Total : {filteredUsers.length}</p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* ================= MOBILE CARDS (SAME AS CANDIDATURES) ================= */}
        <div className="lg:hidden space-y-6">
          {paginatedUsers.map((u) => (
            <div
              key={u._id}
              className="bg-white rounded-3xl shadow-lg p-6"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {safeStr(u.email).split("@")[0]}
                  </h3>
                  <p className="text-sm text-gray-600">{u.email}</p>
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
    </div>
  );
}
