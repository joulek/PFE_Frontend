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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
            {!isRecruiter && (
              <Link
                href="/jobs"
                className={`px-6 py-2 rounded-full font-semibold transition
                  ${isActive("/jobs")
                    ? "bg-[#6CB33F] text-white shadow"
                    : "text-gray-600 hover:text-[#4E8F2F]"}
                `}
              >
                Offres d’emploi
              </Link>
            )}

            {isRecruiter && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${isActive("/recruiter/dashboard")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"}
                  `}
                >
                  Dashboard
                </Link>

                <Link
                  href="/recruiter/jobs"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${isActive("/recruiter/jobs")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"}
                  `}
                >
                  Gestion offres
                </Link>


                <Link
                  href="/recruiter/candidatures"
                  className={`px-6 py-2 rounded-full font-semibold transition
                    ${isActive("/recruiter/candidatures")
                      ? "bg-[#6CB33F] text-white shadow"
                      : "text-gray-600 hover:text-[#4E8F2F]"}
                  `}
                >
                  Candidatures
                </Link>
              </>
            )}
          </div>

          {/* RIGHT */}
          <div>
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

        </div>
      </div>
    </header>
  );
}
