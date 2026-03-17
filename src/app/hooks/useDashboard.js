// hooks/useDashboard.js
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

/* ─── MAP type → label ──────────────────────────────────────
   Basé sur NOTIFICATION_TYPES dans Notification.model.js
─────────────────────────────────────────────────────────── */
const TYPE_LABEL = {
  NEW_CANDIDATURE:                 "Candidature soumise",
  NEW_JOB_PENDING:                 "Nouvelle offre en attente",
  JOB_CONFIRMED:                   "Offre confirmée",
  JOB_REJECTED:                    "Offre rejetée",
  INTERVIEW_SCHEDULED:             "Entretien planifié",
  INTERVIEW_CANDIDATE_CONFIRMED:   "Entretien confirmé",
  INTERVIEW_RESPONSABLE_CONFIRMED: "Date confirmée par responsable",
  INTERVIEW_RESPONSABLE_MODIFIED:  "Modification demandée",
  INTERVIEW_CANDIDATE_RESCHEDULE:  "Report d'entretien demandé",
  INTERVIEW_ADMIN_APPROVED_MODIF:  "Modification approuvée",
  INTERVIEW_ADMIN_REJECTED_MODIF:  "Modification refusée",
};

/* ─── MAP type → couleur avatar ──────────────────────────── */
const TYPE_COLOR = {
  NEW_CANDIDATURE:                 "bg-blue-100   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400",
  NEW_JOB_PENDING:                 "bg-amber-100  dark:bg-amber-900/30  text-amber-600  dark:text-amber-400",
  JOB_CONFIRMED:                   "bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400",
  JOB_REJECTED:                    "bg-red-100    dark:bg-red-900/30    text-red-600    dark:text-red-400",
  INTERVIEW_SCHEDULED:             "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  INTERVIEW_CANDIDATE_CONFIRMED:   "bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400",
  INTERVIEW_RESPONSABLE_CONFIRMED: "bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400",
  INTERVIEW_RESPONSABLE_MODIFIED:  "bg-amber-100  dark:bg-amber-900/30  text-amber-600  dark:text-amber-400",
  INTERVIEW_CANDIDATE_RESCHEDULE:  "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  INTERVIEW_ADMIN_APPROVED_MODIF:  "bg-green-100  dark:bg-green-900/30  text-green-600  dark:text-green-400",
  INTERVIEW_ADMIN_REJECTED_MODIF:  "bg-red-100    dark:bg-red-900/30    text-red-600    dark:text-red-400",
};

function extractName(notif) {
  const m = notif.metadata || {};

  // 1. Depuis metadata (candidatName ou candidateName selon les controllers)
  const fromMeta = m.candidatName || m.candidateName || m.userName || null;
  if (fromMeta) return fromMeta;

  // 2. Depuis le message — format : "Nouvelle candidature de Prénom Nom pour ..."
  //    ou "✅ Prénom Nom a confirmé..." ou "📅 Prénom Nom demande..."
  if (notif.message) {
    // Pattern : "de X pour"
    const matchDe = notif.message.match(/de\s+([A-ZÀ-Ö][a-zà-ö]+(?:\s+[A-ZÀ-Ö][a-zà-ö]+)+)\s+pour/);
    if (matchDe) return matchDe[1];

    // Pattern : emoji + "X a " ou "X demande"
    const matchAction = notif.message.match(/[^\w]([A-ZÀ-Ö][a-zà-ö]+(?:\s+[A-ZÀ-Ö][a-zà-ö]+)+)\s+(?:a |demande|est)/);
    if (matchAction) return matchAction[1];
  }

  return null;
}

function getInitials(name = "") {
  return name.trim().split(" ").filter(Boolean).slice(0, 2)
    .map(p => p[0]).join("").toUpperCase() || "?";
}

function formatTimeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${d} j`;
}

/* ═══════════════════════════════════════════════════════════
   useActivity — branche sur GET /notifications
   Transforme chaque notification en item affichable :
   { name, initials, action, time, color, read, link }
═══════════════════════════════════════════════════════════ */
export function useActivity({ initialLimit = 10 } = {}) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [unread, setUnread]   = useState(0);
  const [limit, setLimit]     = useState(initialLimit);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const [notifsRes, countRes] = await Promise.all([
        apiFetch(`/notifications?limit=${l}`),
        apiFetch("/notifications/unread-count"),
      ]);

      const notifs = Array.isArray(notifsRes)
        ? notifsRes
        : (notifsRes?.data || notifsRes?.notifications || []);

      const mapped = notifs.map(n => {
        const name     = extractName(n);
        const action   = TYPE_LABEL[n.type] || n.message || n.type;
        const color    = TYPE_COLOR[n.type]  ||
          "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
        const initials = name ? getInitials(name) : "SY";
        return {
          _id:      String(n._id),
          name:     name || "Système",
          initials,
          action,
          time:     formatTimeAgo(n.createdAt),
          color,
          read:     !!n.read,
          link:     n.link || null,
        };
      });

      setItems(mapped);
      setHasMore(notifs.length === l);
      setUnread(countRes?.count ?? countRes?.unreadCount ?? 0);
    } catch (err) {
      console.error("useActivity:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(limit); }, [limit]);

  const loadMore = useCallback(() => {
    const newLimit = limit + 10;
    setLimit(newLimit);
  }, [limit]);

  return { items, loading, error, unread, hasMore, reload: () => load(limit), loadMore };
}

/* ═══════════════════════════════════════════════════════════
   useJobsDashboard
   Routes : GET /jobs/tracking/stats
            GET /jobs/tracking/paginated?page=&limit=&status=
            GET /jobs/count
═══════════════════════════════════════════════════════════ */
export function useJobsDashboard({ page = 1, limit = 15, status = null, search = "" } = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:  String(page),
          limit: String(limit),
          ...(status ? { status } : {}),
        });

        const [statsRes, listRes] = await Promise.all([
          apiFetch("/jobs/tracking/stats"),
          apiFetch(`/jobs/tracking/paginated?${params}`),
        ]);

        if (cancelled) return;

        const s = statsRes?.data || {};
        const total = (s.EN_ATTENTE || 0) + (s.VALIDEE || 0) + (s.CONFIRMEE || 0) + (s.REJETEE || 0);

        // Filtre search côté client sur titre/lieu/créateur
        const allJobs = listRes?.data || [];
        const filtered = search.trim()
          ? allJobs.filter(j =>
              j.titre?.toLowerCase().includes(search.toLowerCase()) ||
              j.lieu?.toLowerCase().includes(search.toLowerCase()) ||
              j.createdByUser?.toLowerCase().includes(search.toLowerCase())
            )
          : allJobs;

        setData({
          jobs:       filtered,
          total,
          totalPages: listRes?.pagination?.pages  || 1,
          page:       listRes?.pagination?.page   || 1,
          count:      listRes?.pagination?.total  || 0,
          stats: {
            total,
            en_attente: s.EN_ATTENTE || 0,
            validee:    s.VALIDEE    || 0,
            confirmee:  s.CONFIRMEE  || 0,
            rejetee:    s.REJETEE    || 0,
          },
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, limit, status, search]);

  return { data, loading, error };
}

/* ═══════════════════════════════════════════════════════════
   useCandidaturesDashboard
═══════════════════════════════════════════════════════════ */
export function useCandidaturesDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countRes, withJobRes, matchingRes, academicRes, metaOfferRes] = await Promise.all([
        apiFetch("/candidatures/count"),
        apiFetch("/candidatures/with-job"),
        apiFetch("/candidatures/stats/matching"),
        apiFetch("/candidatures/stats/academic"),
        apiFetch("/candidatures/meta-offer").catch(() => null), // graceful fallback
      ]);

      const sorted = [...(withJobRes || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // meta-offer peut retourner { total, submitted, preselect, interview, offer, hired, refused }
      // ou un tableau de { _id: "STATUS", count: N }
      let metaOffer = null;
      if (metaOfferRes) {
        if (Array.isArray(metaOfferRes)) {
          // format tableau [{_id: "SUBMITTED", count: 3}, ...]
          metaOffer = metaOfferRes.reduce((acc, item) => {
            acc[item._id] = item.count || item.total || 0;
            return acc;
          }, {});
        } else {
          // format objet direct
          metaOffer = metaOfferRes?.data || metaOfferRes;
        }
      }

      setData({
        total:        countRes?.count || 0,
        candidatures: sorted,
        last:         sorted.slice(0, 8),
        matching: {
          averageScore:   Math.round(matchingRes?.averageScore   || 0),
          percentAbove80: Math.round(matchingRes?.percentAbove80 || 0),
          percentBelow50: Math.round(matchingRes?.percentBelow50 || 0),
        },
        academic: {
          degreeDistribution: academicRes?.degreeDistribution || [],
          topUniversities:    academicRes?.topUniversities    || [],
          averageLevel:       academicRes?.averageLevel       || 0,
        },
        metaOffer, // données brutes de /candidatures/meta-offer
      });
    } catch (err) {
      console.error("useCandidaturesDashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

/* ═══════════════════════════════════════════════════════════
   useInterviewsDashboard
═══════════════════════════════════════════════════════════ */
export function useInterviewsDashboard({
  page = 1, limit = 15, status = null, search = "",
} = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:  String(page),
          limit: String(limit),
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        });

        // Charge aussi 200 entretiens sans filtre pour le doughnut + barData
        const allParams = new URLSearchParams({ page: "1", limit: "200" });

        const [allRes, statsRes, upcomingRes, allForChartsRes] = await Promise.all([
          apiFetch(`/api/interviews/admin/all?${params}`),
          apiFetch("/api/interviews/admin/stats"),
          apiFetch("/api/interviews/upcoming"),
          apiFetch(`/api/interviews/admin/all?${allParams}`),
        ]);

        if (cancelled) return;

        const s = statsRes?.data || {};
        setData({
          interviews:    allRes?.interviews         || [],
          total:         allRes?.total              || 0,
          totalPages:    allRes?.totalPages         || 1,
          page:          allRes?.page               || 1,
          allInterviews: allForChartsRes?.interviews || [],  // pour doughnut + barData
          stats: {
            total:                        s.TOTAL                          || 0,
            confirmed:                    s.CONFIRMED                      || 0,
            pendingConfirmation:          s.PENDING_CONFIRMATION           || 0,
            pendingCandidateConfirmation: s.PENDING_CANDIDATE_CONFIRMATION || 0,
            candidateReschedule:          s.CANDIDATE_REQUESTED_RESCHEDULE || 0,
            pendingAdminApproval:         s.PENDING_ADMIN_APPROVAL         || 0,
            cancelled:                    s.CANCELLED                      || 0,
          },
          upcoming: (upcomingRes?.data || []).slice(0, 5),
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, limit, status, search]);

  return { data, loading, error };
}