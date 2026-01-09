"use client";

import { useState } from "react";
import Image from "next/image";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

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
    <div className="min-h-screen bg-[#F4F7F5]">
      {/* NAVBAR */}
      <Navbar />

      {/* LOGIN CONTAINER */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

          {/* ================= LEFT : WELCOME ================= */}
          <div
            className="relative flex flex-col justify-center px-14
            bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white"
          >
            <h1 className="text-[44px] font-semibold tracking-tight leading-tight mb-6">
              Bienvenue
            </h1>

            <p className="text-[18px] leading-relaxed text-white/90 max-w-md">
              Plateforme RH intelligente dédiée à l’équipe de recrutement
              d’Optylab.
            </p>

            {/* Cercles décoratifs */}
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/15 rounded-full"></div>
            <div className="absolute top-16 right-16 w-48 h-48 bg-white/10 rounded-full"></div>
          </div>

          {/* ================= RIGHT : LOGIN FORM ================= */}
          <div className="p-12 flex flex-col justify-center">

            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Image
                src="/images/optylab.png"
                alt="Optylab"
                width={200}
                height={80}
                style={{ width: "auto", height: "auto" }}
              />
            </div>

            <h2 className="text-[28px] font-semibold text-gray-800 tracking-tight text-center mb-2">
              Connexion Recruteur
            </h2>

            <p className="text-[14.5px] text-gray-500 text-center mb-10">
              Accès réservé à l’équipe RH d’Optylab
            </p>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[13.5px] font-medium text-gray-600">
                  Email professionnel
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 border border-gray-300
                  rounded-xl text-[15px]
                  focus:ring-2 focus:ring-[#6CB33F]
                  focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="text-[13.5px] font-medium text-gray-600">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 border border-gray-300
                  rounded-xl text-[15px]
                  focus:ring-2 focus:ring-[#6CB33F]
                  focus:border-transparent outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6CB33F] hover:bg-[#4E8F2F]
                text-white text-[15px] font-medium
                py-3 rounded-xl transition"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
