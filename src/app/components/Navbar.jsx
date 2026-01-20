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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // fermer le menu mobile quand on change de page
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  const isActive = (path) => pathname === path;
  const isRecruiter = user?.role === "RECRUITER";

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout backend error (ignored)");
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

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center bg-[#F4F7F5] rounded-full p-1 gap-1">
            {!isRecruiter && (
              <Link
                href="/jobs"
                className={`px-6 py-2 rounded-full font-semibold transition
                  ${
                    isActive("/jobs")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"
                  }`}
              >
                Offres d’emploi
              </Link>
            )}

            {isRecruiter && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${
                      isActive("/recruiter/dashboard")
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Dashboard
                </Link>

                <Link
                  href="/recruiter/jobs"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${
                      isActive("/recruiter/jobs")
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Gestion offres
                </Link>

                <Link
                  href="/recruiter/candidatures"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${
                      isActive("/recruiter/candidatures")
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Candidatures
                </Link>
              </>
            )}
          </div>

          {/* RIGHT DESKTOP */}
          <div className="hidden md:block">
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

          {/* HAMBURGER (MOBILE) */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            {/* Icon hamburger / close */}
            <span className="text-2xl">
              {openMobile ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* MOBILE MENU */}
        {openMobile && (
          <div className="md:hidden pb-4">
            <div className="mt-3 rounded-2xl bg-white shadow border border-gray-200 p-3 space-y-2">
              {!isRecruiter && (
                <Link
                  href="/jobs"
                  className={`block px-4 py-3 rounded-xl font-semibold transition
                    ${
                      isActive("/jobs")
                        ? "bg-[#6CB33F] text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Offres d’emploi
                </Link>
              )}

              {isRecruiter && (
                <>
                  <Link
                    href="/recruiter/dashboard"
                    className={`block px-4 py-3 rounded-xl font-semibold transition
                      ${
                        isActive("/recruiter/dashboard")
                          ? "bg-[#6CB33F] text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/recruiter/jobs"
                    className={`block px-4 py-3 rounded-xl font-semibold transition
                      ${
                        isActive("/recruiter/jobs")
                          ? "bg-[#6CB33F] text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Gestion offres
                  </Link>

                  <Link
                    href="/recruiter/candidatures"
                    className={`block px-4 py-3 rounded-xl font-semibold transition
                      ${
                        isActive("/recruiter/candidatures")
                          ? "bg-[#6CB33F] text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Candidatures
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-gray-200">
                {!user ? (
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-xl font-semibold text-[#6CB33F] hover:bg-gray-50 transition"
                  >
                    Espace recruteur
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl font-semibold text-gray-600 hover:text-red-600 hover:bg-gray-50 transition"
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
