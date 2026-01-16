"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getJobCount } from "../../services/job.api";
import { getCondidatureCount } from "../../services/candidature.api";

export default function RecruiterDashboard() {

  const [stats, setStats] = useState({
    jobOffers: 0,
    candidatures: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [jobsRes, candRes] = await Promise.all([
          getJobCount(),
          getCondidatureCount(),
        ]);


        setStats({
          jobOffers: jobsRes.data.count,
          candidatures: candRes.data.count,
        });
      } catch (err) {
        console.error("Erreur stats", err);
      }
    }

    loadStats();
  }, []);


  return (
    <div className="min-h-screen bg-green-50 px-6 py-14">
      <div className="max-w-7xl mx-auto">

        {/* ===== Header ===== */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue dans votre espace RH 👋
        </h1>

        <p className="text-gray-600 mb-10">
          Voici un aperçu de vos activités de recrutement.
        </p>

        {/* ===== Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* Offres */}
          <div className="bg-white rounded-3xl shadow-md p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">
              📄
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium">
                Offres d’emploi
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.jobOffers}
              </p>
            </div>
          </div>

          {/* Candidatures */}
          <div className="bg-white rounded-3xl shadow-md p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
              👥
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium">
                Candidatures
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.candidatures}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
