"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../services/auth.api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

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

  // ✅ يغلق dropdowns أوتوماتيك كي تتبدل الصفحة
  useEffect(() => {
    setOpenMobile(false);
    setOpenCandidatures(false);
    setOpenAdmin(false);
  }, [pathname]);

  const isActive = (path) => pathname === path;
  const isAdmin = user?.role === "ADMIN";

  // ✅ parent active logic
  const isInCandidatures =
    pathname.startsWith("/recruiter/candidatures") ||
    pathname.startsWith("/recruiter/CandidatureAnalysis");

  const isInAdmin =
    pathname.startsWith("/recruiter/roles") ||
    pathname.startsWith("/recruiter/users");

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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/optylab.png"
              alt="Optylab"
              width={180}
              height={60}
              priority
              className="h-auto w-[140px] sm:w-[180px]"
            />
          </Link>

          {/* ================= DESKTOP MENU ================= */}
          <div className="hidden md:flex items-center bg-[#F4F7F5] rounded-full p-1 gap-1">
            {!isAdmin && (
              <Link
                href="/jobs"
                className={`px-6 py-2 rounded-full font-semibold transition
                  ${isActive("/jobs")
                    ? "bg-[#6CB33F] text-white shadow"
                    : "text-gray-600 hover:text-[#4E8F2F]"
                  }`}
              >
                Offres d’emploi
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${isActive("/recruiter/dashboard")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Tableau de bord
                </Link>

                <Link
                  href="/recruiter/jobs"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${isActive("/recruiter/jobs")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Gestion offres
                </Link>

                {/* ===== CANDIDATURES ===== */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setOpenCandidatures((v) => !v);
                      setOpenAdmin(false);
                    }}
                    className={`px-6 py-2 rounded-full font-semibold transition
                      ${isInCandidatures
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                      }`}
                  >
                    Candidatures ▾
                  </button>

                  {openCandidatures && (
                    <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-lg border border-gray-200">
                      <Link
                        href="/recruiter/candidatures"
                        className={`block px-4 py-3 rounded-t-xl
                          ${isActive("/recruiter/candidatures")
                            ? "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        Liste des candidatures
                      </Link>

                      <Link
                        href="/recruiter/CandidatureAnalysis"
                        className={`block px-4 py-3 rounded-b-xl
                          ${isActive("/recruiter/CandidatureAnalysis")
                            ? "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        Analyse des candidatures
                      </Link>
                    </div>
                  )}
                </div>

                {/* ===== ADMIN ===== */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setOpenAdmin((v) => !v);
                      setOpenCandidatures(false);
                    }}
                    className={`px-6 py-2 rounded-full font-semibold transition
                      ${isInAdmin
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                      }`}
                  >
                    Administration ▾
                  </button>

                  {openAdmin && (
                    <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-lg border border-gray-200">
                      <Link
                        href="/recruiter/roles"
                        className={`block px-4 py-3 rounded-t-xl
                          ${isActive("/recruiter/roles")
                            ? "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        Gestion des rôles
                      </Link>

                      <Link
                        href="/recruiter/users"
                        className={`block px-4 py-3 rounded-b-xl
                          ${isActive("/recruiter/users")
                            ? "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        Gestion des utilisateurs
                      </Link>
                       <Link
                        href="/recruiter/fiche-renseignement/create"
                        className={`block px-4 py-3 rounded-b-xl
                          ${isActive("/recruiter/fiche-renseignement/create")
                            ? "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        Fiche de Renseignement
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT DESKTOP */}
          <div className="hidden md:flex items-center gap-4">
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
                className="font-semibold text-gray-500 hover:text-red-600 transition"
              >
                Déconnexion
              </button>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpenMobile((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* ================= MOBILE MENU ================= */}
        {openMobile && (
          <div className="md:hidden pb-4">
            <div className="mt-3 rounded-2xl bg-white shadow border border-gray-200 p-3 space-y-2">
              {!isAdmin && (
                <Link
                  href="/jobs"
                  className={`block px-4 py-3 rounded-xl font-semibold transition
                    ${isActive("/jobs")
                      ? "bg-[#6CB33F] text-white"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Offres d’emploi
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/recruiter/dashboard"
                    className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                  >
                    Tableau de bord
                  </Link>

                  <Link
                    href="/recruiter/jobs"
                    className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                  >
                    Gestion offres
                  </Link>

                    <Link
                      href="/recruiter/candidatures"
                      className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                    >
                      Liste des candidatures
                    </Link>
                    <Link
                      href="/recruiter/CandidatureAnalysis"
                      className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                    >
                      Analyse des candidatures
                    </Link>
                    <Link
                      href="/recruiter/roles"
                      className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                    >
                      Gestion des rôles
                    </Link>
                    <Link
                      href="/recruiter/users"
                      className="block px-4 py-3 rounded-xl hover:bg-gray-50"
                    >
                      Gestion des utilisateurs
                    </Link>
                </>
              )}

              <div className="pt-2 border-t border-gray-200">
                {!user ? (
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-xl font-semibold text-[#6CB33F] hover:bg-gray-50"
                  >
                    Espace recruteur
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl font-semibold text-gray-600 hover:text-red-600 hover:bg-gray-50"
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
