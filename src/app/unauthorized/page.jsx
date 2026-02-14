"use client";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  function getCookie(name) {
    const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
    if (!row) return null;
    const val = row.split("=").slice(1).join("=");
    if (!val || val === "null" || val === "undefined" || val.trim() === "") return null;
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  }

  const handleGoBack = () => {
    const token = getCookie("token") || localStorage.getItem("token");
    const role = (getCookie("role") || localStorage.getItem("role") || "").toUpperCase();

    if (!token) return router.replace("/login");
    if (role === "ADMIN") return router.replace("/recruiter/dashboard");
    return router.replace("/ResponsableMetier/candidatures");
  };

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-6 transition-colors duration-300">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldX className="h-10 w-10 text-red-500 dark:text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          Accès refusé
        </h1>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>

        {/* Card */}
        <div className="mt-8 rounded-3xl bg-white dark:bg-gray-800 shadow-lg p-8 transition-colors duration-300">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter
            votre administrateur.
          </p>

          <button
            onClick={handleGoBack}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mon espace
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Erreur 403 — Non autorisé
        </p>
      </div>
    </div>
  );
}
