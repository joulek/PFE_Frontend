"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Briefcase, Users, Calendar, TrendingUp, GraduationCap, Clock, CheckCircle, XCircle } from "lucide-react";
import { useCandidaturesDashboard, useInterviewsDashboard, useJobsDashboard } from "../../hooks/useDashboard";

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function safeStr(v) {
  if (!v) return "";
  return typeof v === "string" ? v.trim() : String(v);
}

function getFullName(c) {
  const full =
    safeStr(c?.fullName) ||
    safeStr(c?.extracted?.parsed?.nom) ||
    safeStr(c?.extracted?.parsed?.full_name) ||
    safeStr(c?.prenom && c?.nom ? `${c.prenom} ${c.nom}` : "");
  return full || "Candidat";
}

function getInitials(name = "") {
  return name.trim().split(" ").filter(Boolean).slice(0, 2)
    .map(p => p[0]).join("").toUpperCase() || "??";
}

function formatTimeAgo(date) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${d} j`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ═══════════════════════════════════════════
   CONSTANTES STATUTS
═══════════════════════════════════════════ */
const CAND_STATUS = {
  SUBMITTED:   { label: "Soumis",       cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300" },
  DRAFT:       { label: "Brouillon",    cls: "bg-gray-100   text-gray-600   dark:bg-gray-700      dark:text-gray-300" },
  review:      { label: "En révision",  cls: "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-300" },
  inter:       { label: "Entretien",    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  offer:       { label: "Offre",        cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300" },
  refuse:      { label: "Refusé",       cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300" },
};

const INTER_STATUS = {
  CONFIRMED:                      { label: "Confirmé",          cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300" },
  PENDING_CONFIRMATION:           { label: "Attente resp.",      cls: "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-300" },
  PENDING_CANDIDATE_CONFIRMATION: { label: "Attente cand.",      cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300" },
  CANDIDATE_REQUESTED_RESCHEDULE: { label: "Report demandé",     cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  PENDING_ADMIN_APPROVAL:         { label: "Approbation admin",  cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  CANCELLED:                      { label: "Annulé",             cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300" },
};

const JOB_STATUS_MAP = {
  EN_ATTENTE: { label: "En attente",  cls: "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-300" },
  VALIDEE:    { label: "Validée",     cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300" },
  CONFIRMEE:  { label: "Confirmée",   cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300" },
  REJETEE:    { label: "Rejetée",     cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300" },
};

const DEGREE_COLORS = {
  "Bac+2": "#86EFAC",
  "Bac+3": "#4E8F2F",
  "Bac+5": "#22C55E",
  "PhD":   "#166534",
  "Autre": "#9CA3AF",
};

const TYPE_COLORS = ["#378ADD", "#1D9E75", "#7F77DD", "#EF9F27"];

/* ═══════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════ */
function MetricCard({ icon: Icon, label, value, sub, subColor = "gray" }) {
  const subCls = {
    green:  "text-green-600 dark:text-green-400",
    yellow: "text-amber-600 dark:text-amber-400",
    red:    "text-red-500   dark:text-red-400",
    gray:   "text-gray-400  dark:text-gray-500",
  }[subColor];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 flex items-center gap-4">
      {Icon && (
        <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-[#4E8F2F] dark:text-emerald-400" />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${subCls}`}>{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status, map }) {
  const meta = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function PipelineBar({ label, n, total, color }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{n}</span>
    </div>
  );
}

function FilterBar({ filters, active, onChange, idPrefix }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map(f => (
        <button
          key={f.value ?? "all"}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${
            active === f.value
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent"
              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ONGLET CANDIDATURES
═══════════════════════════════════════════ */
function TabCandidatures() {
  const { data, loading, error } = useCandidaturesDashboard();
  const [statusFilter, setStatusFilter] = useState(null);

  const filtered = useMemo(() => {
    const list = data?.last || [];
    if (!statusFilter) return list;
    return list.filter(c => (c.status || "SUBMITTED") === statusFilter);
  }, [data, statusFilter]);

  const statusCounts = useMemo(() => {
    const all = data?.candidatures || [];
    return {
      total:      data?.total || 0,
      submitted:  all.filter(c => c.status === "SUBMITTED").length,
      preselect:  all.filter(c => c.preInterview?.status === "SELECTED").length,
      interview:  all.filter(c => c.status === "inter").length,
      offer:      all.filter(c => c.status === "offer").length,
      hired:      all.filter(c => c.status === "hired" || c.status === "embauche").length,
      refused:    all.filter(c => c.status === "refuse" || c.status === "REFUSED").length,
    };
  }, [data]);

  // Priorité aux données de /candidatures/meta-offer si disponibles
  const mo = data?.metaOffer || {};
  const funnelData = [
    {
      lbl: "Candidatures",
      n: mo.total      ?? mo.TOTAL      ?? statusCounts.total,
      col: "#378ADD",
    },
    {
      lbl: "Soumises",
      n: mo.submitted  ?? mo.SUBMITTED  ?? statusCounts.submitted,
      col: "#EF9F27",
    },
    {
      lbl: "Pré-sélect.",
      n: mo.preselect  ?? mo.PRESELECTED ?? mo.PRE_SELECTED ?? statusCounts.preselect,
      col: "#7F77DD",
    },
    {
      lbl: "Entretien",
      n: mo.interview  ?? mo.INTERVIEW  ?? mo.INTER        ?? statusCounts.interview,
      col: "#1D9E75",
    },
    {
      lbl: "Offre",
      n: mo.offer      ?? mo.OFFER      ?? statusCounts.offer,
      col: "#639922",
    },
    {
      lbl: "Refusé",
      n: mo.refused    ?? mo.REFUSED    ?? mo.REFUSE       ?? statusCounts.refused,
      col: "#E24B4A",
    },
  ];

  const pieData = (data?.academic?.degreeDistribution || []).map(d => ({
    name: d._id || "Autre",
    value: d.total,
  }));

  const candFilters = [
    { label: "Tous",        value: null },
    { label: "Soumis",      value: "SUBMITTED" },
    { label: "En révision", value: "review" },
    { label: "Entretien",   value: "inter" },
    { label: "Offre",       value: "offer" },
    { label: "Refusé",      value: "refuse" },
  ];

  return (
    <div className="space-y-6">
      {/* Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon={Users}       label="Total candidatures"   value={data?.total || 0} sub={`${data?.candidatures?.length || 0} chargées`} subColor="gray" />
        <MetricCard icon={Clock}       label="Soumises"             value={data?.candidatures?.filter(c => c.status === "SUBMITTED").length || 0} sub="statut soumis" subColor="yellow" />
        <MetricCard icon={Calendar}    label="Pré-sélectionnées"    value={data?.candidatures?.filter(c => c.preInterview?.status === "SELECTED").length || 0} sub="pré-entretien" subColor="green" />
        <MetricCard icon={TrendingUp}  label="Score matching moyen" value={`${data?.matching?.averageScore || 0}%`} sub="analyse IA" subColor="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Candidatures récentes</h2>
            <FilterBar filters={candFilters} active={statusFilter} onChange={setStatusFilter} />
          </div>
          {loading ? <Skeleton /> : error ? (
            <p className="p-6 text-sm text-red-400">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                    <th className="text-left px-6 py-3">Candidat</th>
                    <th className="text-left px-6 py-3">Poste</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">Aucune candidature</td></tr>
                  ) : filtered.map(c => {
                    const name = getFullName(c);
                    return (
                      <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[#4E8F2F] dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                              {getInitials(name)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-xs">{name}</p>
                              <p className="text-xs text-gray-400">{formatTimeAgo(c.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs truncate max-w-[140px]">
                          {safeStr(c.jobTitle) || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status || "SUBMITTED"} map={CAND_STATUS} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700">
            <Link href="/recruiter/candidatures" className="text-xs font-semibold text-[#4E8F2F] dark:text-emerald-400 hover:underline">
              Voir toutes les candidatures →
            </Link>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Entonnoir */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Entonnoir de recrutement</h2>
            <div className="space-y-3">
              {funnelData.map(f => (
                <PipelineBar key={f.lbl} label={f.lbl} n={f.n} total={data?.total || 1} color={f.col} />
              ))}
            </div>
          </div>

          {/* Diplômes */}
          {pieData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#4E8F2F]" /> Niveaux d'études
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={2} stroke="#fff">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={DEGREE_COLORS[entry.name] || "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} candidats`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend height={28} formatter={v => <span className="text-xs text-gray-600 dark:text-gray-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Matching */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Qualité matching IA</h2>
            {[
              { lbl: "Score moyen",    val: data?.matching?.averageScore   || 0, col: "#4E8F2F" },
              { lbl: "Profils > 70%",  val: data?.matching?.percentAbove80 || 0, col: "#22C55E" },
              { lbl: "Profils < 50%",  val: data?.matching?.percentBelow50 || 0, col: "#EF4444" },
            ].map(m => (
              <div key={m.lbl} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{m.lbl}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{m.val}%</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${m.val}%`, background: m.col }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ONGLET ENTRETIENS
═══════════════════════════════════════════ */
function TabEntretiens() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  const { data, loading, error } = useInterviewsDashboard({
    page, limit: 10, status: statusFilter, search,
  });

  const stats      = data?.stats      || {};
  const interviews = data?.interviews || [];
  const upcoming   = data?.upcoming   || [];

  const interFilters = [
    { label: "Tous",        value: null },
    { label: "Confirmés",   value: "CONFIRMED" },
    { label: "En attente",  value: "PENDING_CONFIRMATION" },
    { label: "Report",      value: "CANDIDATE_REQUESTED_RESCHEDULE" },
    { label: "Approbation", value: "PENDING_ADMIN_APPROVAL" },
    { label: "Annulés",     value: "CANCELLED" },
  ];

  const pipelineRows = [
    { lbl: "Confirmés",          n: stats.confirmed                    || 0, col: "#4E8F2F" },
    { lbl: "Attente responsable",n: stats.pendingConfirmation          || 0, col: "#EF9F27" },
    { lbl: "Attente candidat",   n: stats.pendingCandidateConfirmation || 0, col: "#378ADD" },
    { lbl: "Report demandé",     n: stats.candidateReschedule          || 0, col: "#7F77DD" },
    { lbl: "Approbation admin",  n: stats.pendingAdminApproval         || 0, col: "#D85A30" },
    { lbl: "Annulés",            n: stats.cancelled                    || 0, col: "#E24B4A" },
  ];

  return (
    <div className="space-y-6">
      {/* Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon={Calendar}     label="Total entretiens"  value={stats.total     || 0} sub="+12 cette semaine" subColor="gray" />
        <MetricCard icon={CheckCircle}  label="Confirmés"         value={stats.confirmed || 0} sub={`${Math.round((stats.confirmed||0)*100/(stats.total||1))}% du total`} subColor="green" />
        <MetricCard icon={Clock}        label="En attente"        value={(stats.pendingConfirmation||0)+(stats.pendingCandidateConfirmation||0)} sub="responsable + candidat" subColor="yellow" />
        <MetricCard icon={XCircle}      label="Annulés"           value={stats.cancelled || 0} sub={`${Math.round((stats.cancelled||0)*100/(stats.total||1))}% du total`} subColor="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tous les entretiens</h2>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4E8F2F] w-44"
              />
            </div>
            <FilterBar
              filters={interFilters}
              active={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1); }}
            />
          </div>
          {loading ? <Skeleton /> : error ? (
            <p className="p-6 text-sm text-red-400">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                    <th className="text-left px-6 py-3">Candidat</th>
                    <th className="text-left px-6 py-3">Poste</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Type</th>
                    <th className="text-left px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {interviews.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Aucun entretien</td></tr>
                  ) : interviews.map(iv => (
                    <tr key={iv._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                            {getInitials(iv.candidateName || "")}
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{iv.candidateName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{iv.jobTitle || "—"}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(iv.confirmedDate || iv.proposedDate)}
                        {(iv.confirmedTime || iv.proposedTime) && (
                          <span className="ml-1">{iv.confirmedTime || iv.proposedTime}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{iv.interviewType || "RH"}</td>
                      <td className="px-6 py-4"><StatusBadge status={iv.status} map={INTER_STATUS} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {(data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Page {data.page} / {data.totalPages} — {data.total} entretiens</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Préc.
                </button>
                <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline statuts</h2>
            <div className="space-y-3">
              {pipelineRows.map(r => (
                <PipelineBar key={r.lbl} label={r.lbl} n={r.n} total={stats.total || 1} color={r.col} />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Prochains (7 jours)</h2>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun entretien à venir.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(iv => (
                  <div key={iv._id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition cursor-pointer">
                    <div className="min-w-[40px] text-center bg-gray-50 dark:bg-gray-700 rounded-xl py-1.5 px-1">
                      <p className="text-base font-bold text-gray-900 dark:text-white leading-none">
                        {new Date(iv.proposedDate).getDate()}
                      </p>
                      <p className="text-[9px] text-gray-400 uppercase">
                        {new Date(iv.proposedDate).toLocaleDateString("fr-FR", { month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{iv.candidateName || "—"}</p>
                      <p className="text-xs text-gray-400 truncate">{iv.jobTitle || "—"}</p>
                      <p className="text-xs text-gray-400">{iv.proposedTime} · {iv.interviewType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ONGLET OFFRES
═══════════════════════════════════════════ */
function TabOffres() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  const { data, loading, error } = useJobsDashboard({
    page, limit: 15, status: statusFilter, search,
  });

  const stats = data?.stats || {};
  const jobs  = data?.jobs  || [];

  const jobFilters = [
    { label: "Tous",       value: null },
    { label: "En attente", value: "EN_ATTENTE" },
    { label: "Validées",   value: "VALIDEE" },
    { label: "Confirmées", value: "CONFIRMEE" },
    { label: "Rejetées",   value: "REJETEE" },
  ];

  return (
    <div className="space-y-6">
      {/* Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon={Briefcase}   label="Total offres"    value={stats.total      || 0} sub="toutes catégories"  subColor="gray" />
        <MetricCard icon={Clock}       label="En attente"      value={stats.en_attente || 0} sub="à valider"          subColor="yellow" />
        <MetricCard icon={CheckCircle} label="Confirmées"      value={stats.confirmee  || 0} sub="publiées"           subColor="green" />
        <MetricCard icon={XCircle}     label="Rejetées"        value={stats.rejetee    || 0} sub={`${Math.round((stats.rejetee||0)*100/(stats.total||1))}% du total`} subColor="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tableau offres */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Toutes les offres</h2>
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4E8F2F] w-44"
              />
            </div>
            <FilterBar filters={jobFilters} active={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />
          </div>

          {loading ? <Skeleton /> : error ? (
            <p className="p-6 text-sm text-red-400">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                    <th className="text-left px-6 py-3">Titre</th>
                    <th className="text-left px-6 py-3">Département</th>
                    <th className="text-left px-6 py-3">Lieu</th>
                    <th className="text-left px-6 py-3">Créé par</th>
                    <th className="text-left px-6 py-3">Date clôture</th>
                    <th className="text-left px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {jobs.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Aucune offre trouvée</td></tr>
                  ) : jobs.map(j => (
                    <tr key={String(j._id)} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition cursor-pointer">
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{j.titre || "—"}</p>
                        {j.typeContrat && <p className="text-xs text-gray-400">{j.typeContrat}</p>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{j.departement || "—"}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{j.lieu || "—"}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-700 dark:text-gray-300">{j.createdByUser || "—"}</p>
                        <p className="text-xs text-gray-400">{j.createdByEmail || ""}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {j.dateCloture ? formatDate(j.dateCloture) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={j.status} map={JOB_STATUS_MAP} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Page {data.page} / {data.totalPages} — {data.count} offres</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Préc.
                </button>
                <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Pipeline statuts */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline offres</h2>
            <div className="space-y-3">
              {[
                { lbl: "En attente",  n: stats.en_attente || 0, col: "#EF9F27" },
                { lbl: "Validées",    n: stats.validee    || 0, col: "#378ADD" },
                { lbl: "Confirmées",  n: stats.confirmee  || 0, col: "#4E8F2F" },
                { lbl: "Rejetées",    n: stats.rejetee    || 0, col: "#E24B4A" },
              ].map(r => (
                <PipelineBar key={r.lbl} label={r.lbl} n={r.n} total={stats.total || 1} color={r.col} />
              ))}
            </div>
          </div>

          {/* Répartition par type */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Répartition statuts</h2>
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "En attente", value: stats.en_attente || 0 },
                      { name: "Validées",   value: stats.validee    || 0 },
                      { name: "Confirmées", value: stats.confirmee  || 0 },
                      { name: "Rejetées",   value: stats.rejetee    || 0 },
                    ].filter(d => d.value > 0)}
                    dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} strokeWidth={2} stroke="#fff"
                  >
                    {["#EF9F27","#378ADD","#4E8F2F","#E24B4A"].map((col, i) => (
                      <Cell key={i} fill={col} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} offres`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend height={28} formatter={v => <span className="text-xs text-gray-600 dark:text-gray-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">Aucune donnée.</p>
            )}
          </div>

          {/* Top départements */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top départements</h2>
            {(() => {
              const deptMap = {};
              jobs.forEach(j => {
                const d = j.departement || "Non défini";
                deptMap[d] = (deptMap[d] || 0) + 1;
              });
              const sorted = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
              const max = sorted[0]?.[1] || 1;
              return sorted.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune donnée.</p>
              ) : sorted.map(([dept, count]) => (
                <div key={dept} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{dept}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#4E8F2F]" style={{ width: `${Math.round((count/max)*100)}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ONGLET VUE GLOBALE
═══════════════════════════════════════════ */
function TabGlobal({ candData, interData }) {
  const stats = interData?.stats || {};

  // Types d'entretiens depuis les vraies données
  const interviewsList = interData?.allInterviews || interData?.interviews || [];
  const typeCounts = interviewsList.reduce((acc, iv) => {
    const t = (iv.interviewType || "RH").toUpperCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const typeDataFinal = typeData.length > 0 ? typeData : [];

  // Activité hebdo : depuis les entretiens réels groupés par semaine
  const now = Date.now();
  const weekLabels = ["S-4","S-3","S-2","S-1","Cette sem."];
  const barData = weekLabels.map((week, i) => {
    const weekStart = now - (4 - i) * 7 * 86400000;
    const weekEnd   = weekStart + 7 * 86400000;
    const weekItems = interviewsList.filter(iv => {
      const d = new Date(iv.createdAt).getTime();
      return d >= weekStart && d < weekEnd;
    });
    return {
      week,
      confirmés: weekItems.filter(iv => iv.status === "CONFIRMED").length,
      attente:   weekItems.filter(iv => iv.status?.includes("PENDING")).length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard icon={Users}      label="Total candidatures"  value={candData?.total   || 0} sub="ce mois"         subColor="gray" />
        <MetricCard icon={Calendar}   label="Total entretiens"    value={stats.total        || 0} sub="planifiés"       subColor="gray" />
        <MetricCard icon={CheckCircle}label="Taux confirmation"   value={`${Math.round((stats.confirmed||0)*100/(stats.total||1))}%`} sub="entretiens"  subColor="green" />
        <MetricCard icon={TrendingUp} label="Taux embauche"       value={`${candData?.matching?.averageScore || 0}%`} sub="score matching" subColor="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Bar chart hebdo */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activité hebdomadaire</h2>
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#4E8F2F] inline-block" />Confirmés
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#EF9F27] inline-block" />En attente
                </span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E5E7EB" }} />
                  <Bar dataKey="confirmés" stackId="a" fill="#4E8F2F" radius={[0,0,0,0]} />
                  <Bar dataKey="attente"   stackId="a" fill="#EF9F27" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Doughnut types */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Types d'entretiens</h2>
            {typeDataFinal.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Aucune donnée disponible.</p>
            ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeDataFinal} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={2} stroke="#fff">
                  {typeDataFinal.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} entretiens`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend height={28} formatter={v => <span className="text-xs text-gray-600 dark:text-gray-300">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Matching */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Matching IA</h2>
            {[
              { lbl: "Score moyen",   val: candData?.matching?.averageScore   || 0, col: "#4E8F2F" },
              { lbl: "Profils > 70%", val: candData?.matching?.percentAbove80 || 0, col: "#22C55E" },
              { lbl: "Profils < 50%", val: candData?.matching?.percentBelow50 || 0, col: "#EF4444" },
            ].map(m => (
              <div key={m.lbl} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{m.lbl}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{m.val}%</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${m.val}%`, background: m.col }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline entretiens */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Pipeline entretiens</h2>
            <div className="space-y-3">
              {[
                { lbl: "Confirmés",  n: stats.confirmed || 0, col: "#4E8F2F" },
                { lbl: "En attente", n: (stats.pendingConfirmation||0)+(stats.pendingCandidateConfirmation||0), col: "#EF9F27" },
                { lbl: "Annulés",   n: stats.cancelled || 0, col: "#E24B4A" },
              ].map(r => (
                <PipelineBar key={r.lbl} label={r.lbl} n={r.n} total={stats.total || 1} color={r.col} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════ */
export default function DashboardRH() {
  const [activeTab, setActiveTab] = useState("candidatures");

  const candHook  = useCandidaturesDashboard();
  const interHook = useInterviewsDashboard({ page: 1, limit: 10 });

  const tabs = [
    { id: "candidatures", label: "Candidatures" },
    { id: "offres",       label: "Offres" },
    { id: "entretiens",   label: "Entretiens" },
    { id: "global",       label: "Vue globale" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Topbar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard RH</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Exporter
            </button>
            <button className="bg-[#4E8F2F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#3d7224] transition">
              + Nouveau
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 w-fit mb-8">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {activeTab === "candidatures" && <TabCandidatures />}
        {activeTab === "offres"       && <TabOffres />}
        {activeTab === "entretiens"   && <TabEntretiens />}
        {activeTab === "global"       && <TabGlobal candData={candHook.data} interData={interHook.data} />}

      </div>
    </div>
  );
}