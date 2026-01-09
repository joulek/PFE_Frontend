"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getJobs } from "../services/job.api";
import Link from "next/link";

function formatDate(date) {
    return new Date(date).toLocaleDateString("fr-FR");
}

export default function PublicJobsPage() {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        getJobs().then((res) => setJobs(res.data));
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F7F5]">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-10">
                    Offres d’emploi
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobs.map((job) => {
                        const isExpired =
                            job.dateCloture &&
                            new Date(job.dateCloture) < new Date();

                        return (
                            <div
                                key={job._id}
                                className="bg-white rounded-2xl shadow p-6
                flex flex-col justify-between
                hover:shadow-lg transition"
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        {job.titre}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {job.description}
                                    </p>

                                    {/* TECHNOLOGIES */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {job.technologies?.map((tech, i) => (
                                            <span
                                                key={i}
                                                className="bg-[#E9F5E3] text-[#4E8F2F]
                        text-xs font-medium px-3 py-1 rounded-full"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>

                                    {/* DATE */}
                                    <p className="text-xs text-gray-500">
                                        Clôture : {formatDate(job.dateCloture)}
                                    </p>
                                </div>

                             
<div className="mt-6 flex justify-end">
  {isExpired ? (
    <button
      disabled
      className="px-6 py-2 rounded-full text-sm font-medium
                 bg-gray-200 text-gray-400 cursor-not-allowed"
    >
      Offre expirée
    </button>
  ) : (
    <Link href={`/jobs/${job._id}/apply`}>
      <button
        className="px-6 py-2 rounded-full text-sm font-medium transition
                   bg-[#6CB33F] text-white hover:bg-[#4E8F2F] shadow"
      >
        Postuler
      </button>
    </Link>
  )}
</div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
