"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Search,
  FileText,
  Layers3,
  ClipboardList,
  Activity,
  Download,
  Plus,
} from "lucide-react";
import {
  useCandidaturesDashboard,
  useInterviewsDashboard,
  useJobsDashboard,
} from "../../hooks/useDashboard";

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
  return (
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "??"
  );
}

function formatTimeAgo(date) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  if (m < 1) return "À l’instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${d} j`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateLong(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part * 100) / total);
}

/* ═══════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════ */
const OPTY = {
  green: "#78C043",
  greenDark: "#9DCA7C",
  blue: "#3B82F6",
  amber: "#F59E0B",
  purple: "#A855F7",
  red: "#EF4444",
  emerald: "#10B981",
  orange: "#F97316",
  navy: "#030B1B",
  navySoft: "#0B1324",
  cardDark: "#111C31",
  cardDark2: "#0F172A",
  borderDark: "#23314F",
};

const CAND_STATUS = {
  SUBMITTED: {
    label: "Soumis",
    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20",
  },
  DRAFT: {
    label: "Brouillon",
    cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40",
  },
  review: {
    label: "En révision",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
  },
  inter: {
    label: "Entretien",
    cls: "bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/20",
  },
  offer: {
    label: "Offre",
    cls: "bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  hired: {
    label: "Embauché",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  embauche: {
    label: "Embauché",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  refuse: {
    label: "Refusé",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20",
  },
  REFUSED: {
    label: "Refusé",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20",
  },
};

const INTER_STATUS = {
  CONFIRMED: {
    label: "Confirmé",
    cls: "bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  PENDING_CONFIRMATION: {
    label: "Attente resp.",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente cand.",
    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20",
  },
  CANDIDATE_REQUESTED_RESCHEDULE: {
    label: "Report demandé",
    cls: "bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/20",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "Approbation admin",
    cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20",
  },
  CANCELLED: {
    label: "Annulé",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20",
  },
};

const JOB_STATUS_MAP = {
  EN_ATTENTE: {
    label: "En attente",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
  },
  VALIDEE: {
    label: "Validée",
    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20",
  },
  CONFIRMEE: {
    label: "Confirmée",
    cls: "bg-green-50 text-green-700 ring-1 ring-green-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  REJETEE: {
    label: "Rejetée",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20",
  },
};

const DEGREE_COLORS = {
  "Bac+2": "#86EFAC",
  "Bac+3": "#78C043",
  "Bac+5": "#22C55E",
  PhD: "#166534",
  Autre: "#94A3B8",
};

const TYPE_COLORS = [OPTY.blue, OPTY.emerald, OPTY.purple, OPTY.amber];

/* ═══════════════════════════════════════════
   UI
═══════════════════════════════════════════ */
function CardShell({ children, className = "" }) {
  return (
    <div
      className={`rounded-[28px] border border-[#E7EFDF] bg-white shadow-[0_10px_40px_rgba(78,143,47,0.06)] dark:border-[#24324E] dark:bg-[#111C31] dark:shadow-[0_12px_42px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#EEF7E9] dark:bg-[#16233D]">
              <Icon className="h-4 w-4 text-[#4E8F2F] dark:text-[#9DCA7C]" />
            </div>
          ) : null}
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = "green",
}) {
  const tone = {
    green:
      "bg-[#EEF7E9] text-[#4E8F2F] dark:bg-[#143220] dark:text-[#9DCA7C]",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  }[color];

  return (
    <CardShell className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-[30px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
          {sub ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{sub}</p>
          ) : null}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend ? (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#4E8F2F] dark:text-[#9DCA7C]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>{trend}</span>
        </div>
      ) : null}
    </CardShell>
  );
}

function StatusBadge({ status, map }) {
  const meta = map[status] || {
    label: status || "—",
    cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

function FilterBar({ filters, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={String(f.value)}
          onClick={() => onChange(f.value)}
          className={`inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
            active === f.value
              ? "bg-[#78C043] text-white shadow-sm dark:bg-[#78C043] dark:text-[#08111F]"
              : "bg-[#F8FAF6] text-gray-600 ring-1 ring-[#E7EFDF] hover:bg-[#EEF7E9] dark:bg-[#0F172A] dark:text-slate-300 dark:ring-[#24324E] dark:hover:bg-[#16233D]"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function SoftInput({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="relative w-full sm:w-[240px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[#E7EFDF] bg-[#F9FCF7] pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#CFE3C1] focus:bg-white focus:ring-4 focus:ring-[#4E8F2F]/10 dark:border-[#24324E] dark:bg-[#0F172A] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2E466F] dark:focus:bg-[#111C31] dark:focus:ring-[#78C043]/10"
      />
    </div>
  );
}

function TableShell({ children }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#EEF3E9] dark:border-[#24324E]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function SkeletonRows({ rows = 5 }) {
  return (
    <div className="space-y-3 p-5 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl bg-[#F4F7F2] dark:bg-[#16233D]" />
      ))}
    </div>
  );
}

function MiniProgress({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-gray-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF3E9] dark:bg-[#0F172A]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text = "Aucune donnée disponible." }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center px-6 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
      {text}
    </div>
  );
}

function MobileDataCard({ title, lines = [], badge }) {
  return (
    <div className="rounded-2xl border border-[#EEF3E9] bg-[#FBFDF9] p-4 dark:border-[#24324E] dark:bg-[#0F172A]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          <div className="mt-2 space-y-1">
            {lines.map((line, i) => (
              <p
                key={i}
                className="truncate text-xs text-gray-500 dark:text-slate-400"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
        {badge}
      </div>
    </div>
  );
}

function TopActionButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-2xl border border-[#DDEAD2] bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-[#F7FBF4] dark:border-[#2A3A59] dark:bg-[#0F172A] dark:text-white dark:hover:bg-[#16233D]"
      >
        <Download className="h-4 w-4" />
        Exporter
      </button>

      <Link
        href="/recruiter/jobs/new"
        className="inline-flex items-center gap-2 rounded-2xl bg-[#09B17A] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        <Plus className="h-4 w-4" />
        Nouvelle offre
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
function DashboardHero({
  activeTab,
  setActiveTab,
  tabs,
  totalCandidates,
  totalInterviews,
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#DDEAD2] bg-gradient-to-br from-[#F7FBF4] via-white to-[#EDF6E8] p-6 shadow-[0_10px_50px_rgba(78,143,47,0.08)] dark:border-[#24324E] dark:bg-[linear-gradient(135deg,#091224_0%,#0B1324_45%,#111C31_100%)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.4)] lg:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#DFF0D5]/60 blur-3xl dark:bg-[#1C2F52]/45" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#EEF7E9] blur-2xl dark:bg-[#1E3A2D]/20" />

      <div className="relative z-10 mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#4E8F2F] ring-1 ring-[#E3EEDC] backdrop-blur dark:bg-[#0F172A]/85 dark:text-[#9DCA7C] dark:ring-[#24324E]">
          <Sparkles className="h-3.5 w-3.5" />
          Tableau de bord RH
        </div>

        <TopActionButtons />
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <h1 className="max-w-3xl text-[28px] font-bold tracking-tight text-gray-900 dark:text-white md:text-[34px]">
            Dashboard professionnel, lisible et cohérent avec le thème Optylab
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
            Vue d’ensemble claire sur les candidatures, les entretiens et les offres
            d’emploi, avec une hiérarchie visuelle plus propre, des blocs mieux
            espacés et une interface plus confortable pour l’utilisateur.
          </p>

          <div className="mt-6 flex w-fit flex-wrap gap-2 rounded-2xl bg-white/75 p-1.5 ring-1 ring-[#E7EFDF] backdrop-blur dark:bg-[#0F172A]/90 dark:ring-[#24324E]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? "bg-[#78C043] text-white shadow-sm dark:bg-[#78C043] dark:text-[#08111F]"
                    : "text-gray-600 hover:bg-[#F3F8EF] dark:text-slate-300 dark:hover:bg-[#16233D]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CardShell className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF7E9] dark:bg-[#143220]">
                <Users className="h-5 w-5 text-[#4E8F2F] dark:text-[#9DCA7C]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Candidatures
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCandidates}
                </p>
              </div>
            </div>
          </CardShell>

          <CardShell className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/15">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Entretiens
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalInterviews}
                </p>
              </div>
            </div>
          </CardShell>

          <CardShell className="col-span-2 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                  Aujourd’hui
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDateLong(new Date())}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Interface restructurée pour une lecture plus naturelle.
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF7E9] dark:bg-[#143220]">
                <Activity className="h-6 w-6 text-[#4E8F2F] dark:text-[#9DCA7C]" />
              </div>
            </div>
          </CardShell>
        </div>
      </div>
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
    return list.filter((c) => (c.status || "SUBMITTED") === statusFilter);
  }, [data, statusFilter]);

  const all = data?.candidatures || [];
  const total = data?.total || 0;

  const statusCounts = useMemo(() => {
    return {
      total,
      submitted: all.filter((c) => c.status === "SUBMITTED").length,
      preselect: all.filter((c) => c.preInterview?.status === "SELECTED").length,
      interview: all.filter((c) => c.status === "inter").length,
      offer: all.filter((c) => c.status === "offer").length,
      hired: all.filter((c) => c.status === "hired" || c.status === "embauche").length,
      refused: all.filter((c) => c.status === "refuse" || c.status === "REFUSED").length,
    };
  }, [all, total]);

  const mo = data?.metaOffer || {};
  const funnelData = [
    {
      lbl: "Candidatures",
      n: mo.total ?? mo.TOTAL ?? statusCounts.total,
      col: OPTY.blue,
    },
    {
      lbl: "Soumises",
      n: mo.submitted ?? mo.SUBMITTED ?? statusCounts.submitted,
      col: OPTY.amber,
    },
    {
      lbl: "Pré-sélect.",
      n: mo.preselect ?? mo.PRESELECTED ?? mo.PRE_SELECTED ?? statusCounts.preselect,
      col: OPTY.purple,
    },
    {
      lbl: "Entretien",
      n: mo.interview ?? mo.INTERVIEW ?? mo.INTER ?? statusCounts.interview,
      col: OPTY.emerald,
    },
    {
      lbl: "Offre",
      n: mo.offer ?? mo.OFFER ?? statusCounts.offer,
      col: OPTY.green,
    },
    {
      lbl: "Refusé",
      n: mo.refused ?? mo.REFUSED ?? mo.REFUSE ?? statusCounts.refused,
      col: OPTY.red,
    },
  ];

  const degreeData = (data?.academic?.degreeDistribution || []).map((d) => ({
    name: d._id || "Autre",
    value: d.total,
  }));

  const candFilters = [
    { label: "Tous", value: null },
    { label: "Soumis", value: "SUBMITTED" },
    { label: "En révision", value: "review" },
    { label: "Entretien", value: "inter" },
    { label: "Offre", value: "offer" },
    { label: "Refusé", value: "refuse" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total candidatures"
          value={total}
          sub={`${all.length || 0} chargées`}
          trend="Vue centralisée du pipeline"
          color="green"
        />
        <MetricCard
          icon={Clock}
          label="Soumises"
          value={statusCounts.submitted}
          sub={`${percent(statusCounts.submitted, total)}% du total`}
          color="amber"
        />
        <MetricCard
          icon={ClipboardList}
          label="Pré-sélectionnées"
          value={statusCounts.preselect}
          sub="Candidats retenus après pré-entretien"
          color="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Matching IA moyen"
          value={`${data?.matching?.averageScore || 0}%`}
          sub="Qualité moyenne des profils"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Users}
              title="Candidatures récentes"
              subtitle="Derniers profils ajoutés dans le pipeline"
              action={
                <Link
                  href="/recruiter/candidatures"
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-[#F7FBF4] px-3 py-2 text-xs font-semibold text-[#4E8F2F] ring-1 ring-[#E3EEDC] hover:bg-[#EEF7E9] dark:bg-[#0F172A] dark:text-[#9DCA7C] dark:ring-[#24324E] dark:hover:bg-[#16233D]"
                >
                  Voir tout
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            <FilterBar
              filters={candFilters}
              active={statusFilter}
              onChange={setStatusFilter}
            />

            <div className="mt-5 hidden md:block">
              {loading ? (
                <SkeletonRows rows={6} />
              ) : error ? (
                <EmptyState text={error} />
              ) : (
                <TableShell>
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-[#FAFCF8] dark:bg-[#0F172A]">
                      <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">
                        <th className="px-5 py-4 font-semibold">Candidat</th>
                        <th className="px-5 py-4 font-semibold">Poste</th>
                        <th className="px-5 py-4 font-semibold">Date</th>
                        <th className="px-5 py-4 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF3E9] dark:divide-[#24324E]">
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500"
                          >
                            Aucune candidature
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c) => {
                          const name = getFullName(c);
                          return (
                            <tr
                              key={c._id}
                              className="transition hover:bg-[#FAFCF8] dark:hover:bg-[#16233D]"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF7E9] text-xs font-bold text-[#4E8F2F] dark:bg-[#143220] dark:text-[#9DCA7C]">
                                    {getInitials(name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                      {name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                      {formatTimeAgo(c.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="max-w-[220px] truncate px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                                {safeStr(c.jobTitle) || "—"}
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                                {formatDate(c.createdAt)}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={c.status || "SUBMITTED"}
                                  map={CAND_STATUS}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </TableShell>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:hidden">
              {loading ? (
                <SkeletonRows rows={4} />
              ) : error ? (
                <EmptyState text={error} />
              ) : filtered.length === 0 ? (
                <EmptyState text="Aucune candidature" />
              ) : (
                filtered.map((c) => {
                  const name = getFullName(c);
                  return (
                    <MobileDataCard
                      key={c._id}
                      title={name}
                      lines={[
                        safeStr(c.jobTitle) || "—",
                        formatDate(c.createdAt),
                        formatTimeAgo(c.createdAt),
                      ]}
                      badge={
                        <StatusBadge
                          status={c.status || "SUBMITTED"}
                          map={CAND_STATUS}
                        />
                      }
                    />
                  );
                })
              )}
            </div>
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Layers3}
              title="Entonnoir de recrutement"
              subtitle="Répartition des étapes du pipeline"
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                {funnelData.map((f) => (
                  <MiniProgress
                    key={f.lbl}
                    label={f.lbl}
                    value={f.n}
                    total={Math.max(total, 1)}
                    color={f.col}
                  />
                ))}
              </div>

              <div className="h-[260px] rounded-[24px] bg-[#FAFCF8] p-3 dark:bg-[#0F172A]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={funnelData.map((f) => ({ name: f.lbl, value: f.n }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="funnelFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={OPTY.green} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={OPTY.green} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#2A3A59"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #24324E",
                        fontSize: 12,
                        background: "#0F172A",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={OPTY.green}
                      strokeWidth={3}
                      fill="url(#funnelFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardShell>
        </div>

        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={GraduationCap}
              title="Niveaux d’études"
              subtitle="Répartition académique des profils"
            />

            {degreeData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={degreeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {degreeData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={DEGREE_COLORS[entry.name] || "#94A3B8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v} candidats`, n]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #24324E",
                        fontSize: 12,
                        background: "#0F172A",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      height={28}
                      formatter={(v) => (
                        <span className="text-xs text-gray-600 dark:text-slate-300">
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Sparkles}
              title="Qualité du matching IA"
              subtitle="Lecture rapide des indicateurs de pertinence"
            />

            <div className="space-y-4">
              {[
                {
                  lbl: "Score moyen",
                  val: data?.matching?.averageScore || 0,
                  col: OPTY.green,
                },
                {
                  lbl: "Profils > 70%",
                  val: data?.matching?.percentAbove80 || 0,
                  col: "#22C55E",
                },
                {
                  lbl: "Profils < 50%",
                  val: data?.matching?.percentBelow50 || 0,
                  col: OPTY.red,
                },
              ].map((m) => (
                <div key={m.lbl} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600 dark:text-slate-400">{m.lbl}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {m.val}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3E9] dark:bg-[#0F172A]">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${m.val}%`, background: m.col }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={FileText}
              title="Vue rapide"
              subtitle="Résumé utile en un coup d’œil"
            />

            <div className="space-y-3">
              <div className="rounded-2xl bg-[#F8FBF5] p-4 dark:bg-[#0F172A]">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Candidats en entretien
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {statusCounts.interview}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FBF5] p-4 dark:bg-[#0F172A]">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Offres envoyées
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {statusCounts.offer}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FBF5] p-4 dark:bg-[#0F172A]">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Profils refusés
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {statusCounts.refused}
                </p>
              </div>
            </div>
          </CardShell>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useInterviewsDashboard({
    page,
    limit: 10,
    status: statusFilter,
    search,
  });

  const stats = data?.stats || {};
  const interviews = data?.interviews || [];
  const upcoming = data?.upcoming || [];

  const interFilters = [
    { label: "Tous", value: null },
    { label: "Confirmés", value: "CONFIRMED" },
    { label: "En attente", value: "PENDING_CONFIRMATION" },
    { label: "Report", value: "CANDIDATE_REQUESTED_RESCHEDULE" },
    { label: "Approbation", value: "PENDING_ADMIN_APPROVAL" },
    { label: "Annulés", value: "CANCELLED" },
  ];

  const pipelineRows = [
    { lbl: "Confirmés", n: stats.confirmed || 0, col: OPTY.green },
    {
      lbl: "Attente responsable",
      n: stats.pendingConfirmation || 0,
      col: OPTY.amber,
    },
    {
      lbl: "Attente candidat",
      n: stats.pendingCandidateConfirmation || 0,
      col: OPTY.blue,
    },
    {
      lbl: "Report demandé",
      n: stats.candidateReschedule || 0,
      col: OPTY.purple,
    },
    {
      lbl: "Approbation admin",
      n: stats.pendingAdminApproval || 0,
      col: OPTY.orange,
    },
    { lbl: "Annulés", n: stats.cancelled || 0, col: OPTY.red },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Calendar}
          label="Total entretiens"
          value={stats.total || 0}
          sub="Tous les entretiens planifiés"
          color="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Confirmés"
          value={stats.confirmed || 0}
          sub={`${percent(stats.confirmed || 0, stats.total || 0)}% du total`}
          color="green"
        />
        <MetricCard
          icon={Clock}
          label="En attente"
          value={(stats.pendingConfirmation || 0) + (stats.pendingCandidateConfirmation || 0)}
          sub="Responsable + candidat"
          color="amber"
        />
        <MetricCard
          icon={XCircle}
          label="Annulés"
          value={stats.cancelled || 0}
          sub={`${percent(stats.cancelled || 0, stats.total || 0)}% du total`}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Calendar}
              title="Tous les entretiens"
              subtitle="Recherche, filtres et suivi des rendez-vous"
              action={
                <SoftInput
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              }
            />

            <FilterBar
              filters={interFilters}
              active={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />

            <div className="mt-5 hidden md:block">
              {loading ? (
                <SkeletonRows rows={6} />
              ) : error ? (
                <EmptyState text={error} />
              ) : (
                <TableShell>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#FAFCF8] dark:bg-[#0F172A]">
                      <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">
                        <th className="px-5 py-4 font-semibold">Candidat</th>
                        <th className="px-5 py-4 font-semibold">Poste</th>
                        <th className="px-5 py-4 font-semibold">Date</th>
                        <th className="px-5 py-4 font-semibold">Type</th>
                        <th className="px-5 py-4 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF3E9] dark:divide-[#24324E]">
                      {interviews.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500"
                          >
                            Aucun entretien
                          </td>
                        </tr>
                      ) : (
                        interviews.map((iv) => (
                          <tr
                            key={iv._id}
                            className="transition hover:bg-[#FAFCF8] dark:hover:bg-[#16233D]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF7E9] text-xs font-bold text-[#4E8F2F] dark:bg-[#143220] dark:text-[#9DCA7C]">
                                  {getInitials(iv.candidateName || "")}
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {iv.candidateName || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="max-w-[200px] truncate px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {iv.jobTitle || "—"}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {formatDate(iv.confirmedDate || iv.proposedDate)}
                              {(iv.confirmedTime || iv.proposedTime) && (
                                <span className="ml-1">
                                  {iv.confirmedTime || iv.proposedTime}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {iv.interviewType || "RH"}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={iv.status} map={INTER_STATUS} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </TableShell>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:hidden">
              {loading ? (
                <SkeletonRows rows={4} />
              ) : error ? (
                <EmptyState text={error} />
              ) : interviews.length === 0 ? (
                <EmptyState text="Aucun entretien" />
              ) : (
                interviews.map((iv) => (
                  <MobileDataCard
                    key={iv._id}
                    title={iv.candidateName || "—"}
                    lines={[
                      iv.jobTitle || "—",
                      `${formatDate(iv.confirmedDate || iv.proposedDate)} ${
                        iv.confirmedTime || iv.proposedTime || ""
                      }`,
                      iv.interviewType || "RH",
                    ]}
                    badge={<StatusBadge status={iv.status} map={INTER_STATUS} />}
                  />
                ))
              )}
            </div>

            {(data?.totalPages || 0) > 1 && (
              <div className="mt-5 flex flex-col gap-3 border-t border-[#EEF3E9] pt-4 dark:border-[#24324E] sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Page {data.page} / {data.totalPages} — {data.total} entretiens
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-xl border border-[#E7EFDF] bg-[#F9FCF7] px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-[#EEF7E9] disabled:opacity-40 dark:border-[#24324E] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-[#16233D]"
                  >
                    Préc.
                  </button>
                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl border border-[#E7EFDF] bg-[#F9FCF7] px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-[#EEF7E9] disabled:opacity-40 dark:border-[#24324E] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-[#16233D]"
                  >
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </CardShell>
        </div>

        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Layers3}
              title="Pipeline statuts"
              subtitle="Répartition des états des entretiens"
            />
            <div className="space-y-4">
              {pipelineRows.map((r) => (
                <MiniProgress
                  key={r.lbl}
                  label={r.lbl}
                  value={r.n}
                  total={stats.total || 1}
                  color={r.col}
                />
              ))}
            </div>
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Clock}
              title="Prochains entretiens"
              subtitle="Entretiens prévus sur les 7 prochains jours"
            />

            {upcoming.length === 0 ? (
              <EmptyState text="Aucun entretien à venir." />
            ) : (
              <div className="space-y-3">
                {upcoming.map((iv) => (
                  <div
                    key={iv._id}
                    className="flex items-start gap-3 rounded-2xl border border-[#EEF3E9] bg-[#FBFDF9] p-3 transition hover:bg-[#F7FBF4] dark:border-[#24324E] dark:bg-[#0F172A] dark:hover:bg-[#16233D]"
                  >
                    <div className="min-w-[52px] rounded-2xl bg-[#EEF7E9] px-2 py-2 text-center dark:bg-[#143220]">
                      <p className="text-base font-bold leading-none text-gray-900 dark:text-white">
                        {new Date(iv.proposedDate).getDate()}
                      </p>
                      <p className="mt-1 text-[10px] uppercase text-gray-500 dark:text-slate-400">
                        {new Date(iv.proposedDate).toLocaleDateString("fr-FR", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {iv.candidateName || "—"}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                        {iv.jobTitle || "—"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {iv.proposedTime} · {iv.interviewType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardShell>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useJobsDashboard({
    page,
    limit: 15,
    status: statusFilter,
    search,
  });

  const stats = data?.stats || {};
  const jobs = data?.jobs || [];

  const jobFilters = [
    { label: "Tous", value: null },
    { label: "En attente", value: "EN_ATTENTE" },
    { label: "Validées", value: "VALIDEE" },
    { label: "Confirmées", value: "CONFIRMEE" },
    { label: "Rejetées", value: "REJETEE" },
  ];

  const pieRows = [
    { name: "En attente", value: stats.en_attente || 0 },
    { name: "Validées", value: stats.validee || 0 },
    { name: "Confirmées", value: stats.confirmee || 0 },
    { name: "Rejetées", value: stats.rejetee || 0 },
  ].filter((d) => d.value > 0);

  const deptMap = {};
  jobs.forEach((j) => {
    const d = j.departement || "Non défini";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const sortedDepts = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Briefcase}
          label="Total offres"
          value={stats.total || 0}
          sub="Toutes catégories"
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="En attente"
          value={stats.en_attente || 0}
          sub="Offres à valider"
          color="amber"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Confirmées"
          value={stats.confirmee || 0}
          sub="Offres publiées"
          color="green"
        />
        <MetricCard
          icon={XCircle}
          label="Rejetées"
          value={stats.rejetee || 0}
          sub={`${percent(stats.rejetee || 0, stats.total || 0)}% du total`}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Briefcase}
              title="Toutes les offres"
              subtitle="Liste des offres avec recherche et filtres"
              action={
                <SoftInput
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              }
            />

            <FilterBar
              filters={jobFilters}
              active={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />

            <div className="mt-5 hidden md:block">
              {loading ? (
                <SkeletonRows rows={6} />
              ) : error ? (
                <EmptyState text={error} />
              ) : (
                <TableShell>
                  <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-[#FAFCF8] dark:bg-[#0F172A]">
                      <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">
                        <th className="px-5 py-4 font-semibold">Titre</th>
                        <th className="px-5 py-4 font-semibold">Département</th>
                        <th className="px-5 py-4 font-semibold">Lieu</th>
                        <th className="px-5 py-4 font-semibold">Créé par</th>
                        <th className="px-5 py-4 font-semibold">Clôture</th>
                        <th className="px-5 py-4 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF3E9] dark:divide-[#24324E]">
                      {jobs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500"
                          >
                            Aucune offre trouvée
                          </td>
                        </tr>
                      ) : (
                        jobs.map((j) => (
                          <tr
                            key={String(j._id)}
                            className="transition hover:bg-[#FAFCF8] dark:hover:bg-[#16233D]"
                          >
                            <td className="px-5 py-4">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                                {j.titre || "—"}
                              </p>
                              {j.typeContrat ? (
                                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                                  {j.typeContrat}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {j.departement || "—"}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {j.lieu || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-800 dark:text-slate-200">
                                {j.createdByUser || "—"}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                {j.createdByEmail || ""}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                              {j.dateCloture ? formatDate(j.dateCloture) : "—"}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge
                                status={j.status}
                                map={JOB_STATUS_MAP}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </TableShell>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:hidden">
              {loading ? (
                <SkeletonRows rows={4} />
              ) : error ? (
                <EmptyState text={error} />
              ) : jobs.length === 0 ? (
                <EmptyState text="Aucune offre trouvée" />
              ) : (
                jobs.map((j) => (
                  <MobileDataCard
                    key={String(j._id)}
                    title={j.titre || "—"}
                    lines={[
                      j.departement || "—",
                      j.lieu || "—",
                      j.dateCloture ? formatDate(j.dateCloture) : "—",
                    ]}
                    badge={<StatusBadge status={j.status} map={JOB_STATUS_MAP} />}
                  />
                ))
              )}
            </div>

            {(data?.totalPages || 0) > 1 && (
              <div className="mt-5 flex flex-col gap-3 border-t border-[#EEF3E9] pt-4 dark:border-[#24324E] sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Page {data.page} / {data.totalPages} — {data.count} offres
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-xl border border-[#E7EFDF] bg-[#F9FCF7] px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-[#EEF7E9] disabled:opacity-40 dark:border-[#24324E] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-[#16233D]"
                  >
                    Préc.
                  </button>
                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl border border-[#E7EFDF] bg-[#F9FCF7] px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-[#EEF7E9] disabled:opacity-40 dark:border-[#24324E] dark:bg-[#0F172A] dark:text-slate-200 dark:hover:bg-[#16233D]"
                  >
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </CardShell>
        </div>

        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Layers3}
              title="Pipeline offres"
              subtitle="Répartition des statuts"
            />
            <div className="space-y-4">
              {[
                { lbl: "En attente", n: stats.en_attente || 0, col: OPTY.amber },
                { lbl: "Validées", n: stats.validee || 0, col: OPTY.blue },
                { lbl: "Confirmées", n: stats.confirmee || 0, col: OPTY.green },
                { lbl: "Rejetées", n: stats.rejetee || 0, col: OPTY.red },
              ].map((r) => (
                <MiniProgress
                  key={r.lbl}
                  label={r.lbl}
                  value={r.n}
                  total={stats.total || 1}
                  color={r.col}
                />
              ))}
            </div>
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Activity}
              title="Répartition statuts"
              subtitle="Visualisation rapide du portefeuille d’offres"
            />

            {stats.total > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieRows}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {[OPTY.amber, OPTY.blue, OPTY.green, OPTY.red].map(
                        (col, i) => (
                          <Cell key={i} fill={col} />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v} offres`, n]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #24324E",
                        fontSize: 12,
                        background: "#0F172A",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      height={28}
                      formatter={(v) => (
                        <span className="text-xs text-gray-600 dark:text-slate-300">
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Briefcase}
              title="Top départements"
              subtitle="Départements les plus actifs"
            />

            {sortedDepts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {sortedDepts.map(([dept, count]) => (
                  <MiniProgress
                    key={dept}
                    label={dept}
                    value={count}
                    total={sortedDepts[0]?.[1] || 1}
                    color={OPTY.green}
                  />
                ))}
              </div>
            )}
          </CardShell>
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
  const interviewsList = interData?.allInterviews || interData?.interviews || [];

  const typeCounts = interviewsList.reduce((acc, iv) => {
    const t = (iv.interviewType || "RH").toUpperCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const now = Date.now();
  const weekLabels = ["S-4", "S-3", "S-2", "S-1", "Cette sem."];

  const barData = weekLabels.map((week, i) => {
    const weekStart = now - (4 - i) * 7 * 86400000;
    const weekEnd = weekStart + 7 * 86400000;

    const weekItems = interviewsList.filter((iv) => {
      const d = new Date(iv.createdAt).getTime();
      return d >= weekStart && d < weekEnd;
    });

    return {
      week,
      confirmes: weekItems.filter((iv) => iv.status === "CONFIRMED").length,
      attente: weekItems.filter((iv) => iv.status?.includes("PENDING")).length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total candidatures"
          value={candData?.total || 0}
          sub="Vue globale du recrutement"
          color="green"
        />
        <MetricCard
          icon={Calendar}
          label="Total entretiens"
          value={stats.total || 0}
          sub="Planifiés ou traités"
          color="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Taux confirmation"
          value={`${percent(stats.confirmed || 0, stats.total || 0)}%`}
          sub="Entretiens confirmés"
          color="amber"
        />
        <MetricCard
          icon={TrendingUp}
          label="Matching moyen"
          value={`${candData?.matching?.averageScore || 0}%`}
          sub="Qualité générale des profils"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Activity}
              title="Activité hebdomadaire"
              subtitle="Volume d’entretiens confirmés et en attente"
            />

            <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#78C043]" />
                Confirmés
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                En attente
              </span>
            </div>

            <div className="h-[300px] rounded-[24px] bg-[#FAFCF8] p-3 dark:bg-[#0F172A]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#2A3A59"
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #24324E",
                      fontSize: 12,
                      background: "#0F172A",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="confirmes"
                    fill={OPTY.green}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="attente"
                    fill={OPTY.amber}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardShell>
        </div>

        <div className="space-y-6">
          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Calendar}
              title="Types d’entretiens"
              subtitle="Répartition des formats utilisés"
            />

            {typeData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v} entretiens`, n]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #24324E",
                        fontSize: 12,
                        background: "#0F172A",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      height={28}
                      formatter={(v) => (
                        <span className="text-xs text-gray-600 dark:text-slate-300">
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Sparkles}
              title="Matching IA"
              subtitle="Barres de qualité des profils"
            />

            <div className="space-y-4">
              {[
                {
                  lbl: "Score moyen",
                  val: candData?.matching?.averageScore || 0,
                  col: OPTY.green,
                },
                {
                  lbl: "Profils > 70%",
                  val: candData?.matching?.percentAbove80 || 0,
                  col: "#22C55E",
                },
                {
                  lbl: "Profils < 50%",
                  val: candData?.matching?.percentBelow50 || 0,
                  col: OPTY.red,
                },
              ].map((m) => (
                <div key={m.lbl} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600 dark:text-slate-400">{m.lbl}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {m.val}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF3E9] dark:bg-[#0F172A]">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${m.val}%`, background: m.col }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell className="p-5 lg:p-6">
            <SectionTitle
              icon={Layers3}
              title="Pipeline entretiens"
              subtitle="Statuts synthétiques"
            />

            <div className="space-y-4">
              {[
                { lbl: "Confirmés", n: stats.confirmed || 0, col: OPTY.green },
                {
                  lbl: "En attente",
                  n:
                    (stats.pendingConfirmation || 0) +
                    (stats.pendingCandidateConfirmation || 0),
                  col: OPTY.amber,
                },
                { lbl: "Annulés", n: stats.cancelled || 0, col: OPTY.red },
              ].map((r) => (
                <MiniProgress
                  key={r.lbl}
                  label={r.lbl}
                  value={r.n}
                  total={stats.total || 1}
                  color={r.col}
                />
              ))}
            </div>
          </CardShell>
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

  const candHook = useCandidaturesDashboard();
  const interHook = useInterviewsDashboard({ page: 1, limit: 10 });

  const tabs = [
    { id: "candidatures", label: "Candidatures" },
    { id: "offres", label: "Offres" },
    { id: "entretiens", label: "Entretiens" },
    { id: "global", label: "Vue globale" },
  ];

  const totalCandidates = candHook?.data?.total || 0;
  const totalInterviews = interHook?.data?.stats?.total || 0;

  return (
    <div className="min-h-screen bg-[#F6FAF3] text-gray-900 transition-colors duration-300 dark:bg-[#030B1B] dark:text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHero
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          totalCandidates={totalCandidates}
          totalInterviews={totalInterviews}
        />

        <div className="mt-6">
          {activeTab === "candidatures" && <TabCandidatures />}
          {activeTab === "offres" && <TabOffres />}
          {activeTab === "entretiens" && <TabEntretiens />}
          {activeTab === "global" && (
            <TabGlobal candData={candHook.data} interData={interHook.data} />
          )}
        </div>
      </div>
    </div>
  );
}