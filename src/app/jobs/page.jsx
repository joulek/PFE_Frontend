"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getJobs } from "../services/job.api";
import Pagination from "../components/Pagination";
import {
  Briefcase,
  CalendarClock,
  MapPin,
  Send,
  GraduationCap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function JobsPublicPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // home | offres | emploi | stage
  const [activeTab, setActiveTab] = useState("home");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    getJobs()
      .then((res) => setJobs(res?.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const emploiJobs = useMemo(
    () => jobs.filter((j) => !j.typeOffre || j.typeOffre === "EMPLOI"),
    [jobs]
  );
  const stageJobs = useMemo(
    () => jobs.filter((j) => j.typeOffre === "STAGE"),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    if (activeTab === "emploi") return emploiJobs;
    if (activeTab === "stage") return stageJobs;
    return [];
  }, [activeTab, emploiJobs, stageJobs]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => setPage(1), [activeTab]);

  const PageShell = ({ children }) => (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      {children}
    </div>
  );

  const Container = ({ children, className = "" }) => (
    <div className={`max-w-6xl mx-auto px-6 ${className}`}>{children}</div>
  );

  const SoftCard = ({ children, className = "" }) => (
    <div
      className={`rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );

  const PrimaryButton = ({
    onClick,
    children,
    className = "",
    type = "button",
  }) => (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all
      bg-[#6CB33F] hover:bg-[#4E8F2F] text-white shadow-md shadow-emerald-500/15
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6CB33F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0FAF0]
      dark:focus-visible:ring-offset-gray-950 ${className}`}
    >
      {children}
    </button>
  );

  const SecondaryButton = ({ href, children, className = "" }) => (
    <Link href={href} className="inline-flex">
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all
        border border-gray-300/90 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100
        hover:border-[#6CB33F] hover:text-[#4E8F2F] dark:hover:border-emerald-500
        shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6CB33F] focus-visible:ring-offset-2
        focus-visible:ring-offset-[#F0FAF0] dark:focus-visible:ring-offset-gray-950 ${className}`}
      >
        {children}
      </span>
    </Link>
  );

  // ✅ HERO list (emploi / stage) - corrigé: plus de "ligne" (pas de overflow-hidden)
  const ListHero = ({ variant }) => {
    const isStage = variant === "stage";

    const title = isStage
      ? "Trouvez le stage qui vous correspond"
      : "Trouvez l’offre qui vous correspond";

    const subtitle = isStage
      ? "Explorez nos opportunités de stage (PFE, été, alternance) et postulez en quelques minutes."
      : "Explorez nos opportunités (emploi) et postulez en quelques minutes. Tout est sur une seule page, sans écrans vides.";

    return (
      <div className="relative">
        {/* accents (pas de gradient) */}
        {/* ✅ important: on étend l'inset + on n'utilise pas overflow-hidden => pas de coupure/ligne */}
        <div aria-hidden className="pointer-events-none absolute -inset-24">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[42rem] rounded-full bg-[#6CB33F]/10 blur-3xl dark:bg-emerald-500/10" />
          <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/10" />
          <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/10" />
        </div>

        <div className="pt-4 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>

              <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <PrimaryButton
                  onClick={() => {
                    const el = document.getElementById("jobs-grid");
                    if (el)
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  className="w-full sm:w-auto"
                >
                  Explorer les offres <ArrowRight size={16} />
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // HOME SCREEN (CARRIÈRE)
  // =========================
  if (activeTab === "home") {
    return (
      <PageShell>
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[42rem] rounded-full bg-[#6CB33F]/10 blur-3xl dark:bg-emerald-500/10" />
            <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/10" />
            <div className="absolute bottom-0 right-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/10" />
          </div>

          <Container className="py-10">
            <div className="min-h-[calc(100vh-160px)] flex items-center">
              <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="text-center lg:text-left">
                    <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      Construisons votre prochaine{" "}
                      <span className="text-[#4E8F2F] dark:text-emerald-400">
                        opportunité
                      </span>
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
                      Postulez à nos offres ou envoyez une candidature spontanée.
                      Un parcours simple, clair, et rapide .
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
                      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 px-4 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Offres emploi
                        </p>
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                          {emploiJobs.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 px-4 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Stages
                        </p>
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                          {stageJobs.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                      <PrimaryButton
                        onClick={() => setActiveTab("offres")}
                        className="w-full sm:w-auto"
                      >
                        <Briefcase size={16} />
                        Voir les offres
                        <ChevronRight size={16} />
                      </PrimaryButton>

                      <SecondaryButton
                        href="/jobs/spontaneous"
                        className="w-full sm:w-auto"
                      >
                        <Send size={16} />
                        Candidature spontanée
                      </SecondaryButton>
                    </div>

                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Conseil : choisissez d’abord une catégorie (Emploi / Stage)
                      puis filtrez facilement.
                    </p>
                  </div>

                  <div className="hidden lg:block">
                    <SoftCard className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Parcours candidat
                          </p>
                          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Rapide & clair
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-[#E9F5E3] dark:bg-emerald-950/40 grid place-items-center">
                          <Briefcase className="text-[#6CB33F]" />
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                          <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 grid place-items-center">
                            <ChevronRight className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              Choisir une catégorie
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Emploi ou Stage selon votre profil.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                          <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 grid place-items-center">
                            <CalendarClock className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              Consulter les détails
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Lieu, clôture, missions, compétences.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                          <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 grid place-items-center">
                            <Send className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              Postuler en quelques minutes
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Process simple, sans friction.
                            </p>
                          </div>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </PageShell>
    );
  }

  // =========================
  // OFFRES SELECTION SCREEN (choix recrutement/stage)
  // ✅ FIX: supprimer le défilement ici
  // =========================
  if (activeTab === "offres") {
    return (
      <PageShell>
        {/* ✅ hauteur visible + pas de scroll */}
        <div className="h-[calc(100vh-96px)] overflow-hidden">
          <Container className="h-full py-8">
            <div className="h-full flex items-center">
              <div className="w-full">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                      Offres d&apos;emploi
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
                      Choisissez une catégorie pour afficher toutes les offres disponibles
                      avec une lecture claire et un design cohérent.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60">
                      Total: {jobs.length}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60">
                      Emploi: {emploiJobs.length}
                    </span>
                    <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60">
                      Stage: {stageJobs.length}
                    </span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setActiveTab("emploi")}
                    className="group text-left"
                  >
                    <SoftCard className="p-7 hover:shadow-[0_18px_55px_-35px_rgba(0,0,0,0.35)] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-[#E9F5E3] dark:bg-emerald-950/40 grid place-items-center">
                          <Briefcase size={26} className="text-[#6CB33F]" />
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          Voir{" "}
                          <ChevronRight
                            size={16}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold text-gray-900 dark:text-white">
                        Recrutement
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        CDI, CDD, CIVP et autres contrats.
                      </p>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#4E8F2F] dark:text-emerald-300">
                          {emploiJobs.length} offre(s)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Cliquez pour afficher la liste
                        </span>
                      </div>
                    </SoftCard>
                  </button>

                  <button
                    onClick={() => setActiveTab("stage")}
                    className="group text-left"
                  >
                    <SoftCard className="p-7 hover:shadow-[0_18px_55px_-35px_rgba(0,0,0,0.35)] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 grid place-items-center">
                          <GraduationCap
                            size={26}
                            className="text-blue-600 dark:text-blue-300"
                          />
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                          Voir{" "}
                          <ChevronRight
                            size={16}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold text-gray-900 dark:text-white">
                        Stages
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        PFE, stage d&apos;été, alternance.
                      </p>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {stageJobs.length} offre(s)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Cliquez pour afficher la liste
                        </span>
                      </div>
                    </SoftCard>
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </PageShell>
    );
  }

  // =========================
  // LIST (emploi ou stage)
  // =========================
  const isStageTab = activeTab === "stage";

  return (
    <PageShell>
      <Container className="py-10">
        {/* ✅ HERO corrigé */}
        <ListHero variant={isStageTab ? "stage" : "emploi"} />

        {/* GRID */}
        <div id="jobs-grid" className="pt-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              Chargement…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedJobs.map((job) => (
                  <div
                    key={job._id}
                    className={`rounded-3xl border bg-white dark:bg-gray-900/60 backdrop-blur-sm shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] p-6 flex flex-col hover:shadow-[0_18px_55px_-35px_rgba(0,0,0,0.35)] transition-all ${
                      isStageTab
                        ? "border-blue-100/80 dark:border-blue-900/40"
                        : "border-emerald-100/80 dark:border-emerald-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                        {job.titre}
                      </h3>
                      {isStageTab && (
                        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                          Stage
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 whitespace-pre-line">
                      {job.description || "—"}
                    </p>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-3" />

                    <div className="mt-1 flex items-end justify-between gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
                        {job.lieu && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{job.lieu}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-4 h-4 text-gray-400" />
                          <span>
                            Date de clôture : {formatDate(job.dateCloture)}
                          </span>
                        </div>
                      </div>

                      <Link href={`/jobs/${job._id}`} className="shrink-0">
                        <button
                          className={`h-10 px-5 rounded-full font-semibold text-sm inline-flex items-center gap-2 text-white transition-colors
                          ${
                            isStageTab
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-[#6CB33F] hover:bg-[#4E8F2F]"
                          }
                          focus:outline-none focus-visible:ring-2 ${
                            isStageTab
                              ? "focus-visible:ring-blue-500"
                              : "focus-visible:ring-[#6CB33F]"
                          } focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0FAF0] dark:focus-visible:ring-offset-gray-950`}
                        >
                          Voir détails
                          <ChevronRight size={16} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="col-span-full rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 p-12 text-center">
                    {isStageTab ? (
                      <GraduationCap className="mx-auto w-10 h-10 text-gray-400" />
                    ) : (
                      <Briefcase className="mx-auto w-10 h-10 text-gray-400" />
                    )}
                    <p className="mt-4 text-gray-600 dark:text-gray-300 font-semibold">
                      Aucune offre disponible pour le moment.
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Revenez bientôt, de nouvelles opportunités arrivent.
                    </p>
                  </div>
                )}
              </div>

              {filteredJobs.length > pageSize && (
                <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Total: {filteredJobs.length} offre(s) — Page {page} /{" "}
                    {totalPages}
                  </p>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </PageShell>
  );
}