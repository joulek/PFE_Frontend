"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../services/auth.api";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [openMobile, setOpenMobile] = useState(false);
  const [openCandidatures, setOpenCandidatures] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    setOpenMobile(false);
    setOpenCandidatures(false);
    setOpenAdmin(false);
  }, [pathname]);

  const isActive = (path) => pathname === path;
  const isAdmin = user?.role === "ADMIN";

  const isInCandidatures =
    pathname.startsWith("/recruiter/candidatures") ||
    pathname.startsWith("/recruiter/CandidatureAnalysis");

  const isInAdmin =
    pathname.startsWith("/recruiter/roles") ||
    pathname.startsWith("/recruiter/ResponsableMetier") ;

  async function handleLogout() {
    try {
      await logout();
    } catch {
      console.warn("Logout backend error ignored");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      router.replace("/login");
    }
  }

  // Classes communes
  const linkBase = "px-6 py-2 rounded-full font-semibold transition";
  const activeLink = "bg-[#6CB33F] text-white shadow";
  const inactiveLink = "text-gray-600 dark:text-gray-300 hover:text-[#4E8F2F] dark:hover:text-[#86efac]";

  const dropdownBase = "absolute left-0 mt-2 w-64 rounded-xl shadow-lg border transition-colors";
  const dropdownLight = "bg-white border-gray-200";
  const dropdownDark = "dark:bg-gray-800 dark:border-gray-700";

  const dropdownItemBase = "block px-4 py-3 transition";
  const dropdownActive = "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold";
  const dropdownHover = "hover:bg-gray-50 dark:hover:bg-gray-700";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/85 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* LOGO — Deux versions selon le thème */}
          <Link href="/" className="flex items-center">
            {/* Version claire (texte sombre) */}
            <Image
              src="/images/optylab_logo.png"
              alt="Optylab"
              width={180}
              height={60}
              priority
              className="h-auto w-[140px] sm:w-[180px] dark:hidden"
            />

            {/* Version sombre (texte clair/blanc) */}
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
                <Link href="/jobs" className={`${linkBase} ${isActive("/jobs") ? activeLink : inactiveLink}`}>
                  Offres d'emploi
                </Link>

                {user && (
                  <Link
                    href="/ResponsableMetier/candidatures"
                    className={`${linkBase} ${isActive("/ResponsableMetier/candidatures") ? activeLink : inactiveLink}`}
                  >
                    Mes candidatures
                  </Link>
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
                    }}
                    className={`${linkBase} ${isInCandidatures ? activeLink : inactiveLink}`}
                  >
                    Candidatures ▾
                  </button>

                  {openCandidatures && (
                    <div className={`${dropdownBase} ${dropdownLight} ${dropdownDark}`}>
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
                    }}
                    className={`${linkBase} ${isInAdmin ? activeLink : inactiveLink}`}
                  >
                    Administration ▾
                  </button>

                  {openAdmin && (
                    <div className={`${dropdownBase} ${dropdownLight} ${dropdownDark}`}>
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
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Changer de thème"
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>

            {!user ? (
              <Link href="/login" className="font-semibold text-[#6CB33F] hover:underline">
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
          <button
            onClick={() => setOpenMobile((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
                    Offres d'emploi
                  </Link>

                  {user && (
                    <Link
                      href="/ResponsableMetier/candidatures"
                      className={`block px-5 py-3.5 rounded-xl font-medium transition ${isActive("/ResponsableMetier/candidatures") ? "bg-[#6CB33F] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"}`}
                    >
                      Mes candidatures
                    </Link>
                  )}
                </>
              )}

              {isAdmin && (
                <>
                  <Link href="/recruiter/dashboard" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Tableau de bord
                  </Link>
                  <Link href="/recruiter/jobs" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Gestion offres
                  </Link>
                  <Link href="/recruiter/candidatures" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Liste des candidatures
                  </Link>
                  <Link href="/recruiter/CandidatureAnalysis" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Analyse des candidatures
                  </Link>
                  <Link href="/recruiter/roles" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Gestion des rôles
                  </Link>
                  <Link href="/recruiter/ResponsableMetier" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                    Gestion des utilisateurs
                  </Link>
                  <Link href="/recruiter/fiche-renseignement" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
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