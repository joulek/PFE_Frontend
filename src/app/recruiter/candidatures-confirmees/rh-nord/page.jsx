"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Briefcase, CheckCircle2,
  Clock3, XCircle, X, Users, ChevronLeft, Mail, RefreshCw,
  UserPlus, Loader2, AlertCircle, ThumbsUp, ThumbsDown, AlertTriangle,
} from "lucide-react";
import api from "../../../services/api";

// ─────────────────────────────────────────────────────────
//  Config API
// ─────────────────────────────────────────────────────────
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ).replace(/\/$/, "");

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function insertEmployee(payload) {
  const res = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.status === 409) return { alreadyExists: true, employee: data.employee };
  if (!res.ok) throw new Error(data.message || "Erreur insertion");
  return { alreadyExists: false, employee: data.employee };
}

async function patchHiringStatus(interviewId, hiringStatus) {
  const res = await fetch(`${API_BASE}/api/interviews/${interviewId}/hiring-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ hiringStatus }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur mise à jour statut");
  return data;
}

// ─────────────────────────────────────────────────────────
//  Boutons Embaucher / Rejeter
// ─────────────────────────────────────────────────────────
function HiringStatusButtons({ candidature, onStatusChange }) {
  const storageKey = `hiring_status_${candidature._id}`;
  const [status, setStatus] = useState(() => {
    if (candidature.hiringStatus) return candidature.hiringStatus;
    try { return localStorage.getItem(storageKey) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function applyStatus(newStatus) {
    setLoading(true);
    setConfirm(null);
    try {
      await patchHiringStatus(candidature._id, newStatus);
      try { localStorage.setItem(storageKey, newStatus); } catch {}
      setStatus(newStatus);
      onStatusChange?.(candidature._id, newStatus);
    } catch (e) {
      alert(e.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  if (status === "EMBAUCHE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold whitespace-nowrap">
        <ThumbsUp className="w-3.5 h-3.5" /> Embauché
      </span>
    );
  }
  if (status === "REJETE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold whitespace-nowrap">
        <ThumbsDown className="w-3.5 h-3.5" /> Rejeté
      </span>
    );
  }

  if (confirm) {
    const isHire = confirm === "EMBAUCHE";
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-semibold ${isHire ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="whitespace-nowrap">{isHire ? "Confirmer l'embauche ?" : "Confirmer le rejet ?"}</span>
        <button onClick={() => applyStatus(confirm)} disabled={loading}
          className={`ml-1 px-2.5 py-1 rounded-full text-white font-bold transition-colors ${isHire ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}`}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Oui"}
        </button>
        <button onClick={() => setConfirm(null)} disabled={loading}
          className="px-2.5 py-1 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 font-bold">
          Non
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setConfirm("EMBAUCHE")} disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
        <ThumbsUp className="w-3.5 h-3.5" /> Embaucher
      </button>
      <button onClick={() => setConfirm("REJETE")} disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 text-red-600 text-xs font-bold transition-colors whitespace-nowrap">
        <ThumbsDown className="w-3.5 h-3.5" /> Rejeter
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateFull(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}
function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Modal Insérer Employé
// ─────────────────────────────────────────────────────────
function InsertEmployeeModal({ candidature, onClose, onSuccess }) {
  function extractFromCandidature(raw) {
    const pif = raw?.personalInfoForm || {};
    const ext = raw?.extracted?.parsed || {};
    const man = ext?.manual || {};
    const par = ext?.parsed || ext;
    const s = (v) => String(v || "").trim();

    return {
      fullName: s(raw.fullName) || s([raw.prenom, raw.nom].filter(Boolean).join(" ")),
      poste: s(raw.jobTitle),
      email: s(raw.email),
      telephone: s(raw.telephone) || s(pif.telephone) || s(par.telephone) || s(man.telephone),
      cin: s(pif.cin) || s(par.cin) || s(man.cin),
      cnss: s(pif.cnss) || s(par.cnss) || s(man.cnss),
      matricule: s(pif.matricule) || s(par.matricule) || s(man.matricule),
      agence: s(pif.agence) || s(par.agence) || s(man.agence),
      societe: s(pif.societe) || s(par.societe) || s(man.societe),
      departement: s(pif.departement) || s(par.departement) || s(man.departement),
      contratSociete: s(pif.contratSociete) || s(par.contratSociete) || s(man.contratSociete),
      typeContrat: s(pif.typeContrat) || s(par.typeContrat) || s(man.typeContrat),
      genre: s(pif.genre) || s(par.genre) || s(man.genre),
      situation:
        s(pif.situation) ||
        s(par.situation) ||
        s(man.situation) ||
        s(pif.situationFamiliale) ||
        s(par.situationFamiliale),
      dateDebutContrat: s(pif.dateDebutContrat) || s(par.dateDebutContrat) || "",
      dateFinContrat: s(pif.dateFinContrat) || s(par.dateFinContrat) || "",
    };
  }

  const LABELS = {
    cin: "N° CIN",
    matricule: "Matricule",
    agence: "Agence",
    societe: "Société",
    departement: "Département",
    contratSociete: "Contrat / Société",
    typeContrat: "Type de contrat",
    dateDebutContrat: "Date début contrat",
    dateFinContrat: "Date fin contrat",
    genre: "Genre",
    situation: "Situation familiale",
    cnss: "N° CNSS",
  };

  const SELECT_OPTIONS = {
    genre: ["", "Homme", "Femme"],
    situation: ["", "Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"],
    typeContrat: ["", "CIVP", "CAIP", "Karama", "CDI avec PE", "CDD (exp)", "CDI sans PE"],
    societe: ["", "Optylab", "OptyGros"],
    contratSociete: ["", "Optylab", "OptyGros"],
    agence: [
      "", "Tunis", "Ariana", "Ben Arous", "Manouba", "Bizerte", "Nabeul", "Zaghouan",
      "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
      "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Medenine",
      "Tataouine", "Gafsa", "Tozeur", "Kébili",
    ],
  };

  const DATE_FIELDS = ["dateDebutContrat", "dateFinContrat"];
  const REQUIRED = ["cin", "matricule"];
  const ALL_FIELDS = [
    "cin", "matricule", "agence", "societe", "departement",
    "contratSociete", "typeContrat", "dateDebutContrat",
    "dateFinContrat", "genre", "situation", "cnss",
  ];

  const [form, setForm] = useState(() => extractFromCandidature(candidature));
  const [loadingData, setLoadingData] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoadingData(true);
        const res = await fetch(`${API_BASE}/candidatures/${candidature.candidatureId || candidature._id}`, {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (res.ok) {
          const full = await res.json();
          const fetched = extractFromCandidature(full);
          setForm((prev) => {
            const merged = { ...prev };
            for (const [k, v] of Object.entries(fetched)) {
              if (v && !prev[k]) merged[k] = v;
            }
            return merged;
          });
        }
      } catch (e) {
        console.warn("Candidature fetch failed:", e?.message);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [candidature._id, candidature.candidatureId]);

  function handleChange(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const missingFields = ALL_FIELDS.filter((k) => !form[k]);
  const hasMissing = missingFields.length > 0;

  async function handleSubmit() {
    if (!form.cin.trim()) return setError("N° CIN est obligatoire");
    if (!form.matricule.trim()) return setError("Matricule est obligatoire");
    if (!form.fullName.trim()) return setError("Nom & Prénom est obligatoire");
    setError("");
    setSending(true);
    try {
      const res = await insertEmployee(form);
      onSuccess(res.alreadyExists ? "exists" : "done");
    } catch (e) {
      setError(e.message || "Erreur lors de l'insertion");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

        <div className="px-6 py-4 bg-[#E9F5E3] dark:bg-green-900/20 border-b border-[#d4edc4] dark:border-green-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6CB33F] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 dark:text-white text-base">Insérer dans les employés</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {loadingData
                  ? "Chargement des données du formulaire..."
                  : hasMissing
                    ? `${missingFields.length} champ${missingFields.length > 1 ? "s" : ""} à compléter`
                    : "Toutes les données sont disponibles ✓"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Avatar name={form.fullName || candidature.candidateName} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{form.fullName || candidature.candidateName || "—"}</p>
            <p className="text-xs text-gray-500 truncate">{form.poste || candidature.jobTitle || "Poste non renseigné"}</p>
          </div>
          {loadingData && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#6CB33F]" />
              Récupération des données...
            </div>
          )}
          {!loadingData && !hasMissing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Données complètes
            </span>
          )}
        </div>

        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#6CB33F]" />
              <span className="text-sm">Récupération des données du formulaire candidat...</span>
            </div>
          ) : (
            <>
              {!form.fullName && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-red-600 mb-1">Nom & Prénom *</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 bg-white dark:bg-gray-800 dark:text-white"
                    placeholder="Nom & Prénom complet"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALL_FIELDS.map((key) => {
                  const isRequired = REQUIRED.includes(key);
                  const isDate = DATE_FIELDS.includes(key);
                  const options = SELECT_OPTIONS[key];
                  const val = form[key] || "";
                  const isFilled = !!val;
                  const label = LABELS[key];

                  return (
                    <div key={key} className="relative">
                      <label
                        className={`block text-xs font-bold mb-1 ${
                          isRequired && !isFilled
                            ? "text-red-600"
                            : isFilled
                              ? "text-emerald-600"
                              : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {label}
                        {isRequired && <span className="ml-0.5 text-red-500">*</span>}
                        {isFilled && !isRequired && (
                          <span className="ml-1.5 text-emerald-500 text-[10px] font-normal">✓ récupéré</span>
                        )}
                      </label>

                      {options ? (
                        <select
                          value={val}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-white transition-colors ${
                            isRequired && !val
                              ? "border-red-300 focus:ring-red-300"
                              : isFilled
                                ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30"
                                : "border-gray-200 dark:border-gray-700 focus:ring-[#6CB33F]"
                          }`}
                        >
                          {options.map((o) => (
                            <option key={o} value={o}>
                              {o || `-- ${label} --`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={isDate ? "date" : "text"}
                          value={val}
                          onChange={(e) => handleChange(key, e.target.value)}
                          placeholder={isRequired ? `${label} obligatoire` : label}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-white transition-colors ${
                            isRequired && !val
                              ? "border-red-300 focus:ring-red-300"
                              : isFilled
                                ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30"
                                : "border-gray-200 dark:border-gray-700 focus:ring-[#6CB33F]"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-900/50">
          <div className="text-xs text-gray-400">
            {!loadingData && (
              hasMissing
                ? <span className="text-amber-600 font-semibold">⚠ {missingFields.length} champ{missingFields.length > 1 ? "s" : ""} manquant{missingFields.length > 1 ? "s" : ""}</span>
                : <span className="text-emerald-600 font-semibold">✓ Formulaire complet</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending || loadingData}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {sending ? "Insertion..." : "Confirmer l'insertion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Bouton Insérer Employé
// ─────────────────────────────────────────────────────────
function InsertEmployeeButton({ candidature }) {
  const [showModal, setShowModal] = useState(false);
  const storageKey = `employee_status_${candidature.candidatureId || candidature._id}`;

  const [status, setStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    } catch {}
    if (candidature.employeeCreated || candidature.employeeId) return "done";
    return null;
  });

  useEffect(() => {
    if (status === "done") return;

    async function checkEmployee() {
      try {
        const candidatureId = candidature.candidatureId || candidature._id;
        if (!candidatureId) return;
        const res = await fetch(
          `${API_BASE}/employees/by-candidature/${candidatureId}`,
          { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.exists || data?._id) {
            try { localStorage.setItem(storageKey, "done"); } catch {}
            setStatus("done");
          }
        }
      } catch (_) {}
    }

    checkEmployee();
  }, [candidature._id, candidature.candidatureId, status, storageKey]);

  function handleSuccess(result) {
    try { localStorage.setItem(storageKey, result); } catch {}
    setStatus(result);
    setShowModal(false);
  }

  if (status === "done" || status === "exists") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" /> Ajouté ✓
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Insérer Employé
      </button>

      {showModal && (
        <InsertEmployeeModal
          candidature={candidature}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────
export default function RhNordConfirmedPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async (withRefresh = false) => {
    if (withRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const res = await api.get(`/api/interviews/rh-nord-confirmed?${params}`);
      const list = res.data?.interviews || [];

      setCandidates(list);
      setTotal(res.data?.total || list.length);
      setTotalPages(
        res.data?.totalPages ||
        Math.ceil((res.data?.total || list.length) / LIMIT) ||
        1
      );
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">

        {/* En-tête */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              {/* Bouton retour repositionné */}
              <div className="mb-4">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-[#F7FFF3] dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircle2 className="w-7 h-7 text-[#6CB33F]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    Candidats Confirmés — RH Nord
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Entretiens confirmés par Responsable RH Nord
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start xl:self-auto">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  {loading ? "…" : `${total} candidat${total > 1 ? "s" : ""}`}
                </span>
              </div>

              <button
                onClick={() => fetchData(true)}
                className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-[#4E8F2F] hover:bg-green-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 mb-6 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email)..."
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chargement */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-gray-700 font-semibold">Erreur de chargement</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={() => fetchData(true)}
                className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm hover:bg-[#4E8F2F]"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Vide */}
        {!loading && !error && candidates.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="w-16 h-16 text-gray-300" />
              <p className="text-gray-700 font-semibold">Aucun candidat confirmé par RH Nord</p>
              <p className="text-gray-500 text-sm">
                {search ? "Aucun résultat pour cette recherche." : "Aucun entretien confirmé par RH Nord pour le moment."}
              </p>
            </div>
          </div>
        )}

        {/* Tableau */}
        {!loading && !error && candidates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["Candidat", "Poste", "Date & Heure Entretien", "Confirmé le", "Statut", "Décision Embauche", "Employé"].map((h) => (
                      <th key={h} className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {candidates.map((iv) => (
                    <tr
                      key={iv._id}
                      className="bg-white dark:bg-gray-800 transition-colors hover:bg-green-50/40 dark:hover:bg-gray-700/40"
                    >
                      {/* Candidat */}
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={iv.candidateName} />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate text-sm">
                              {iv.candidateName || "—"}
                            </p>
                            {iv.candidateEmail && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {iv.candidateEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Poste */}
                      <td className="px-6 lg:px-8 py-5">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-sm">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{iv.jobTitle || "—"}</span>
                        </span>
                      </td>

                      {/* Date & Heure */}
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
                            <Calendar className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
                            {formatDateFull(iv.confirmedDate || iv.proposedDate)}
                          </span>
                          {(iv.confirmedTime || iv.proposedTime) && (
                            <span className="flex items-center gap-2 text-gray-500 text-xs ml-6">
                              <Clock3 className="w-3.5 h-3.5" />
                              {iv.confirmedTime || iv.proposedTime}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Confirmé le */}
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            {formatDate(iv.rhNordConfirmedAt)}
                          </span>
                          <span className="text-[10px] text-emerald-600 pl-6 font-semibold">par RH Nord ✓</span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 lg:px-8 py-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Confirmé
                        </span>
                      </td>

                      {/* Décision Embauche */}
                      <td className="px-6 lg:px-8 py-5">
                        <HiringStatusButtons candidature={iv} />
                      </td>

                      {/* Employé */}
                      <td className="px-6 lg:px-8 py-5">
                        <InsertEmployeeButton candidature={iv} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && candidates.length > 0 && totalPages > 1 && (
          <div className="mt-6 px-3 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500">
            <p className="font-medium">
              Page {page} sur {totalPages} — {total} candidat{total > 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold text-xs disabled:opacity-50"
              >
                ← Préc.
              </button>

              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-full border font-bold text-xs transition-colors ${
                    p === page
                      ? "bg-[#6CB33F] border-[#6CB33F] text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold text-xs disabled:opacity-50"
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}