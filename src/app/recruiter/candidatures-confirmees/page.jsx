"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Shield, User, Briefcase, Mail, Phone,
  RefreshCw, Search, X, Calendar, FileText, Filter,
  UserPlus, Loader2, AlertCircle, Users, ArrowRight,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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

function InsertEmployeeModal({ candidature, onClose, onSuccess }) {

  // ── Mapping automatique depuis personalInfoForm + extracted ──
  function extractFromCandidature(raw) {
    const pif = raw?.personalInfoForm || {};
    const ext = raw?.extracted?.parsed || {};
    const man = ext?.manual || {};
    const par = ext?.parsed || ext; // structure directe

    const s = (v) => String(v || "").trim();

    return {
      // ✅ Depuis candidature (déjà dispo)
      fullName: s(raw.fullName) || s([raw.prenom, raw.nom].filter(Boolean).join(" ")),
      poste: s(raw.jobTitle),
      email: s(raw.email),
      telephone: s(raw.telephone) || s(pif.telephone) || s(par.telephone) || s(man.telephone),

      // ✅ Depuis personalInfoForm (rempli par le candidat via la fiche)
      cin: s(pif.cin) || s(par.cin) || s(man.cin),
      cnss: s(pif.cnss) || s(par.cnss) || s(man.cnss),
      matricule: s(pif.matricule) || s(par.matricule) || s(man.matricule),
      agence: s(pif.agence) || s(par.agence) || s(man.agence),
      societe: s(pif.societe) || s(par.societe) || s(man.societe),
      departement: s(pif.departement) || s(par.departement) || s(man.departement),
      contratSociete: s(pif.contratSociete) || s(par.contratSociete) || s(man.contratSociete),
      typeContrat: s(pif.typeContrat) || s(par.typeContrat) || s(man.typeContrat),
      genre: s(pif.genre) || s(par.genre) || s(man.genre),
      situation: s(pif.situation) || s(par.situation) || s(man.situation)
        || s(pif.situationFamiliale) || s(par.situationFamiliale),
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

  // ── Charger la candidature complète (personalInfoForm) depuis l'API ──
  useEffect(() => {
    async function load() {
      try {
        setLoadingData(true);
        const res = await fetch(`${API_BASE}/candidatures/${candidature._id}`, {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (res.ok) {
          const full = await res.json();
          // Merge : les champs déjà dispo gardent priorité sur ce qu'on avait
          const fetched = extractFromCandidature(full);
          setForm(prev => {
            const merged = { ...prev };
            for (const [k, v] of Object.entries(fetched)) {
              if (v && !prev[k]) merged[k] = v; // ne pas écraser si déjà rempli
            }
            return merged;
          });
        }
      } catch (e) {
        console.warn("Candidature fetch failed (non bloquant):", e?.message);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [candidature._id]);

  function handleChange(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  // Champs encore vides (manquants)
  const missingFields = ALL_FIELDS.filter(k => !form[k]);
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

        {/* Header */}
        <div className="px-6 py-4 bg-[#E9F5E3] dark:bg-green-900/20 border-b border-[#d4edc4] dark:border-green-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6CB33F] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 dark:text-white text-base">
                Insérer dans les employés
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {loadingData
                  ? "Chargement des données du formulaire..."
                  : hasMissing
                    ? `${missingFields.length} champ${missingFields.length > 1 ? "s" : ""} à compléter`
                    : "Toutes les données sont disponibles ✓"
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Candidat recap */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <Avatar name={form.fullName} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{form.fullName || "—"}</p>
            <p className="text-xs text-gray-500 truncate">{form.poste || "Poste non renseigné"}</p>
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

        {/* Formulaire */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#6CB33F]" />
              <span className="text-sm">Récupération des données du formulaire candidat...</span>
            </div>
          ) : (
            <>
              {/* ── Nom si vide ── */}
              {!form.fullName && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-red-600 mb-1">Nom & Prénom *</label>
                  <input
                    value={form.fullName}
                    onChange={e => handleChange("fullName", e.target.value)}
                    className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 bg-white dark:bg-gray-800 dark:text-white"
                    placeholder="Nom & Prénom complet"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALL_FIELDS.map(key => {
                  const isRequired = REQUIRED.includes(key);
                  const isDate = DATE_FIELDS.includes(key);
                  const options = SELECT_OPTIONS[key];
                  const val = form[key] || "";
                  const isFilled = !!val;
                  const label = LABELS[key];

                  return (
                    <div key={key} className="relative">
                      <label className={`block text-xs font-bold mb-1 ${isRequired && !isFilled ? "text-red-600"
                          : isFilled ? "text-emerald-600"
                            : "text-gray-600 dark:text-gray-400"
                        }`}>
                        {label}
                        {isRequired && <span className="ml-0.5 text-red-500">*</span>}
                        {isFilled && !isRequired && (
                          <span className="ml-1.5 text-emerald-500 text-[10px] font-normal">✓ récupéré</span>
                        )}
                      </label>

                      {options ? (
                        <select
                          value={val}
                          onChange={e => handleChange(key, e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-white transition-colors ${isRequired && !val ? "border-red-300 focus:ring-red-300"
                              : isFilled ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10"
                                : "border-gray-200 dark:border-gray-700 focus:ring-[#6CB33F]"
                            }`}
                        >
                          {options.map(o => <option key={o} value={o}>{o || `-- ${label} --`}</option>)}
                        </select>
                      ) : (
                        <input
                          type={isDate ? "date" : "text"}
                          value={val}
                          onChange={e => handleChange(key, e.target.value)}
                          placeholder={isRequired ? `${label} obligatoire` : label}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-white transition-colors ${isRequired && !val ? "border-red-300 focus:ring-red-300"
                              : isFilled ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10"
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-900/50">
          <div className="text-xs text-gray-400">
            {!loadingData && (
              hasMissing
                ? <span className="text-amber-600 font-semibold">⚠ {missingFields.length} champ{missingFields.length > 1 ? "s" : ""} manquant{missingFields.length > 1 ? "s" : ""}</span>
                : <span className="text-emerald-600 font-semibold">✓ Formulaire complet</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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


function InsertEmployeeButton({ candidature }) {
  const [showModal, setShowModal] = useState(false);
  const storageKey = `employee_status_${candidature._id}`;
  const [status, setStatus] = useState(() => {
    try { return localStorage.getItem(storageKey) || null; } catch { return null; }
  });

  function handleSuccess(result) {
    try { localStorage.setItem(storageKey, result); } catch { }
    setStatus(result);
    setShowModal(false);
  }

  return (
    <>
      <button
        onClick={() => !status && setShowModal(true)}
        disabled={!!status}
        title={
          status === "done" ? "Employé déjà ajouté"
            : status === "exists" ? "Déjà enregistré comme employé"
              : "Insérer comme employé"
        }
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors shadow-sm whitespace-nowrap
          ${status === "done"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-not-allowed opacity-80"
            : status === "exists"
              ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-70"
              : "bg-[#6CB33F] hover:bg-[#4E8F2F] text-white cursor-pointer"
          }`}
      >
        {status === "done" ? (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Ajouté ✓</>
        ) : status === "exists" ? (
          <>Déjà employé</>
        ) : (
          <><UserPlus className="w-3.5 h-3.5" /> Insérer Employé</>
        )}
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

function ConfirmBadge({ confirmed, label, date, optional = false }) {
  if (!confirmed) return optional
    ? <span className="text-gray-300 dark:text-gray-600 text-sm font-bold">—</span>
    : (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-gray-400 whitespace-nowrap">
        Pas obligatoire
      </span>
    );
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />{label}
      </span>
      {date && <span className="text-[10px] text-gray-400 pl-1">{formatDate(date)}</span>}
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "admin", label: "Confirmés Admin" },
  { key: "dga", label: "Confirmés DGA" },
];

export default function ConfirmedCandidaturesPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [rhNordCount, setRhNordCount] = useState(null);

  const fetchData = useCallback(async (withRefresh = false) => {
    try {
      setError(null);
      if (withRefresh) setRefreshing(true); else setLoading(true);
      const res = await apiFetch(`/candidatures/confirmed?filter=${filter}`);
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || "Erreur chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // ✅ Fetch le nombre de candidats confirmés par RH Nord
  useEffect(() => {
    async function fetchRhNordCount() {
      try {
        const token =
          (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
          (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || "";
        const res = await fetch(
          `${API_BASE}/api/interviews/rh-nord-confirmed?page=1&limit=1`,
          { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
        );
        if (res.ok) {
          const data = await res.json();
          setRhNordCount(data?.total ?? 0);
        }
      } catch (_) { /* non bloquant */ }
    }
    fetchRhNordCount();
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(c =>
      (c.fullName || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const bothConfirmed = useMemo(() => filtered.filter(c => c.adminConfirmed && c.dgaConfirmed).length, [filtered]);
  const adminOnly = useMemo(() => filtered.filter(c => c.adminConfirmed && !c.dgaConfirmed).length, [filtered]);
  const dgaOnly = useMemo(() => filtered.filter(c => !c.adminConfirmed && c.dgaConfirmed).length, [filtered]);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-7 h-7 text-[#6CB33F]" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Candidatures Confirmées
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? "Chargement..." : `${filtered.length} candidature${filtered.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ✅ Bannière — Candidats confirmés par RH Nord */}
        <button
          onClick={() => router.push("/recruiter/candidatures-confirmees/rh-nord")}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 mb-6 rounded-2xl bg-white dark:bg-gray-800 border border-[#d4edc4] dark:border-gray-700 hover:bg-[#F0FAF0] dark:hover:bg-gray-700/50 shadow-sm transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F5E3] dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                Candidats confirmés par Responsable RH Nord
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Entretiens validés et confirmés par l&apos;équipe RH Nord — liste séparée
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {rhNordCount !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {rhNordCount} confirmé{rhNordCount > 1 ? "s" : ""}
              </span>
            )}
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4E8F2F] transition-colors" />
          </div>
        </button>

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Filtres */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filter === f.key
                    ? "bg-[#4E8F2F] text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shadow-sm">
            <Search className="w-4 h-4 text-[#4E8F2F] flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, poste)…"
              className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-[#4E8F2F] transition-colors flex-shrink-0">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          {loading && (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#E9F5E3] border-t-[#4E8F2F]" />
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-12 text-center">
              <p className="text-red-500 font-semibold">{error}</p>
              <button onClick={() => fetchData(true)} className="mt-4 px-5 py-2.5 bg-[#6CB33F] hover:bg-[#4E8F2F] text-white rounded-full font-semibold text-sm">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-semibold">Aucune candidature confirmée</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: "900px" }}>
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    {["Candidat", "Poste", "Confirmation Admin", "Confirmation DGA", "Date candidature", "Employé"].map(h => (
                      <th key={h} className="text-left px-5 py-4 font-extrabold uppercase text-xs tracking-wider border-b border-[#d4edc4] dark:border-gray-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr
                      key={String(c._id)}
                      className="
    border-t border-gray-100 dark:border-gray-700
    bg-white dark:bg-[#0B1220]
    hover:bg-[#F0FAF0] dark:hover:bg-[#1A2332]
    transition-colors
  "
                    >



                      {/* Candidat */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const displayName =
                              c.fullName ||
                              [c.prenom, c.nom].filter(Boolean).join(" ").trim() ||
                              c.email?.split("@")[0] ||
                              "?";
                            return (
                              <>
                                <Avatar name={displayName} />
                                <div className="min-w-0">
                                  <p className="font-extrabold text-gray-900 dark:text-white truncate max-w-[180px]">
                                    {displayName !== c.email?.split("@")[0] ? displayName : "—"}
                                  </p>
                                  {c.email && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[180px]">
                                      <Mail className="w-3 h-3 flex-shrink-0" />{c.email}
                                    </p>
                                  )}
                                  {c.telephone && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <Phone className="w-3 h-3 flex-shrink-0" />{c.telephone}
                                    </p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Poste */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{c.jobTitle || "—"}</span>
                        </span>
                      </td>

                      {/* Confirmation Admin */}
                      <td className="px-5 py-4">
                        <ConfirmBadge
                          confirmed={c.adminConfirmed}
                          label="Admin ✓"
                          date={c.adminConfirmedAt}
                        />
                      </td>

                      {/* Confirmation DGA */}
                      <td className="px-5 py-4">
                        <ConfirmBadge
                          confirmed={c.dgaConfirmed}
                          label="DGA ✓"
                          date={c.dgaConfirmedAt}
                          optional={true}
                        />
                      </td>

                      {/* Date candidature */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-500 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(c.createdAt)}
                        </span>
                      </td>

                      {/* Insérer Employé */}
                      <td className="px-5 py-4">
                        <InsertEmployeeButton candidature={c} />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}