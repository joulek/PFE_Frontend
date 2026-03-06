"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "Attente ResponsableMétier", short: "Attente Resp.",
    color: "#B45309", bg: "#FEF3C7", border: "#FDE68A", dot: "#F59E0B",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente candidat", short: "Attente Candidat",
    color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE", dot: "#3B82F6",
  },
  CONFIRMED: {
    label: "Confirmé", short: "Confirmé",
    color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0", dot: "#10B981",
  },
  CANDIDATE_REQUESTED_RESCHEDULE: {
    label: "Report demandé", short: "Report candidat",
    color: "#92400E", bg: "#FEE2E2", border: "#FECACA", dot: "#F97316",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "Attente admin", short: "Attente admin",
    color: "#5B21B6", bg: "#EDE9FE", border: "#DDD6FE", dot: "#8B5CF6",
  },
  MODIFIED: {
    label: "Modifié", short: "Modifié",
    color: "#1E40AF", bg: "#E0E7FF", border: "#C7D2FE", dot: "#6366F1",
  },
  CANCELLED: {
    label: "Annulé", short: "Annulé",
    color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", dot: "#EF4444",
  },
};

const TYPE_CONFIG = {
  RH:           { label: "Entretien RH", color: "#0369A1", bg: "#E0F2FE", border: "#BAE6FD" },
  rh:           { label: "Entretien RH", color: "#0369A1", bg: "#E0F2FE", border: "#BAE6FD" },
  rh_technique: { label: "RH + Tech",    color: "#6D28D9", bg: "#EDE9FE", border: "#DDD6FE" },
  TECHNIQUE:    { label: "Technique",    color: "#BE185D", bg: "#FCE7F3", border: "#FBCFE8" },
  DGA:          { label: "DGA",          color: "#9F1239", bg: "#FFF1F2", border: "#FFE4E6" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

const AVATAR_GRADIENTS = [
  ["#6366F1","#8B5CF6"],["#0EA5E9","#6366F1"],["#10B981","#0EA5E9"],
  ["#F59E0B","#EF4444"],["#EC4899","#8B5CF6"],["#14B8A6","#6366F1"],
];
function getGradient(name) {
  return AVATAR_GRADIENTS[(name || "").charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function getDGANote(interview) {
  const notes = interview.entretienNotesDGA || [];
  if (!notes.length) return null;
  return [...notes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
}

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const [c1, c2] = getGradient(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.38, fontWeight: 700,
      flexShrink: 0, letterSpacing: "-0.5px",
    }}>{getInitials(name)}</div>
  );
}

function Badge({ label, color, bg, border, dot }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      color, background: bg, border: `1px solid ${border}`, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function ScoreStar({ score }) {
  if (score === null || score === undefined) return null;
  const colors = ["#EF4444","#F97316","#F59E0B","#84CC16","#10B981"];
  const c = colors[Math.min(Math.floor(score) - 1, 4)] || "#94A3B8";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, color: c,
      background: c + "18", border: `1px solid ${c}30`,
    }}>★ {score}/5</span>
  );
}

function StatCard({ label, value, accent, active, onClick, loading }) {
  return (
    <button onClick={onClick} style={{
      background: active ? accent + "18" : "#fff",
      border: `1.5px solid ${active ? accent : "#E2E8F0"}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 4,
      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
      boxShadow: active ? `0 0 0 3px ${accent}22` : "0 1px 3px #0000000a",
      minWidth: 0,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: active ? accent : "#0F172A", fontFamily: "'DM Mono', monospace" }}>
        {loading ? "—" : value}
      </span>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? accent : "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
      <svg style={{ width: 32, height: 32, animation: "spin 0.8s linear infinite" }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 13, color: "#64748B" }}>Chargement des entretiens…</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminInterviewList() {
  const router = useRouter();

  // ── State ──
  const [interviews, setInterviews]   = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]             = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // id de l'entretien en cours d'action

  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  const LIMIT = 10;
  const debounceRef = useRef(null);

  // ── Debounce search ──
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  // ── Fetch interviews (backend fait le filtre + pagination) ──
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });
      const data = await apiFetch(`/api/interviews/admin/all?${params}`);
      setInterviews(data.interviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch("/api/interviews/admin/stats");
      setStats(data.data);
    } catch (_) {
      // stats non bloquantes
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Actions admin ──
  async function handleApprove(interviewId, e) {
    e.stopPropagation();
    if (!confirm("Approuver la modification de cet entretien ?")) return;
    setActionLoading(interviewId + "_approve");
    try {
      await apiFetch(`/api/interviews/admin/approve/${interviewId}`, { method: "POST", body: JSON.stringify({}) });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(interviewId, e) {
    e.stopPropagation();
    const reason = prompt("Raison du rejet (optionnel) :");
    if (reason === null) return; // annulé
    setActionLoading(interviewId + "_reject");
    try {
      await apiFetch(`/api/interviews/admin/reject/${interviewId}`, { method: "POST", body: JSON.stringify({ reason }) });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(interviewId, e) {
    e.stopPropagation();
    const reason = prompt("Raison de l'annulation (optionnel) :");
    if (reason === null) return;
    setActionLoading(interviewId + "_cancel");
    try {
      await apiFetch(`/api/interviews/${interviewId}`, { method: "DELETE", body: JSON.stringify({ reason }) });
      await fetchInterviews();
      await fetchStats();
      setExpandedRow(null);
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      padding: "28px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        .row-hover:hover { background: #F1F5FF !important; }
        .row-expand { background: #F8F9FF; border-top: 1px solid #EEF2FF; }
        input:focus { outline: none; }
        button:focus { outline: none; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        .filter-pill { transition: all 0.12s; }
        .filter-pill:hover { background: #EFF6FF !important; border-color: #93C5FD !important; }
        .page-btn:hover:not(:disabled) { background: #EEF2FF !important; color: #4F46E5 !important; }
        .action-btn:hover { opacity: 0.75; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 4px 12px #4F46E540",
            }}>📋</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
              Liste des Entretiens
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
            Administration · Vue globale de tous les entretiens
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Refresh */}
          <button onClick={() => { fetchInterviews(); fetchStats(); }} style={{
            padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0",
            background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>↺</button>
          <button onClick={() => router.push("/recruiter/schedule_interview")} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            color: "#fff", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px #4F46E540",
          }}>+ Planifier un entretien</button>
        </div>
      </div>

      {/* ── Stats cards (cliquables = filtres) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { key: "ALL",                              label: "Total",         accent: "#4F46E5", val: stats?.TOTAL },
          { key: "CONFIRMED",                        label: "Confirmés",     accent: "#10B981", val: stats?.CONFIRMED },
          { key: "PENDING_CONFIRMATION",             label: "Att. Resp.",    accent: "#F59E0B", val: stats?.PENDING_CONFIRMATION },
          { key: "PENDING_CANDIDATE_CONFIRMATION",   label: "Att. Candidat", accent: "#3B82F6", val: stats?.PENDING_CANDIDATE_CONFIRMATION },
          { key: "CANDIDATE_REQUESTED_RESCHEDULE",   label: "Report",        accent: "#F97316", val: stats?.CANDIDATE_REQUESTED_RESCHEDULE },
          { key: "PENDING_ADMIN_APPROVAL",           label: "Att. Admin",    accent: "#8B5CF6", val: stats?.PENDING_ADMIN_APPROVAL },
          { key: "CANCELLED",                        label: "Annulés",       accent: "#EF4444", val: stats?.CANCELLED },
        ].map(({ key, label, accent, val }) => (
          <StatCard
            key={key}
            label={label}
            value={val ?? 0}
            accent={accent}
            active={statusFilter === key}
            loading={statsLoading}
            onClick={() => setStatusFilter(key)}
          />
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{
        background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94A3B8" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, poste…"
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12,
              height: 36, border: "1.5px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#0F172A", background: "#F8FAFC", transition: "border 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "#818CF8"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
        </div>
        {["ALL", "CONFIRMED", "PENDING_CONFIRMATION", "PENDING_ADMIN_APPROVAL", "CANCELLED"].map(s => {
          const cfg = s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          return (
            <button key={s} className="filter-pill" onClick={() => setStatusFilter(s)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 99,
              border: `1.5px solid ${isActive ? "#818CF8" : "#E2E8F0"}`,
              background: isActive ? "#EEF2FF" : "#fff",
              color: isActive ? "#4F46E5" : "#64748B",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {cfg?.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />}
              {cfg?.short || "Tous"}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
          {loading ? "…" : `${total} résultat${total > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 8px #0000000a" }}>
        {loading ? (
          <Spinner />
        ) : error ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#EF4444", marginBottom: 8 }}>{error}</div>
            <button onClick={fetchInterviews} style={{
              padding: "8px 20px", borderRadius: 8,
              background: "#4F46E5", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>Réessayer</button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                  {["Candidat", "Poste", "Date / Heure", "Type Entretien", "Statut", "Planification", "Éval. DGA", ""].map(h => (
                    <th key={h} style={{
                      padding: "11px 16px", textAlign: "left",
                      fontSize: 10.5, fontWeight: 700, color: "#64748B",
                      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center", color: "#94A3B8" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Aucun entretien trouvé</div>
                    </td>
                  </tr>
                ) : interviews.map((iv) => {
                  const sc         = STATUS_CONFIG[iv.status] || {};
                  const tc         = TYPE_CONFIG[iv.interviewType] || TYPE_CONFIG.RH;
                  const dgaNote    = getDGANote(iv);
                  const score      = dgaNote ? (dgaNote.evaluationGlobale ?? dgaNote.score ?? null) : null;
                  const comment    = dgaNote ? (dgaNote.commentaire || "") : "";
                  const hasConfirmedDate = !!iv.confirmedDate;
                  const displayDate = hasConfirmedDate ? iv.confirmedDate : iv.proposedDate;
                  const displayTime = hasConfirmedDate ? iv.confirmedTime : iv.proposedTime;
                  const isCancelled = iv.status === "CANCELLED";
                  const isExpanded  = expandedRow === iv._id;
                  const hasDGA      = iv.allEntretienNotes?.some(n => /dga/i.test(n.type));
                  const parts       = (iv.candidateName || "").split(" ");
                  const prenom      = parts[0] || "";
                  const nom         = parts.slice(1).join(" ") || "";
                  const isActioning = actionLoading?.startsWith(iv._id);

                  return [
                    <tr
                      key={iv._id}
                      className="row-hover"
                      style={{
                        borderBottom: isExpanded ? "none" : "1px solid #F1F5F9",
                        opacity: isCancelled ? 0.55 : 1,
                        cursor: "pointer",
                        background: isExpanded ? "#F8F9FF" : "transparent",
                        transition: "background 0.1s",
                      }}
                      onClick={() => setExpandedRow(isExpanded ? null : iv._id)}
                    >
                      {/* Candidat */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={iv.candidateName} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
                              {prenom} <span style={{ textTransform: "uppercase" }}>{nom}</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>{iv.candidateEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Poste */}
                      <td style={{ padding: "12px 16px", maxWidth: 160 }}>
                        <span style={{ color: "#334155", fontWeight: 600, fontSize: 12.5 }}>{iv.jobTitle}</span>
                      </td>

                      {/* Date / Heure */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: hasConfirmedDate ? "#065F46" : "#334155", fontSize: 12.5 }}>
                          {formatDate(displayDate)}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          {displayTime || "—"}
                          {hasConfirmedDate && <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span>}
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <Badge label={tc.label} color={tc.color} bg={tc.bg} border={tc.border} />
                          {hasDGA && !isCancelled && (
                            <span style={{ fontSize: 10.5, color: "#9F1239", fontWeight: 600 }}>+ Note DGA</span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: "12px 16px" }}>
                        <Badge label={sc.short || iv.status} color={sc.color} bg={sc.bg} border={sc.border} dot={sc.dot} />
                      </td>

                      {/* Planification */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#93C5FD", flexShrink: 0 }} />
                            <span style={{ fontSize: 11.5, color: "#475569" }}>Planifié {formatDate(iv.createdAt)}</span>
                          </div>
                          {iv.status === "CONFIRMED" && iv.confirmedDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                              <span style={{ fontSize: 11.5, color: "#065F46", fontWeight: 600 }}>Confirmé {formatDate(iv.confirmedDate)}</span>
                            </div>
                          )}
                          {iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F97316", flexShrink: 0 }} />
                              <span style={{ fontSize: 11.5, color: "#92400E" }}>
                                Report : {formatDate(iv.candidateProposedDate)} {iv.candidateProposedTime}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Éval DGA */}
                      <td style={{ padding: "12px 16px" }}>
                        {dgaNote ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <ScoreStar score={score} />
                            {comment && (
                              <span style={{
                                fontSize: 11, color: "#64748B", maxWidth: 150,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }} title={comment}>{comment}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#CBD5E1", fontStyle: "italic" }}>—</span>
                        )}
                      </td>

                      {/* Chevron */}
                      <td style={{ padding: "12px 12px 12px 0", textAlign: "center" }}>
                        <span style={{
                          fontSize: 12, color: "#94A3B8", display: "inline-block",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s",
                        }}>▾</span>
                      </td>
                    </tr>,

                    // ── Ligne expandée ──
                    isExpanded && (
                      <tr key={iv._id + "-expand"} className="row-expand">
                        <td colSpan={8} style={{ padding: "0 16px 16px 16px" }}>
                          <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: 12, paddingTop: 14,
                          }}>
                            {[
                              { label: "Email candidat",  value: iv.candidateEmail },
                              { label: "Date proposée",   value: `${formatDate(iv.proposedDate)} ${iv.proposedTime || ""}` },
                              { label: "Date confirmée",  value: iv.confirmedDate ? `${formatDate(iv.confirmedDate)} ${iv.confirmedTime || ""}` : "Non confirmée" },
                              { label: "Responsable",     value: iv.assignedUserEmail || "—" },
                              { label: "Notes",           value: iv.notes || "Aucune note" },
                              ...(iv.status === "CANDIDATE_REQUESTED_RESCHEDULE" ? [{ label: "Raison report", value: iv.candidateRescheduleReason || "Non précisée" }] : []),
                              ...(iv.status === "PENDING_ADMIN_APPROVAL" ? [{ label: "Nouvelle date prop.", value: `${formatDate(iv.responsableProposedDate)} ${iv.responsableProposedTime || ""}` }] : []),
                            ].map(({ label, value }) => (
                              <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #E2E8F0" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 12.5, color: "#334155", fontWeight: 500 }}>{value}</div>
                              </div>
                            ))}

                            {/* Actions */}
                            <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                              {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                <>
                                  <button
                                    className="action-btn"
                                    disabled={!!isActioning}
                                    onClick={(e) => handleApprove(iv._id, e)}
                                    style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#D1FAE5", color: "#065F46", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                  >
                                    {actionLoading === iv._id + "_approve" ? "…" : "✓ Approuver la modification"}
                                  </button>
                                  <button
                                    className="action-btn"
                                    disabled={!!isActioning}
                                    onClick={(e) => handleReject(iv._id, e)}
                                    style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                  >
                                    {actionLoading === iv._id + "_reject" ? "…" : "✗ Rejeter"}
                                  </button>
                                </>
                              )}
                              <button
                                className="action-btn"
                                onClick={(e) => { e.stopPropagation(); router.push(`/recruiter/candidatures/${iv.candidatureId}`); }}
                                style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                              >Voir candidature →</button>
                              {!isCancelled && (
                                <button
                                  className="action-btn"
                                  disabled={!!isActioning}
                                  onClick={(e) => handleCancel(iv._id, e)}
                                  style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
                                >
                                  {actionLoading === iv._id + "_cancel" ? "…" : "Annuler l'entretien"}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{
            borderTop: "1.5px solid #F1F5F9", padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#FAFBFC", flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              Page <strong style={{ color: "#475569" }}>{page}</strong> sur {totalPages} — {total} entretiens
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                <button key={p} className="page-btn" onClick={() => setPage(p)} style={{
                  width: 30, height: 30, borderRadius: 7,
                  border: `1.5px solid ${p === page ? "#818CF8" : "#E2E8F0"}`,
                  background: p === page ? "#EEF2FF" : "#fff",
                  color: p === page ? "#4F46E5" : "#64748B",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                padding: "5px 12px", borderRadius: 7, border: "1.5px solid #E2E8F0",
                background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: page === 1 ? 0.4 : 1,
              }}>← Préc.</button>
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                padding: "5px 12px", borderRadius: 7, border: "1.5px solid #E2E8F0",
                background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: page === totalPages ? 0.4 : 1,
              }}>Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}