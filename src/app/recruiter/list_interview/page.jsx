"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
  RefreshCcw,
  Plus,
  ChevronDown,
  Star,
  FileText,
  X,
  ChevronRight,
  Phone,
  Users,
  Cpu,
  ArrowLeft,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
 *  MODAL — Planifier entretien DGA
 *  Intégré directement dans la colonne "Éval. DGA"
 * ══════════════════════════════════════════════════════════════ */
// ── Mini Calendar Picker (standalone, no deps) ──────────────────────────────
function MiniCalendarPicker({ selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? new Date(selectedDate).getFullYear() : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? new Date(selectedDate).getMonth() : today.getMonth(),
  );

  const MONTHS_FR = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday-based: getDay() returns 0=Sun,1=Mon...6=Sat → convert to 0=Mon..6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selStr = selectedDate || "";
  const todayStr2 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-[#6CB33F]">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-white font-bold text-sm">
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {DAYS_FR.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 p-2 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr2;
          const isSelected = dateStr === selStr;
          const isPast = new Date(dateStr) < new Date(todayStr2);

          return (
            <button
              key={dateStr}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
              className={`
                w-full aspect-square rounded-xl text-xs font-semibold transition-all
                ${
                  isSelected
                    ? "bg-[#6CB33F] text-white shadow-sm"
                    : isToday
                      ? "bg-[#E9F5E3] dark:bg-emerald-900/30 text-[#4E8F2F] dark:text-emerald-400 ring-1 ring-[#6CB33F]/40"
                      : isPast
                        ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                        : "text-gray-700 dark:text-gray-300 hover:bg-[#F1FAF4] dark:hover:bg-emerald-950/20 hover:text-[#4E8F2F]"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DgaScheduleModal({ interview, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [dgaUsers, setDgaUsers] = useState([]);
  const [dgaUsersLoading, setDgaUsersLoading] = useState(false);
  const [selectedDgaId, setSelectedDgaId] = useState("");

  const hasDga = !!interview?.dgaInterview;

  const [form, setForm] = useState({
    dgaDate: new Date().toISOString().split("T")[0],
    dgaTime: "10:00",
    dgaEmail: "",
    dgaName: "",
    location: "",
    notes: "",
  });

  const setF =
    (field) =>
    (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const loadDgaUsers = async () => {
    setDgaUsersLoading(true);
    try {
      const token =
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("token")) ||
        (typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("token")) ||
        "";

      const res = await fetch(`${API_BASE}/users?role=DGA`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.warn(
          `[DGA] GET /users?role=DGA → ${res.status}, passage en saisie manuelle`,
        );
        setDgaUsers([]);
        return;
      }

      const data = await res.json();
      const raw = data.users || data.data || data || [];
      const list = Array.isArray(raw) ? raw : [];

      const dgas = list.filter((u) =>
        String(u.role || "").toUpperCase().includes("DGA"),
      );

      setDgaUsers(dgas);
    } catch (err) {
      console.warn("[DGA] Erreur chargement users DGA:", err.message);
      setDgaUsers([]);
    } finally {
      setDgaUsersLoading(false);
    }
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setError("");
    setSuccess(false);
    setSelectedDgaId("");

    if (interview?.dgaInterview) {
      const dga = interview.dgaInterview;
      setForm({
        dgaDate: dga.date
          ? new Date(dga.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dgaTime: dga.time || "10:00",
        dgaEmail: dga.dgaEmail || "",
        dgaName: dga.dgaName || "",
        location: dga.location || "",
        notes: dga.notes || "",
      });
    } else {
      setForm({
        dgaDate: new Date().toISOString().split("T")[0],
        dgaTime: "10:00",
        dgaEmail: "",
        dgaName: "",
        location: "",
        notes: "",
      });
    }

    setShowCalendar(false);
    setOpen(true);
    loadDgaUsers();
  };

  const handleSelectDga = (e) => {
    const id = e.target.value;
    setSelectedDgaId(id);

    if (!id) {
      setForm((prev) => ({ ...prev, dgaEmail: "", dgaName: "" }));
      return;
    }

    const user = dgaUsers.find((u) => String(u._id) === id);
    if (user) {
      const fullName =
        [user.prenom, user.nom].filter(Boolean).join(" ") ||
        user.name ||
        user.email ||
        "";

      setForm((prev) => ({
        ...prev,
        dgaEmail: user.email || "",
        dgaName: fullName,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.stopPropagation();
    setError("");

    if (!form.dgaDate || !form.dgaTime) {
      setError("La date et l'heure sont obligatoires.");
      return;
    }

    if (!form.dgaEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.dgaEmail)) {
      setError("Veuillez sélectionner un DGA ou saisir un email valide.");
      return;
    }

    setLoading(true);
    try {
      const token =
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("token")) ||
        (typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("token")) ||
        "";

      const res = await fetch(
        `${API_BASE}/api/interviews/${interview._id}/schedule-dga`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Erreur.");

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        onSuccess?.();
      }, 1800);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCalendar = (e) => {
    e.stopPropagation();
    const params = new URLSearchParams({
      type: "entretien_dga",
      candidateName: interview?.candidateName || "",
      candidateEmail: interview?.candidateEmail || "",
      jobTitle: interview?.jobTitle || "",
      interviewId: String(interview?._id || ""),
    });
    window.location.href = `/recruiter/calendar?${params.toString()}`;
  };

  return (
    <>
      {hasDga ? (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Planifié · Modifier
        </button>
      ) : (
        <button
          onClick={handleOpenCalendar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-[#6CB33F] hover:text-[#4E8F2F] hover:bg-[#F1FAF4] dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-all whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5" />
          Planifier DGA
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (!loading) setOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          <div
            className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#6CB33F] to-[#4E8F2F] px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {hasDga
                    ? "Modifier l'entretien DGA"
                    : "Planifier l'entretien DGA"}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1 truncate">
                  {interview?.candidateName} · {interview?.jobTitle || "Poste"}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!loading) setOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F1FAF4] dark:bg-emerald-950/20 border-b border-gray-100 dark:border-gray-700 px-5 sm:px-6 py-3 flex items-center gap-2 text-xs sm:text-sm text-[#388E3C] dark:text-emerald-400 font-medium">
              <FileText className="w-4 h-4 flex-shrink-0" />
              Un email informatif sera envoyé automatiquement au candidat et au
              DGA.
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
              {(success || error) && (
                <div className="mb-5 space-y-3">
                  {success && (
                    <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl px-4 py-3 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      Entretien DGA planifié ! Emails envoyés ✅
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 rounded-2xl px-4 py-3 text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sélectionner un DGA{" "}
                      <span className="text-red-400">*</span>
                    </label>

                    {dgaUsersLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-400">
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-[#6CB33F] rounded-full animate-spin flex-shrink-0" />
                        Chargement des DGA…
                      </div>
                    ) : dgaUsers.length > 0 ? (
                      <select
                        value={selectedDgaId}
                        onChange={handleSelectDga}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors cursor-pointer"
                      >
                        <option value="">— Choisir un DGA —</option>
                        {dgaUsers.map((u) => {
                          const fullName =
                            [u.prenom, u.nom].filter(Boolean).join(" ") ||
                            u.name ||
                            u.email;
                          return (
                            <option key={u._id} value={String(u._id)}>
                              {fullName} ({u.email})
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs italic">
                        Aucun DGA trouvé en base — saisissez manuellement
                        ci-dessous.
                      </div>
                    )}

                    {selectedDgaId && form.dgaEmail && (
                      <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F1FAF4] dark:bg-emerald-950/20 border border-[#d7ebcf] dark:border-emerald-800">
                        <div className="w-8 h-8 rounded-full bg-[#6CB33F] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(form.dgaName || form.dgaEmail)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {form.dgaName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {form.dgaEmail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!selectedDgaId && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ou saisir email manuellement
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.3fr] gap-2">
                        <input
                          type="text"
                          placeholder="Nom"
                          value={form.dgaName}
                          onChange={setF("dgaName")}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                        />
                        <input
                          type="email"
                          placeholder="email@dga.com"
                          value={form.dgaEmail}
                          onChange={setF("dgaEmail")}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lieu / Salle{" "}
                      <span className="text-gray-300 dark:text-gray-600">
                        (optionnel)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Salle Direction, 3ème étage"
                      value={form.location}
                      onChange={setF("location")}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notes{" "}
                      <span className="text-gray-300 dark:text-gray-600">
                        (optionnel)
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Ex : Merci d'apporter vos diplômes…"
                      value={form.notes}
                      onChange={setF("notes")}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date <span className="text-red-400">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowCalendar((v) => !v)}
                      className="w-full flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-left outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors hover:border-[#6CB33F]/50"
                    >
                      <Calendar className="w-4 h-4 text-[#6CB33F] flex-shrink-0" />
                      <span
                        className={
                          form.dgaDate
                            ? "text-gray-800 dark:text-gray-200 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {form.dgaDate
                          ? new Date(
                              form.dgaDate + "T12:00:00",
                            ).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Choisir une date…"}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showCalendar ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {showCalendar && (
                      <div className="mt-1">
                        <MiniCalendarPicker
                          selectedDate={form.dgaDate}
                          onSelect={(dateStr) => {
                            setForm((prev) => ({ ...prev, dgaDate: dateStr }));
                            setShowCalendar(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Heure <span className="text-red-400">*</span>
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {[
                        "08:00",
                        "08:30",
                        "09:00",
                        "09:30",
                        "10:00",
                        "10:30",
                        "11:00",
                        "11:30",
                        "14:00",
                        "14:30",
                        "15:00",
                        "15:30",
                        "16:00",
                        "16:30",
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, dgaTime: t }))
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            form.dgaTime === t
                              ? "bg-[#6CB33F] border-[#6CB33F] text-white shadow-sm"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#6CB33F]/50 hover:text-[#4E8F2F] hover:bg-[#F1FAF4] dark:hover:bg-emerald-950/20"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <input
                      type="time"
                      value={form.dgaTime}
                      onChange={setF("dgaTime")}
                      className="mt-2 w-full sm:w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!loading) setOpen(false);
                }}
                disabled={loading}
                className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || success}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-sm transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Envoi…
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Planifié !
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    {hasDga ? "Mettre à jour" : "Planifier & Notifier"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("token")) ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

const STATUS_CONFIG = {
  PENDING_CONFIRMATION: {
    label: "Attente ResponsableMétier",
    short: "Attente Resp.",
    color:
      "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
  },
  PENDING_CANDIDATE_CONFIRMATION: {
    label: "Attente candidat",
    short: "Attente candidat",
    color:
      "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/30",
    dot: "bg-sky-500",
  },
  CONFIRMED: {
    label: "Confirmé",
    short: "Confirmé",
    color:
      "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  CANDIDATE_REQUESTED_RESCHEDULE: {
    label: "Report demandé",
    short: "Report",
    color:
      "text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30",
    dot: "bg-orange-500",
  },
  PENDING_ADMIN_APPROVAL: {
    label: "Attente admin",
    short: "Attente admin",
    color:
      "text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30",
    dot: "bg-violet-500",
  },
  MODIFIED: {
    label: "Modifié",
    short: "Modifié",
    color:
      "text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30",
    dot: "bg-indigo-500",
  },
  CANCELLED: {
    label: "Annulé",
    short: "Annulé",
    color:
      "text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
  },
};

const TYPE_CONFIG = {
  RH: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
  rh: {
    label: "Entretien RH",
    cls: "text-[#4E8F2F] dark:text-emerald-400 bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600",
  },
  rh_technique: {
    label: "RH + Tech",
    cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700",
  },
  RH_TECHNIQUE: {
    label: "RH + Tech",
    cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700",
  },
  rh_tech: {
    label: "RH + Tech",
    cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700",
  },
  RH_TECH: {
    label: "RH + Tech",
    cls: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700",
  },
  TECHNIQUE: {
    label: "Technique",
    cls: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-700",
  },
  technique: {
    label: "Technique",
    cls: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-700",
  },
  DGA: {
    label: "DGA",
    cls: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-700",
  },
  dga: {
    label: "DGA",
    cls: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-700",
  },
  telephonique: {
    label: "Téléphonique",
    cls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-700",
  },
  TELEPHONIQUE: {
    label: "Téléphonique",
    cls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-700",
  },
  tel: {
    label: "Téléphonique",
    cls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-700",
  },
  TEL: {
    label: "Téléphonique",
    cls: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-700",
  },
};

function isRHPlusTechInterviewFE(type) {
  if (!type) return false;
  const n = String(type).toLowerCase().trim();
  return n.includes("rh") && (n.includes("tech") || n.includes("technique"));
}

function resolveTypeConfig(interviewType) {
  if (!interviewType) return TYPE_CONFIG.RH;
  if (TYPE_CONFIG[interviewType]) return TYPE_CONFIG[interviewType];
  if (TYPE_CONFIG[interviewType.toUpperCase()])
    return TYPE_CONFIG[interviewType.toUpperCase()];
  if (TYPE_CONFIG[interviewType.toLowerCase()])
    return TYPE_CONFIG[interviewType.toLowerCase()];
  return {
    label: interviewType,
    cls: "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
  };
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  const p = (name || "").split(" ").filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0] || "?")[0].toUpperCase();
}

function getDGANote(interview) {
  const notes = interview.entretienNotesDGA || [];
  if (!notes.length) return null;

  return [...notes].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )[0];
}

function getStatusCount(stats, key) {
  if (!stats) return 0;
  if (key === "ALL") return stats.TOTAL ?? 0;
  return stats[key] ?? 0;
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
      {getInitials(name)}
    </div>
  );
}

function Badge({ label, className = "", dotClass = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${className}`}
    >
      {dotClass ? <span className={`w-2 h-2 rounded-full ${dotClass}`} /> : null}
      {label}
    </span>
  );
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-[#E9F5E3] dark:bg-gray-700 border-[#d7ebcf] dark:border-gray-600 text-[#4E8F2F] dark:text-emerald-400 transition-colors">
      <Star className="w-3.5 h-3.5 fill-current" />
      {score}/5
    </span>
  );
}

function DetailCard({ label, value, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 transition-colors">
      <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      {children ? (
        children
      ) : (
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
          {value || "—"}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
 *  MODAL — Planifier un entretien
 * ══════════════════════════════════════════════════════════════ */
function PlanifierModal({ open, onClose, onCreated }) {
  const router = useRouter();
  const [step, setStep] = useState("type");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [candidatureId, setCandidatureId] = useState("");
  const [jobOfferId, setJobOfferId] = useState("");

  useEffect(() => {
    if (open) {
      setStep("type");
      setNote("");
      setSaving(false);
      setDone(false);
      setCandidatureId("");
      setJobOfferId("");
    }
  }, [open]);

  if (!open) return null;

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isPhoneValid = note.trim() && candidatureId.trim() && jobOfferId.trim();

  async function handleValider() {
    if (!isPhoneValid) return;
    setSaving(true);
    try {
      await apiFetch("/api/interviews/schedule", {
        method: "POST",
        body: JSON.stringify({
          candidatureId: candidatureId.trim(),
          jobOfferId: jobOfferId.trim(),
          proposedDate: new Date().toISOString(),
          proposedTime: new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          interviewType: "telephonique",
          notes: note.trim(),
        }),
      });
      setDone(true);
      if (onCreated) onCreated();
    } catch (err) {
      alert("Erreur : " + (err.message || "Impossible de créer l'entretien"));
    } finally {
      setSaving(false);
    }
  }

  const TYPES = [
    {
      key: "telephonique",
      label: "Entretien Téléphonique",
      sub: "Note et suivi après appel",
      icon: <Phone className="w-5 h-5 text-white" />,
      action: () => setStep("tel"),
    },
    {
      key: "rh",
      label: "Entretien RH",
      sub: "Planifier + email candidat",
      icon: <Users className="w-5 h-5 text-white" />,
      action: () => {
        onClose();
        router.push("/recruiter/schedule_interview?type=rh");
      },
    },
    {
      key: "rh_technique",
      label: "Entretien RH + Technique",
      sub: "Créneaux libres communs",
      icon: <Cpu className="w-5 h-5 text-white" />,
      action: () => {
        onClose();
        router.push("/recruiter/schedule_interview?type=rh_technique");
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-[#f8fef5] dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-1">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Planifier un entretien
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          {step === "type" && (
            <div className="flex flex-col gap-3">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={t.action}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#6CB33F] hover:shadow-sm transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#6CB33F] flex items-center justify-center flex-shrink-0 shadow-sm">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      {t.label}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t.sub}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#6CB33F] flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === "tel" && !done && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setStep("type")}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-sky-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-[#6CB33F] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Entretien Téléphonique
                  </div>
                  <div className="text-xs text-gray-400">{today}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  ID Candidature <span className="text-red-400">*</span>
                </label>
                <input
                  value={candidatureId}
                  onChange={(e) => setCandidatureId(e.target.value)}
                  placeholder="Ex: 664f1a2b3c4d5e6f7a8b9c0d"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  ID Offre d'emploi <span className="text-red-400">*</span>
                </label>
                <input
                  value={jobOfferId}
                  onChange={(e) => setJobOfferId(e.target.value)}
                  placeholder="Ex: 664f1a2b3c4d5e6f7a8b9c0e"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  Note après l'appel <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Ajouter une note après l'entretien téléphonique..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6CB33F]/20 focus:border-[#6CB33F] transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleValider}
                disabled={saving || !isPhoneValid}
                className="w-full py-3 rounded-2xl bg-[#6CB33F] hover:bg-[#4E8F2F] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Valider l'entretien téléphonique
                  </>
                )}
              </button>
            </div>
          )}

          {step === "tel" && done && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-gray-900 dark:text-white text-lg">
                  Entretien créé !
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  L'entretien téléphonique est enregistré avec le statut{" "}
                  <strong>Confirmé</strong>.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white font-semibold text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CancelInterviewModal({
  open,
  onClose,
  onConfirm,
  reason,
  setReason,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Annuler l'entretien
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cette action annulera définitivement cet entretien.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Raison de l'annulation{" "}
            <span className="text-gray-400">(optionnel)</span>
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Saisir une raison..."
            disabled={loading}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none"
          />
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Annulation..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInterviewList() {
  console.log("ADMIN INTERVIEW PAGE LOADED");
  const router = useRouter();

  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [evaluationsCache, setEvaluationsCache] = useState({});

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelInterviewId, setCancelInterviewId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [planifierOpen, setPlanifierOpen] = useState(false);
  const [confirmingAdmin, setConfirmingAdmin] = useState(null);

  // ✅ Comparaison — sélection de candidats
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  function toggleSelectForCompare(iv, e) {
    e.stopPropagation();
    setSelectedForCompare((prev) => {
      const exists = prev.find((c) => String(c._id) === String(iv._id));
      if (exists) return prev.filter((c) => String(c._id) !== String(iv._id));
      if (prev.length >= 4) return prev; // max 4
      return [...prev, iv];
    });
  }

  function handleCompare() {
    if (selectedForCompare.length < 2) return;
    const ids = selectedForCompare.map((c) => String(c._id)).join(",");
    router.push(`/recruiter/compare_interviews?ids=${ids}`);
  }

  async function handleConfirmAdmin(candidatureId, e) {
    e.stopPropagation();
    if (!candidatureId || confirmingAdmin) return;
    setConfirmingAdmin(candidatureId);
    try {
      // ✅ FIX : URL complète incluant le préfixe /api/interviews
      const res = await apiFetch(
        `/api/interviews/candidatures/${candidatureId}/confirm-admin`,
        { method: "PATCH" },
      );

      if (res && res.success === false) {
        throw new Error(res.message || "Erreur serveur");
      }

      // Mise à jour optimiste immédiate dans le state local
      setInterviews((prev) =>
        prev.map((iv) =>
          String(iv.candidatureId) === String(candidatureId) ||
          String(iv._id) === String(candidatureId)
            ? {
                ...iv,
                adminConfirmed: true,
                adminConfirmedAt: new Date().toISOString(),
              }
            : iv,
        ),
      );

      // Rechargement depuis l'API pour garantir la persistance MongoDB
      await fetchInterviews();
    } catch (err) {
      alert("Erreur confirmation : " + (err.message || "Impossible"));
    } finally {
      setConfirmingAdmin(null);
    }
  }

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

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchInterviews = useCallback(async () => {
    console.log("fetchInterviews appelée");
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });

      const data = await apiFetch(
        `/api/interviews/admin/all?${params.toString()}`,
      );
      console.log("INTERVIEWS API RESPONSE :", data);
      console.log("LISTE ENTRETIENS :", data.interviews);

      const raw = data.interviews || [];
      const deduped = Array.from(
        new Map(raw.map((iv) => [String(iv._id), iv])).values(),
      );
      if (deduped.length !== raw.length) {
        console.warn(
          `[Admin] Doublons détectés et supprimés : ${raw.length - deduped.length} doublons`,
        );
      }
      setInterviews(deduped);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  const fetchEvaluationIfNeeded = useCallback(
    async (interviewId) => {
      if (evaluationsCache[interviewId] !== undefined) return;
      try {
        const data = await apiFetch(`/api/interviews/${interviewId}/evaluation`);
        setEvaluationsCache((prev) => ({
          ...prev,
          [interviewId]: data?.evaluation || null,
        }));
      } catch {
        setEvaluationsCache((prev) => ({ ...prev, [interviewId]: null }));
      }
    },
    [evaluationsCache],
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch("/api/interviews/admin/stats");
      console.log("STATS ENTRETIENS :", data);
      setStats(data.data || {});
    } catch (_) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("USEEFFECT FETCH INTERVIEWS");
    fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleApprove(interviewId, e) {
    e.stopPropagation();
    if (!confirm("Approuver la modification de cet entretien ?")) return;

    setActionLoading(interviewId + "_approve");
    try {
      await apiFetch(`/api/interviews/admin/approve/${interviewId}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(interviewId, e) {
    e.stopPropagation();
    const reason = prompt("Raison du rejet (optionnel) :");
    if (reason === null) return;

    setActionLoading(interviewId + "_reject");
    try {
      await apiFetch(`/api/interviews/admin/reject/${interviewId}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      await fetchInterviews();
      await fetchStats();
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  function openCancelModal(interviewId, e) {
    e.stopPropagation();
    setCancelInterviewId(interviewId);
    setCancelReason("");
    setCancelModalOpen(true);
  }

  function closeCancelModal() {
    if (actionLoading === cancelInterviewId + "_cancel") return;
    setCancelModalOpen(false);
    setCancelInterviewId(null);
    setCancelReason("");
  }

  async function confirmCancelInterview() {
    if (!cancelInterviewId) return;

    setActionLoading(cancelInterviewId + "_cancel");
    try {
      await apiFetch(`/api/interviews/${cancelInterviewId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: cancelReason }),
      });

      await fetchInterviews();
      await fetchStats();
      setExpandedRow(null);
      setCancelModalOpen(false);
      setCancelInterviewId(null);
      setCancelReason("");
    } catch (err) {
      alert("Erreur : " + (err.message || "Action impossible"));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <PlanifierModal
        open={planifierOpen}
        onClose={() => setPlanifierOpen(false)}
        onCreated={async () => {
          await fetchInterviews();
          await fetchStats();
        }}
      />

      <CancelInterviewModal
        open={cancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={confirmCancelInterview}
        reason={cancelReason}
        setReason={setCancelReason}
        loading={actionLoading === cancelInterviewId + "_cancel"}
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Liste des Entretiens
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Administration · Vue globale de tous les entretiens
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {selectedForCompare.length >= 2 && (
              <button
                onClick={handleCompare}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-sm"
              >
                <Users className="w-4 h-4" />
                Comparer ({selectedForCompare.length})
              </button>
            )}
            <button
              onClick={() => setPlanifierOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Planifier un entretien
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 flex items-center gap-3 mb-6 transition-colors duration-300">
          <Search className="w-5 h-5 text-[#4E8F2F] dark:text-emerald-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, poste)…"
            className="w-full outline-none text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              "ALL",
              "CONFIRMED",
              "PENDING_CONFIRMATION",
              "PENDING_ADMIN_APPROVAL",
              "CANCELLED",
            ].map((s) => {
              const cfg =
                s === "ALL" ? { short: "Tous", dot: null } : STATUS_CONFIG[s];
              const isActive = statusFilter === s;

              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#6CB33F] hover:bg-[#4E8F2F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-[#4E8F2F] dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {cfg.dot ? (
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : cfg.dot}`}
                    />
                  ) : null}
                  {cfg.short}
                </button>
              );
            })}
          </div>

          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {loading ? "…" : `${total} résultat${total > 1 ? "s" : ""}`}
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E9F5E3] dark:border-gray-700 border-t-[#4E8F2F] dark:border-t-emerald-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Chargement des entretiens...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Une erreur est survenue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                {error}
              </p>
              <button
                onClick={fetchInterviews}
                className="mt-2 px-6 py-3 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full font-semibold transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center transition-colors duration-300">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#E9F5E3] dark:bg-gray-700 flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#4E8F2F] dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Aucun entretien trouvé
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Aucun entretien ne correspond aux filtres actuels.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                  <tr>
                    <th className="px-4 py-5 w-10"></th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Candidat
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Poste
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Planification
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Éval. DGA
                    </th>
                    <th className="text-left px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Confirmer
                    </th>
                    <th className="text-right px-6 lg:px-8 py-5 font-extrabold uppercase text-xs tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(() => {
                    const grouped = [];
                    const seen = new Map();
                    const seenIds = new Set();

                    for (const iv of interviews) {
                      const idStr = String(iv._id);
                      if (seenIds.has(idStr)) continue;
                      seenIds.add(idStr);

                      const key = `${iv.candidateEmail}__${iv.jobTitle || ""}`;
                      if (seen.has(key)) {
                        seen.get(key).siblings.push(iv);
                      } else {
                        const group = { ...iv, siblings: [], _groupKey: key };
                        seen.set(key, group);
                        grouped.push(group);
                      }
                    }

                    return grouped.map((iv) => {
                      const allIvs = [iv, ...iv.siblings];
                      const ivWithDga = allIvs.find((siv) => siv.dgaInterview);
                      const allGroupNotes = Array.from(
                        new Map(
                          allIvs
                            .flatMap((siv) => siv.allEntretienNotes || [])
                            .map((n) => [String(n._id || n.createdAt), n]),
                        ).values(),
                      );

                      const sc = STATUS_CONFIG[iv.status] || {};
                      const tc = resolveTypeConfig(iv.interviewType);
                      const dgaNote = getDGANote(iv);
                      const score = dgaNote
                        ? (dgaNote.evaluationGlobale ?? dgaNote.score ?? null)
                        : null;
                      const comment = dgaNote ? dgaNote.commentaire || "" : "";
                      const hasConfirmedDate = !!iv.confirmedDate;
                      const displayDate = hasConfirmedDate
                        ? iv.confirmedDate
                        : iv.proposedDate || iv.proposedStart;
                      const displayTime = hasConfirmedDate
                        ? iv.confirmedTime
                        : iv.proposedTime ||
                          (iv.proposedStart
                            ? new Date(iv.proposedStart).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : null);
                      const isCancelled = iv.status === "CANCELLED";
                      const isExpanded = expandedRow === iv._id;
                      const hasDGA = allGroupNotes.some((n) => /dga/i.test(n.type));
                      const isActioning = actionLoading?.startsWith(iv._id);

                      const responsableItem = allIvs.find(
                        (siv) =>
                          siv.responsableName ||
                          siv.assignedUserName ||
                          siv.assignedUserEmail ||
                          siv.responsableEmail,
                      );

                      const responsableDisplay =
                        responsableItem?.responsableName ||
                        responsableItem?.assignedUserName ||
                        responsableItem?.responsableEmail ||
                        responsableItem?.assignedUserEmail ||
                        "—";
                      const responsableEmailDisplay =
                        responsableItem?.responsableEmail ||
                        responsableItem?.assignedUserEmail ||
                        "—";

                      return (
                        <React.Fragment key={iv._groupKey || String(iv._id)}>
                          <tr
                            onClick={() => {
                              const newExpanded = isExpanded ? null : iv._id;
                              setExpandedRow(newExpanded);

                              if (newExpanded) {
                                allIvs.forEach((siv) => {
                                  if (isRHPlusTechInterviewFE(siv.interviewType)) {
                                    fetchEvaluationIfNeeded(String(siv._id));
                                  }
                                });
                              }
                            }}
                            className={`hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${
                              isExpanded
                                ? "bg-green-50/30 dark:bg-gray-700/30"
                                : ""
                            } ${isCancelled ? "opacity-60" : ""}`}
                          >
                            {/* ✅ Checkbox comparaison */}
                            <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={!!selectedForCompare.find((c) => String(c._id) === String(iv._id))}
                                onChange={(e) => toggleSelectForCompare(iv, e)}
                                disabled={!selectedForCompare.find((c) => String(c._id) === String(iv._id)) && selectedForCompare.length >= 4}
                                className="w-4 h-4 rounded accent-violet-600 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                            <td className="px-6 lg:px-8 py-5">
                              <div className="flex items-center gap-3">
                                <Avatar name={iv.candidateName} />
                                <div className="min-w-0">
                                  <div className="font-extrabold text-gray-900 dark:text-white">
                                    {iv.candidateName}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {iv.candidateEmail}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 lg:px-8 py-5">
                              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                                  {iv.jobTitle || "—"}
                                </span>
                              </span>
                            </td>

                            <td className="px-6 lg:px-8 py-5">
                              <div className="flex flex-col gap-1">
                                {allIvs
                                  .filter((siv) => {
                                    const t = String(
                                      siv.interviewType || "",
                                    ).toLowerCase();
                                    return t !== "entretien_nord" && t !== "nord";
                                  })
                                  .map((siv) => {
                                    const stc = resolveTypeConfig(
                                      siv.interviewType,
                                    );
                                    return (
                                      <Badge
                                        key={siv._id}
                                        label={stc.label}
                                        className={stc.cls}
                                      />
                                    );
                                  })}
                                {hasDGA && !isCancelled && (
                                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                                    + Note DGA
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 lg:px-8 py-5">
                              <Badge
                                label={sc.short || iv.status}
                                className={sc.color}
                                dotClass={sc.dot}
                              />
                            </td>

                            <td className="px-6 lg:px-8 py-5 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                                  <span>Planifié {formatDate(iv.createdAt)}</span>
                                </div>

                                {iv.status === "CONFIRMED" &&
                                  iv.confirmedDate && (
                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span>
                                        Confirmé {formatDate(iv.confirmedDate)}
                                      </span>
                                    </div>
                                  )}

                                {iv.status ===
                                  "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span>
                                      Report :{" "}
                                      {formatDate(iv.candidateProposedDate)}{" "}
                                      {iv.candidateProposedTime}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 lg:px-8 py-5">
                              <div className="flex flex-col gap-2">
                                {hasDGA && !isCancelled ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRow(isExpanded ? null : iv._id);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    {isExpanded
                                      ? "Masquer détails"
                                      : "Voir détails"}
                                  </button>
                                ) : (
                                  <DgaScheduleModal
                                    interview={ivWithDga || iv}
                                    onSuccess={async () => {
                                      await fetchInterviews();
                                    }}
                                  />
                                )}

                                {dgaNote && (
                                  <>
                                    <ScoreBadge score={score} />
                                    {comment ? (
                                      <span
                                        className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[170px]"
                                        title={comment}
                                      >
                                        {comment}
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="px-6 lg:px-8 py-5">
                              {/* ✅ adminConfirmed persisté en DB — badge permanent */}
                              {iv.adminConfirmed === true ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Confirmé
                                  </span>
                                  {iv.adminConfirmedAt && (
                                    <span className="text-[10px] text-gray-400 pl-1">{formatDate(iv.adminConfirmedAt)}</span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) =>
                                    handleConfirmAdmin(
                                      iv.candidatureId || String(iv._id),
                                      e,
                                    )
                                  }
                                  disabled={
                                    confirmingAdmin ===
                                    (iv.candidatureId || String(iv._id))
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#6CB33F] bg-[#E9F5E3] hover:bg-[#6CB33F] hover:text-white px-3 py-1.5 text-xs font-bold text-[#4E8F2F] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                                >
                                  {confirmingAdmin ===
                                  (iv.candidatureId || String(iv._id)) ? (
                                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Confirmer
                                </button>
                              )}
                            </td>

                            <td className="px-6 lg:px-8 py-5 text-right">
                              <ChevronDown
                                className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-6 lg:px-8 pb-6 bg-green-50/20 dark:bg-gray-900/20"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
                                  <DetailCard
                                    label="Poste"
                                    value={iv.jobTitle || "—"}
                                  />

                                  <DetailCard label="Responsable">
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                                        {responsableDisplay}
                                      </div>
                                      {responsableEmailDisplay !== "—" && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                                          {responsableEmailDisplay}
                                        </div>
                                      )}
                                    </div>
                                  </DetailCard>

                                  {iv.status ===
                                    "CANDIDATE_REQUESTED_RESCHEDULE" && (
                                    <DetailCard
                                      label="Raison report"
                                      value={
                                        iv.candidateRescheduleReason ||
                                        "Non précisée"
                                      }
                                    />
                                  )}

                                  {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                    <DetailCard
                                      label="Nouvelle date proposée"
                                      value={`${formatDate(iv.responsableProposedDate)} ${iv.responsableProposedTime || ""}`}
                                    />
                                  )}

                                  {allIvs.some(
                                    (siv) =>
                                      siv.status === "CONFIRMED" ||
                                      siv.status ===
                                        "PENDING_CANDIDATE_CONFIRMATION",
                                  ) && (
                                    <DetailCard label="Évaluation">
                                      <div className="flex flex-col gap-2">
                                        {allIvs
                                          .filter(
                                            (siv) =>
                                              siv.status === "CONFIRMED" ||
                                              siv.status ===
                                                "PENDING_CANDIDATE_CONFIRMATION",
                                          )
                                          .map((siv) => {
                                            const stc = resolveTypeConfig(
                                              siv.interviewType,
                                            );
                                            const isRHT =
                                              isRHPlusTechInterviewFE(
                                                siv.interviewType,
                                              );
                                            const evalData =
                                              evaluationsCache[String(siv._id)];
                                            const hasEval =
                                              isRHT &&
                                              evalData !== undefined &&
                                              evalData !== null;
                                            const evalLoading =
                                              isRHT &&
                                              evaluationsCache[
                                                String(siv._id)
                                              ] === undefined;

                                            return (
                                              <div
                                                key={siv._id}
                                                className="flex flex-col gap-1.5"
                                              >
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(
                                                      `/recruiter/interviews/${siv._id}/evaluation`,
                                                    );
                                                  }}
                                                  className={`w-full px-4 py-2.5 rounded-full border font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                                                    hasEval
                                                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                                                      : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                                                  }`}
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  {stc.label}
                                                  {hasEval && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500" />
                                                  )}
                                                  {evalLoading && isRHT && (
                                                    <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin ml-auto" />
                                                  )}
                                                </button>

                                                {hasEval && (
                                                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs">
                                                    {evalData.evaluationGlobale !=
                                                      null && (
                                                      <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                          Score global :
                                                        </span>
                                                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                                                          {evalData.evaluationGlobale}
                                                          /5
                                                        </span>
                                                        <span className="text-amber-500">
                                                          {"★".repeat(
                                                            Math.round(
                                                              evalData.evaluationGlobale,
                                                            ),
                                                          )}
                                                          {"☆".repeat(
                                                            5 -
                                                              Math.round(
                                                                evalData.evaluationGlobale,
                                                              ),
                                                          )}
                                                        </span>
                                                      </div>
                                                    )}

                                                    {evalData.decision && (
                                                      <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-600 dark:text-gray-400">
                                                          Décision :
                                                        </span>
                                                        <span
                                                          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                                                            evalData.decision ===
                                                              "retenu" ||
                                                            evalData.decision ===
                                                              "RETENU"
                                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                              : evalData.decision ===
                                                                    "refuse" ||
                                                                  evalData.decision ===
                                                                    "REFUSE"
                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                          }`}
                                                        >
                                                          {evalData.decision}
                                                        </span>
                                                      </div>
                                                    )}

                                                    {evalData.commentaire && (
                                                      <p
                                                        className="text-gray-600 dark:text-gray-400 italic truncate"
                                                        title={evalData.commentaire}
                                                      >
                                                        "{evalData.commentaire}"
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                      </div>
                                    </DetailCard>
                                  )}

                                  {(() => {
                                    const dgaNotes = allGroupNotes.filter((n) =>
                                      /dga/i.test(n.type),
                                    );
                                    if (!dgaNotes.length) return null;

                                    return (
                                      <DetailCard label="Notes DGA">
                                        <div className="flex flex-col gap-2">
                                          {dgaNotes.map((n, i) => (
                                            <div
                                              key={n._id || i}
                                              className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5"
                                            >
                                              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                {n.note || "—"}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {n.stars > 0 && (
                                                  <span className="text-[11px] text-amber-500">
                                                    {"★".repeat(n.stars)}
                                                    {"☆".repeat(5 - n.stars)}
                                                  </span>
                                                )}
                                                {n.createdAt && (
                                                  <span className="text-[11px] text-gray-400">
                                                    {formatDate(n.createdAt)}
                                                  </span>
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-full px-2 py-0.5">
                                                  DGA
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </DetailCard>
                                    );
                                  })()}

                                  {iv.status === "PENDING_ADMIN_APPROVAL" && (
                                    <>
                                      <DetailCard label="Approbation">
                                        <button
                                          disabled={!!isActioning}
                                          onClick={(e) =>
                                            handleApprove(iv._id, e)
                                          }
                                          className="w-full px-4 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                                        >
                                          {actionLoading === iv._id + "_approve"
                                            ? "…"
                                            : "Approuver"}
                                        </button>
                                      </DetailCard>

                                      <DetailCard label="Refus">
                                        <button
                                          disabled={!!isActioning}
                                          onClick={(e) =>
                                            handleReject(iv._id, e)
                                          }
                                          className="w-full px-4 py-2.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                        >
                                          {actionLoading === iv._id + "_reject"
                                            ? "…"
                                            : "Rejeter"}
                                        </button>
                                      </DetailCard>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && totalPages > 1 && (
          <div className="mt-6 px-4 sm:px-8 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
            <p className="font-medium">
              Page {page} sur {totalPages} — Total: {total} entretien
              {total > 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors"
              >
                ← Préc.
              </button>

              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-full border font-bold transition-colors ${
                      p === page
                        ? "bg-[#6CB33F] border-[#6CB33F] text-white dark:bg-emerald-600 dark:border-emerald-600"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold disabled:opacity-50 transition-colors"
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