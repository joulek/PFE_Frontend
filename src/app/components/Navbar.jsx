"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { logout } from "../services/auth.api";
import { Moon, Sun, Bell, Check, CheckCheck, Briefcase, FileText, X, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import api from "../services/api";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/Notification.api";

// ✅ Icône selon le type de notification
function NotificationIcon({ type }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";

  switch (type) {
    case "NEW_JOB_PENDING":
      return (
        <span className={`${base} bg-amber-100 dark:bg-amber-900/40`}>
          <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </span>
      );
    case "NEW_CANDIDATURE":
      return (
        <span className={`${base} bg-blue-100 dark:bg-blue-900/40`}>
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </span>
      );
    case "JOB_CONFIRMED":
      return (
        <span className={`${base} bg-green-100 dark:bg-green-900/40`}>
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </span>
      );
    case "JOB_REJECTED":
      return (
        <span className={`${base} bg-red-100 dark:bg-red-900/40`}>
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </span>
      );
    case "INTERVIEW_SCHEDULED":
      return (
        <span className={`${base} bg-blue-100 dark:bg-blue-900/40`}>
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </span>
      );
    case "INTERVIEW_RESPONSABLE_CONFIRMED":
    case "INTERVIEW_CANDIDATE_CONFIRMED":
      return (
        <span className={`${base} bg-green-100 dark:bg-green-900/40`}>
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </span>
      );
    case "INTERVIEW_RESPONSABLE_MODIFIED":
    case "INTERVIEW_CANDIDATE_RESCHEDULE":
      return (
        <span className={`${base} bg-orange-100 dark:bg-orange-900/40`}>
          <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </span>
      );
    case "INTERVIEW_ADMIN_APPROVED_MODIF":
      return (
        <span className={`${base} bg-emerald-100 dark:bg-emerald-900/40`}>
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </span>
      );
    case "INTERVIEW_ADMIN_REJECTED_MODIF":
      return (
        <span className={`${base} bg-red-100 dark:bg-red-900/40`}>
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        </span>
      );
    default:
      return (
        <span className={`${base} bg-gray-100 dark:bg-gray-700`}>
          <Bell className="w-4 h-4 text-gray-500" />
        </span>
      );
  }
}

// ✅ Temps relatif
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [openMobile, setOpenMobile] = useState(false);
  const [openCandidatures, setOpenCandidatures] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);

  // ✅ Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);
  const notifMobileRef = useRef(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      else setUser(null);
    };

    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("user-updated", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-updated", loadUser);
    };
  }, []);

  useEffect(() => {
    setOpenMobile(false);
    setOpenCandidatures(false);
    setOpenAdmin(false);
    setOpenNotif(false);
  }, [pathname]);

  // ✅ Fetch unread count toutes les 30s
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ✅ Charger les notifications quand on ouvre le dropdown
  const handleOpenNotif = async () => {
    const willOpen = !openNotif;
    setOpenNotif(willOpen);
    setOpenCandidatures(false);
    setOpenAdmin(false);

    if (willOpen) {
      setLoadingNotif(true);
      try {
        const res = await getNotifications();
        setNotifications(res.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotif(false);
      }
    }
  };

  // ✅ Marquer une notification comme lue et naviguer
  const handleNotifClick = async (notif) => {
    // Fermer le dropdown immédiatement
    setOpenNotif(false);

    // Marquer comme lu en arrière-plan
    if (!notif.read) {
      try {
        await markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }

    // Naviguer vers le lien
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // ✅ Tout marquer comme lu
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // ✅ Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = notifRef.current && notifRef.current.contains(e.target);
      const inMobile = notifMobileRef.current && notifMobileRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => pathname === path;
  const isAdmin = user?.role === "ADMIN";

  const isInCandidatures =
    pathname.startsWith("/recruiter/candidatures") ||
    pathname.startsWith("/recruiter/CandidatureAnalysis");

  const isInAdmin =
    pathname.startsWith("/recruiter/roles") ||
    pathname.startsWith("/recruiter/ResponsableMetier");

  async function handleLogout() {
    try {
      await logout();
    } catch {}
    finally {
      document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      delete api.defaults.headers.common.Authorization;

      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      router.replace("/login");
      router.refresh();
    }
  }

  // Classes communes
  const linkBase = "px-6 py-2 rounded-full font-semibold transition";
  const activeLink = "bg-[#6CB33F] text-white shadow";
  const inactiveLink =
    "text-gray-600 dark:text-gray-300 hover:text-[#4E8F2F] dark:hover:text-[#86efac]";

  const dropdownBase =
    "absolute left-0 mt-2 w-64 rounded-xl shadow-lg border transition-colors";
  const dropdownLight = "bg-white border-gray-200";
  const dropdownDark = "dark:bg-gray-800 dark:border-gray-700";

  const dropdownItemBase = "block px-4 py-3 transition";
  const dropdownActive = "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold";
  const dropdownHover = "hover:bg-gray-50 dark:hover:bg-gray-700";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/85 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/optylab_logo.png"
              alt="Optylab"
              width={180}
              height={60}
              priority
              className="h-auto w-[140px] sm:w-[180px] dark:hidden"
            />
            <Image
              src="/images/logo_dark.png"
              alt="Optylab"
              width={180}
              height={60}
              priority
              className="h-auto w-[140px] sm:w-[180px] hidden dark:block"
            />
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center bg-[#F4F7F5] dark:bg-gray-800/60 rounded-full p-1 gap-1 transition-colors duration-200">
            {!isAdmin && (
              <>
                <Link
                  href="/jobs"
                  className={`${linkBase} ${isActive("/jobs") ? activeLink : inactiveLink}`}
                >
                  Offres d&apos;emploi
                </Link>

                {user && (
                  <>
                    <Link
                      href="/ResponsableMetier/candidatures"
                      className={`${linkBase} ${isActive("/ResponsableMetier/candidatures") ? activeLink : inactiveLink}`}
                    >
                      Mes candidatures
                    </Link>

                    <Link
                      href="/ResponsableMetier/job"
                      className={`${linkBase} ${isActive("/ResponsableMetier/job") ? activeLink : inactiveLink}`}
                    >
                      Offres d&apos;emploi
                    </Link>
                  </>
                )}
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`${linkBase} ${isActive("/recruiter/dashboard") ? activeLink : inactiveLink}`}
                >
                  Tableau de bord
                </Link>

                <Link
                  href="/recruiter/jobs"
                  className={`${linkBase} ${isActive("/recruiter/jobs") ? activeLink : inactiveLink}`}
                >
                  Gestion offres
                </Link>

                {/* CANDIDATURES DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setOpenCandidatures((v) => !v);
                      setOpenAdmin(false);
                      setOpenNotif(false);
                    }}
                    className={`${linkBase} ${isInCandidatures ? activeLink : inactiveLink}`}
                  >
                    Candidatures ▾
                  </button>

                  {openCandidatures && (
                    <div
                      className={`${dropdownBase} ${dropdownLight} ${dropdownDark}`}
                    >
                      <Link
                        href="/recruiter/candidatures"
                        className={`${dropdownItemBase} ${isActive("/recruiter/candidatures") ? dropdownActive : dropdownHover}`}
                      >
                        Liste des candidatures
                      </Link>
                      <Link
                        href="/recruiter/CandidatureAnalysis"
                        className={`${dropdownItemBase} ${isActive("/recruiter/CandidatureAnalysis") ? dropdownActive : dropdownHover}`}
                      >
                        Analyse des candidatures
                      </Link>
                    </div>
                  )}
                </div>

                {/* ADMIN DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setOpenAdmin((v) => !v);
                      setOpenCandidatures(false);
                      setOpenNotif(false);
                    }}
                    className={`${linkBase} ${isInAdmin ? activeLink : inactiveLink}`}
                  >
                    Administration ▾
                  </button>

                  {openAdmin && (
                    <div
                      className={`${dropdownBase} ${dropdownLight} ${dropdownDark}`}
                    >
                      <Link
                        href="/recruiter/roles"
                        className={`${dropdownItemBase} ${isActive("/recruiter/roles") ? dropdownActive : dropdownHover}`}
                      >
                        Gestion des rôles
                      </Link>
                      <Link
                        href="/recruiter/ResponsableMetier"
                        className={`${dropdownItemBase} ${isActive("/recruiter/ResponsableMetier") ? dropdownActive : dropdownHover}`}
                      >
                        Gestion des utilisateurs
                      </Link>
                      <Link
                        href="/recruiter/fiche-renseignement"
                        className={`${dropdownItemBase} ${isActive("/recruiter/fiche-renseignement") ? dropdownActive : dropdownHover}`}
                      >
                        Fiche de Renseignement
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT SIDE (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Changer de thème"
              title={
                theme === "dark"
                  ? "Passer en mode clair"
                  : "Passer en mode sombre"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>

            {/* ✅ NOTIFICATION BELL */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenNotif}
                  className="relative p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />

                  {/* Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1 shadow-sm animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN */}
                {openNotif && (
                  <div className="absolute right-0 mt-2 w-96 max-h-[480px] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-[#6CB33F] hover:text-[#4E8F2F] font-semibold transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    {/* Liste */}
                    <div className="overflow-y-auto max-h-[380px] divide-y divide-gray-50 dark:divide-gray-700/50">
                      {loadingNotif ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4">
                          <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Aucune notification
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                              !notif.read
                                ? "bg-[#6CB33F]/5 dark:bg-[#6CB33F]/10"
                                : ""
                            }`}
                          >
                            <NotificationIcon type={notif.type} />

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-snug ${
                                  !notif.read
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>

                            {/* Point non lu */}
                            {!notif.read && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#6CB33F] flex-shrink-0 mt-1.5" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user ? (
              <Link
                href="/login"
                className="font-semibold text-[#6CB33F] hover:underline"
              >
                Espace recruteur
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors"
              >
                Déconnexion
              </button>
            )}
          </div>

          {/* MOBILE HAMBURGER */}
          <div className="md:hidden flex items-center gap-2">
            {/* ✅ NOTIFICATION BELL MOBILE */}
            {user && (
              <div className="relative" ref={notifMobileRef}>
                <button
                  onClick={handleOpenNotif}
                  className="relative p-2 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* MOBILE NOTIFICATION DROPDOWN */}
                {openNotif && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm max-h-[400px] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#6CB33F] font-semibold"
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-[340px] divide-y divide-gray-50 dark:divide-gray-700/50">
                      {loadingNotif ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-sm text-gray-400">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                              !notif.read ? "bg-[#6CB33F]/5" : ""
                            }`}
                          >
                            <NotificationIcon type={notif.type} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!notif.read ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-[#6CB33F] flex-shrink-0 mt-1.5" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setOpenMobile((v) => !v)}
              className="p-2 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {openMobile && (
          <div className="md:hidden pb-5 pt-2">
            <div className="rounded-2xl bg-white/95 dark:bg-gray-900/85 shadow-xl border border-gray-200/70 dark:border-gray-700/60 p-4 space-y-2 backdrop-blur-sm transition-colors duration-200">
              {!isAdmin && (
                <>
                  <Link
                    href="/jobs"
                    className={`block px-5 py-3.5 rounded-xl font-medium transition ${isActive("/jobs") ? "bg-[#6CB33F] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"}`}
                  >
                    Offres d&apos;emploi
                  </Link>

                  {user && (
                    <>
                      <Link
                        href="/ResponsableMetier/candidatures"
                        className={`block px-5 py-3.5 rounded-xl font-medium transition ${isActive("/ResponsableMetier/candidatures") ? "bg-[#6CB33F] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"}`}
                      >
                        Mes candidatures
                      </Link>
                      <Link
                        href="/ResponsableMetier/job"
                        className={`block px-5 py-3.5 rounded-xl font-medium transition ${isActive("/ResponsableMetier/job") ? "bg-[#6CB33F] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"}`}
                      >
                        Offres d&apos;emploi
                      </Link>
                    </>
                  )}
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/recruiter/dashboard"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href="/recruiter/jobs"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Gestion offres
                  </Link>
                  <Link
                    href="/recruiter/candidatures"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Liste des candidatures
                  </Link>
                  <Link
                    href="/recruiter/CandidatureAnalysis"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Analyse des candidatures
                  </Link>
                  <Link
                    href="/recruiter/roles"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Gestion des rôles
                  </Link>
                  <Link
                    href="/recruiter/ResponsableMetier"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Gestion des utilisateurs
                  </Link>
                  <Link
                    href="/recruiter/fiche-renseignement"
                    className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Fiche de Renseignement
                  </Link>
                </>
              )}

              <div className="pt-3 mt-2 border-t border-gray-200/70 dark:border-gray-700/60">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-5 w-5 text-amber-400" />
                      <span>Mode clair</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5 text-gray-700" />
                      <span>Mode sombre</span>
                    </>
                  )}
                </button>

                {!user ? (
                  <Link
                    href="/login"
                    className="block px-5 py-3.5 rounded-xl font-semibold text-[#6CB33F] hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Espace recruteur
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}