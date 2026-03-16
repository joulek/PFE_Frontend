"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brain, Loader2, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

    if (ids.length < 2) {
      router.replace("/recruiter/comparisons_list");
      return;
    }

    async function run() {
      try {
        const res = await fetch(`${API_BASE}/api/interviews/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ interviewIds: ids }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Erreur serveur");
        }

        router.replace(`/recruiter/compare_interviews/${data.comparisonId}`);
      } catch (err) {
        setError(err.message || "Erreur inattendue");
      }
    }

    run();
  }, [searchParams, router]);

  // ── Erreur ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto" />
          <p className="text-red-600 dark:text-red-400 font-bold text-lg">{error}</p>
          <button
            onClick={() => router.push("/recruiter/list_interview")}
            className="px-5 py-2.5 rounded-full bg-[#6CB33F] text-white font-semibold text-sm hover:bg-[#4E8F2F] transition-colors"
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E9F5E3] dark:bg-[#6CB33F]/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-[#6CB33F] animate-pulse" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
            Analyse IA en cours…
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Le LLM compare les candidats, veuillez patienter
          </p>
        </div>
        <Loader2 className="w-6 h-6 text-[#6CB33F] animate-spin" />
      </div>
    </div>
  );
}

export default function CompareInterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
          <Loader2 className="w-8 h-8 text-[#6CB33F] animate-spin" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}