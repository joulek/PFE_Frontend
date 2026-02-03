"use client";

import { useState } from "react";
import Image from "next/image";
import api from "../../services/api";
import { login } from "../../services/auth.api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        throw new Error("Réponse login invalide (token/user manquant)");
      }

      const role = String(user?.role || "").trim().toUpperCase();

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, role }));

      const maxAge = 60 * 60 * 24 * 7;

      document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;

      if (role === "ADMIN") {
        window.location.href = "/recruiter/dashboard";
      } else {
        window.location.href = "/ResponsableMetier/candidatures";
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur de connexion. Vérifiez vos informations."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-green-50 dark:bg-gray-950 flex items-center justify-center px-4 overflow-hidden transition-colors duration-300">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 transition-colors duration-300">
        {/* ================= LEFT ================= */}
        <div className="relative flex flex-col justify-center px-14 bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white">
          <h1 className="text-[44px] font-semibold mb-6">Bienvenue</h1>

          <p className="text-[18px] text-white/90 max-w-md">
            Plateforme RH intelligente dédiée à l’équipe de recrutement
            d’Optylab.
          </p>

          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/15 rounded-full pointer-events-none" />
          <div className="absolute top-16 right-16 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        </div>

        {/* ================= RIGHT ================= */}
        <div className="p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 flex justify-center">
            {/* Logo version claire (texte sombre) */}
            <Image
              src="/images/optylab_logo.png"
              alt="Optylab"
              width={180}
              height={70}
              priority
              className="dark:hidden"
            />

            {/* Logo version sombre (texte clair / blanc) */}
            <Image
              src="/images/logo_dark.png"
              alt="Optylab"
              width={180}
              height={70}
              priority
              className="hidden dark:block"
            />
          </div>

          <h2 className="text-[28px] font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
            Connexion Recruteur
          </h2>

          <p className="text-[14.5px] text-gray-500 dark:text-gray-400 text-center mb-8">
            Accès réservé à l’équipe RH d’Optylab
          </p>

          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                Email professionnel
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0L12 13.5 2.25 6.75"
                    />
                  </svg>
                </span>

                <input
                  type="email"
                  required
                  placeholder="votre.email@optylab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full pl-12 pr-4 py-3
                    border border-gray-300 dark:border-gray-600
                    rounded-xl
                    text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                    focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                    focus:border-[#6CB33F] dark:focus:border-emerald-500
                    outline-none transition
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                  "
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                Mot de passe
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75z"
                    />
                  </svg>
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="********"
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full pl-12 pr-12 py-3
                    border border-gray-300 dark:border-gray-600
                    rounded-xl
                    text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                    focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                    focus:border-[#6CB33F] dark:focus:border-emerald-500
                    outline-none transition
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 4.24A9.96 9.96 0 0112 4c5.52 0 10 4.48 10 8 0 1.35-.52 2.63-1.44 3.73M6.23 6.23C3.6 7.86 2 9.96 2 12c0 3.52 4.48 8 10 8a9.96 9.96 0 004.12-.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.25 12c0-3.52 4.48-8 10-8s10 4.48 10 8-4.48 8-10 8-10-4.48-10-8z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6CB33F] dark:bg-emerald-600 hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 text-white py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}