"use client";

import Navbar from "../../components/Navbar";
import { logout } from "../../services/auth.api";

export default function RecruiterDashboard() {

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
    <div className="min-h-screen bg-[#F4F7F5]">

      {/* NAVBAR */}
      <Navbar onLogout={handleLogout} />

      {/* CONTENT */}
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
