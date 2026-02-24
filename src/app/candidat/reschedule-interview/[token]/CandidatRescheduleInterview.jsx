"use client";
// app/candidat/reschedule-interview/[token]/CandidatRescheduleInterview.jsx
// Affiche les créneaux LIBRES communs du recruteur + responsable
// Le candidat choisit un créneau et soumet

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Loader2, XCircle, Calendar, Clock, Send, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function CandidatRescheduleInterview({ token }) {
  const [status,    setStatus]    = useState("loading"); // loading | slots | sending | success | error
  const [interview, setInterview] = useState(null);
  const [slots,     setSlots]     = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");
  const [days,      setDays]      = useState(14);

  // ── Charger infos + créneaux ─────────────────────────────────────────────
  async function loadData(daysCount = days) {
    setStatus("loading");
    setSelected(null);
    setErrorMsg("");
    try {
      // Infos entretien
      const [infoRes, slotsRes] = await Promise.all([
        fetch(`${API_BASE}/api/calendar/rh-tech/candidate/info/${token}`),
        fetch(`${API_BASE}/api/calendar/rh-tech/candidate/slots/${token}?days=${daysCount}`),
      ]);
      const infoData  = await infoRes.json();
      const slotsData = await slotsRes.json();

      if (!infoRes.ok) {
        setErrorMsg(infoData.message || "Lien invalide ou expiré.");
        setStatus("error");
        return;
      }
      setInterview(infoData.interview);
      setSlots(Array.isArray(slotsData.slots) ? slotsData.slots : []);
      setStatus("slots");
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  useEffect(() => { loadData(); }, [token]);

  // ── Grouper par jour ─────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  // ── Soumettre ─────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selected) return;
    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/calendar/rh-tech/candidate/propose/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedDate: selected.date, proposedTime: selected.time }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.message || "Erreur serveur.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#4E8F2F]" />
        <p className="text-sm text-gray-500">Chargement des créneaux disponibles...</p>
      </div>
    </div>
  );

  // ── Erreur ───────────────────────────────────────────────────────────────
  if (status === "error") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">Problème</h2>
        <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
        <button onClick={() => loadData()} className="px-5 py-2.5 bg-[#4E8F2F] text-white rounded-xl font-semibold text-sm">
          Réessayer
        </button>
      </div>
    </div>
  );

  // ── Succès ───────────────────────────────────────────────────────────────
  if (status === "success") return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-11 h-11 text-[#4E8F2F]" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Proposition envoyée ! 🎉</h2>
        <p className="text-sm text-gray-500 mb-4">
          Le responsable métier va confirmer votre nouveau créneau.
          Vous recevrez un email de confirmation.
        </p>
        {selected && (
          <div className="p-3 bg-[#F0FAF0] rounded-xl text-sm font-semibold text-gray-700">
            📅 {new Date(selected.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {selected.time}
          </div>
        )}
      </div>
    </div>
  );

  // ── Page principale avec créneaux ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0FAF0]">
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] rounded-3xl px-6 py-7 mb-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
              Proposer une autre date
            </p>
            <h1 className="text-xl font-extrabold text-white">{interview?.candidateName || "Bonjour"}</h1>
            {interview?.jobTitle && <p className="text-white/70 text-sm mt-0.5">{interview.jobTitle}</p>}
          </div>
        </div>

        {/* Date actuelle */}
        {interview && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-4">
            <span className="text-xl flex-shrink-0">📅</span>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                Date actuelle proposée
              </p>
              <p className="text-sm font-semibold text-amber-800">
                {interview.date} à {interview.time}
              </p>
            </div>
          </div>
        )}

        {/* Sélecteur de période */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500 font-medium">Voir sur :</span>
          {[7, 14, 21].map(d => (
            <button key={d} onClick={() => { setDays(d); loadData(d); }}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                days === d
                  ? "bg-[#4E8F2F] text-white border-[#4E8F2F]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#4E8F2F]/50"
              }`}>
              {d} jours
            </button>
          ))}
          <button onClick={() => loadData(days)}
            className="ml-auto p-2 rounded-full bg-white border border-gray-200 hover:border-[#4E8F2F]/50 transition">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Créneaux */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          {grouped.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500 mb-1">Aucun créneau disponible</p>
              <p className="text-xs text-gray-400 mb-4">
                Essayez sur une période plus longue ou contactez le recruteur.
              </p>
              <button onClick={() => { setDays(21); loadData(21); }}
                className="text-sm text-[#4E8F2F] font-semibold hover:underline">
                Voir sur 21 jours
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {grouped.map(([date, daySlots]) => {
                const dateFR = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                });
                return (
                  <div key={date} className="p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 capitalize">
                      📅 {dateFR}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((s, i) => {
                        const active = selected?.date === s.date && selected?.time === s.time;
                        return (
                          <button key={i} onClick={() => setSelected(s)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                              active
                                ? "bg-[#4E8F2F] text-white border-[#4E8F2F] shadow-md shadow-[#4E8F2F]/20"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#4E8F2F]/50 hover:bg-[#F0FAF0]"
                            }`}>
                            <Clock className={`w-3.5 h-3.5 ${active ? "text-white/80" : "text-gray-400"}`} />
                            {s.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Créneau sélectionné */}
        {selected && (
          <div className="flex items-center gap-3 p-4 bg-[#F0FAF0] border border-[#4E8F2F]/20 rounded-2xl mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#4E8F2F] flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Créneau sélectionné</p>
              <p className="text-sm font-bold text-gray-800">
                {new Date(selected.date + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })} à {selected.time}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-2xl mb-4">
          <Send className="w-4 h-4 text-[#4E8F2F] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Ces créneaux sont libres dans les agendas du <strong>recruteur</strong> et du <strong>responsable métier</strong>.
            Votre proposition sera transmise pour confirmation.
          </p>
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={!selected || status === "sending"}
          className="w-full py-4 rounded-2xl bg-[#4E8F2F] hover:bg-[#3d7524] text-white font-extrabold text-base flex items-center justify-center gap-3 disabled:opacity-40 shadow-lg shadow-[#4E8F2F]/20 transition-all"
        >
          {status === "sending" ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
          ) : (
            <><Send className="w-5 h-5" /> Proposer ce créneau</>
          )}
        </button>

      </div>
    </div>
  );
}