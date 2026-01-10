"use client";

import { useState } from "react";
import Image from "next/image";
import api from "../../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/recruiter/dashboard";
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Erreur de connexion. Vérifiez vos informations."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    // 🌿 prend l'écran SANS la navbar
    <div className="h-[calc(100vh-80px)] bg-green-50 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* ================= LEFT ================= */}
        <div className="relative flex flex-col justify-center px-14 bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white">
          <h1 className="text-[44px] font-semibold mb-6">
            Bienvenue
          </h1>

          <p className="text-[18px] text-white/90 max-w-md">
            Plateforme RH intelligente dédiée à l’équipe de recrutement d’Optylab.
          </p>

          {/* Cercles décoratifs */}
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/15 rounded-full pointer-events-none" />
          <div className="absolute top-16 right-16 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* ================= RIGHT ================= */}
        <div className="p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/optylab.png"
              alt="Optylab"
              width={180}
              height={70}
              priority
            />
          </div>

          <h2 className="text-[28px] font-semibold text-gray-800 text-center mb-2">
            Connexion Recruteur
          </h2>

          <p className="text-[14.5px] text-gray-500 text-center mb-8">
            Accès réservé à l’équipe RH d’Optylab
          </p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Email professionnel
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6CB33F] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6CB33F] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white py-3 rounded-xl transition"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
