"use client";

import { logout } from "../../services/auth.api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecruiterDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout backend error (ignored)");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return (
    // 🌿 BACKGROUND GLOBAL
    <div className="min-h-screen bg-green-50">
      {/* 📦 CONTAINER */}
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-3xl shadow-xl p-14 max-w-3xl w-full text-center">

          <h1 className="text-[36px] font-semibold text-gray-800 mb-4">
            Bienvenue
          </h1>

          <p className="text-[18px] text-gray-600">
            Espace recruteur Optylab
          </p>

          <p className="mt-3 text-[15px] text-gray-500">
            Vous êtes connecté à la plateforme RH intelligente.
          </p>

        </div>
      </div>
    </div>
  );
}
