"use client";
// app/interviewDga/[id]/confirm/DgaConfirmInterview.jsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  LogIn,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const OPTY   = "#4E8F2F";
const OPTY_D = "#3d7524";

function capitalize(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Helper : récupère le token depuis localStorage ou sessionStorage ──
function getAuthToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

export default function DgaConfirmInterview({ id }) {
  const router = useRouter();

  // États possibles :
  //   "loading"    → chargement initial (infos DGA + vérif token)
  //   "info"       → DGA connecté → affiche infos + bouton confirmer
  //   "confirming" → confirmation en cours (spinner)
  //   "success"    → confirmation réussie
  //   "error"      → erreur API
  const [status, setStatus]       = useState("loading");
  const [dga, setDga]             = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");

  // ── 1. Chargement initial ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // Charger les infos DGA (route publique — pas de token requis)
        const res  = await fetch(`${API_BASE}/api/interviews/${id}/dga-info`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.message || "Entretien introuvable.");
          setStatus("error");
          return;
        }

        if (!data.dga) {
          setErrorMsg("Aucun entretien DGA planifié pour ce dossier.");
          setStatus("error");
          return;
        }

        setDga(data.dga);

        // ✅ Vérifier si le DGA est déjà connecté
        const token = getAuthToken();

        if (!token) {
          // ✅ Pas connecté → rediriger immédiatement vers login
          // On garde l'URL actuelle en paramètre redirect pour revenir après connexion
          const currentUrl = `/interviewDga/${id}/confirm`;
          router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
          // On garde le status "loading" pendant la redirection
          return;
        }

        // ✅ Connecté → afficher directement la page de confirmation
        setStatus("info");
      } catch {
        setErrorMsg("Impossible de contacter le serveur.");
        setStatus("error");
      }
    }

    load();
  }, [id, router]);

  // ── 2. Confirmer (DGA connecté — route protégée) ───────────────────────
  async function handleConfirm() {
    setStatus("confirming");
    try {
      const token = getAuthToken();

      // ✅ Si token expiré/manquant entre-temps → rediriger vers login
      if (!token) {
        const currentUrl = `/interviewDga/${id}/confirm`;
        router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const res  = await fetch(`${API_BASE}/api/interviews/${id}/confirm-dga`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.message || "Erreur lors de la confirmation.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  function formatDate(d) {
    if (!d) return "—";
    try {
      return capitalize(
        new Date(d).toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      );
    } catch { return String(d); }
  }

  function formatTime(t) {
    if (!t) return "—";
    const s = String(t);
    if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
    return s;
  }

  // ── Bloc infos entretien (réutilisé dans plusieurs états) ──────────────
  function DgaInfoCard() {
    if (!dga) return null;
    return (
      <div className="space-y-3 p-4 bg-[#F0FAF0] dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" style={{ color: OPTY }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Date</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{formatDate(dga.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" style={{ color: OPTY }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Heure</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{formatTime(dga.time)}</p>
          </div>
        </div>

        {dga.location && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4" style={{ color: OPTY }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Lieu</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{dga.location}</p>
            </div>
          </div>
        )}

        {dga.notes && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Briefcase className="w-4 h-4" style={{ color: OPTY }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Notes</p>
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{dga.notes}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  //  Loading / Redirection
  // =========================
  if (status === "loading")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: OPTY }} />
          <p className="text-sm text-gray-500 dark:text-slate-300">Chargement...</p>
        </div>
      </div>
    );

  // =========================
  //  Error
  // =========================
  if (status === "error")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 shadow-2xl">
          <div className="px-6 py-7 text-center bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524]">
            <div className="text-2xl font-extrabold text-white">Optylab</div>
            <div className="text-white/85 text-sm mt-1">Confirmation entretien Direction (DGA)</div>
          </div>
          <div className="p-7 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-gray-900 dark:text-white">Erreur</h2>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300 font-bold">
              {errorMsg || "Lien invalide ou expiré."}
            </p>
            <div className="mt-6 text-xs text-gray-500 dark:text-slate-400">
              Si le problème persiste, contactez votre équipe RH.
            </div>
          </div>
        </div>
      </div>
    );

  // =========================
  //  Success
  // =========================
  if (status === "success")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl bg-emerald-500/10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-emerald-500/10" />
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-11 h-11" style={{ color: OPTY }} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              Entretien confirmé !
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-300 mb-4">
              Votre confirmation a bien été enregistrée.
            </p>
            <DgaInfoCard />
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-4">
              Merci pour votre confirmation.
            </p>
          </div>
        </div>
      </div>
    );

  // =========================
  //  Info + Bouton Confirmer
  //  (DGA connecté)
  // =========================
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-white/75 text-[11px] font-bold uppercase tracking-wider mb-1">
              Entretien Direction — Confirmation DGA
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {dga?.dgaName || "Bonjour !"}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Veuillez confirmer votre disponibilité pour cet entretien.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            Un entretien Direction a été planifié. Merci de confirmer votre présence :
          </p>

          {/* Infos entretien */}
          <DgaInfoCard />

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={status === "confirming"}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg"
            style={{ background: OPTY, boxShadow: "0 12px 30px rgba(78,143,47,0.22)" }}
            onMouseEnter={(e) => { if (status !== "confirming") e.currentTarget.style.background = OPTY_D; }}
            onMouseLeave={(e) => { if (status !== "confirming") e.currentTarget.style.background = OPTY; }}
          >
            {status === "confirming" ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Confirmation en cours...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Confirmer ma présence</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}