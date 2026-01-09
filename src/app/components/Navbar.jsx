"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar({ onLogout }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isActive = (path) => pathname === path;

  // ✅ UN SEUL RÔLE
  const isRecruiter = user?.role === "RECRUITER";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/">
            <Image
              src="/images/optylab.png"
              alt="Optylab"
              width={180}
              height={60}
              priority
            />
          </Link>

          {/* CENTER */}
          <div className="flex items-center bg-[#F4F7F5] rounded-full p-1 gap-1">

            {/* 👤 VISITEUR / CANDIDAT */}
            {!isRecruiter && (
              <Link
                href="/jobs"
                className={`px-6 py-2 rounded-full text-base font-semibold transition
                  ${
                    isActive("/jobs")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"
                  }`}
              >
                Offres d’emploi
              </Link>
            )}

            {/* 🧑‍💼 RECRUTEUR */}
            {isRecruiter && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`px-6 py-2 rounded-full text-base font-semibold transition
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
                  className={`px-6 py-2 rounded-full text-base font-semibold transition
                    ${
                      isActive("/recruiter/jobs")
                        ? "bg-[#6CB33F] text-white shadow"
                        : "text-gray-600 hover:text-[#4E8F2F]"
                    }`}
                >
                  Gestion offres
                </Link>
              </>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            {!user ? (
              <Link
                href="/login"
                className="text-base font-semibold text-[#6CB33F] hover:underline"
              >
                Espace recruteur
              </Link>
            ) : (
              <button
                onClick={onLogout}
                className="text-base font-semibold text-gray-500 hover:text-red-600 transition"
              >
                Déconnexion
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
