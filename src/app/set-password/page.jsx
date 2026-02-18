"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/* ================= API HELPERS ================= */
async function verifyToken(token) {
  const res = await fetch(`${API_BASE}/users/setup-password/verify?token=${token}`);
  return res.json();
}

async function submitPassword(token, password) {
  const res = await fetch(`${API_BASE}/users/setup-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return res.json();
}

/* ================= PASSWORD STRENGTH ================= */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Très faible", color: "bg-red-500" };
  if (score === 2) return { score, label: "Faible", color: "bg-orange-400" };
  if (score === 3) return { score, label: "Moyen", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Fort", color: "bg-[#6CB33F]" };
  return { score, label: "Très fort", color: "bg-green-600" };
}

/* ================= COMPONENT ================= */
export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | valid | invalid | success | error
  const [userInfo, setUserInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Vérification du token au chargement ── */
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    verifyToken(token)
      .then((data) => {
        if (data.valid) {
          setUserInfo(data.user);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  /* ── Soumission du formulaire ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const data = await submitPassword(token, password);

      if (data.message && data.message.includes("succès")) {
        setStatus("success");
        // Rediriger vers login après 3 secondes
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setErrorMsg(data.message || "Une erreur est survenue.");
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(password);
  const fullName = userInfo
    ? [userInfo.prenom, userInfo.nom].filter(Boolean).join(" ")
    : "";

  /* ── États d'affichage ── */
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#6CB33F]" />
          <p className="text-gray-600 text-sm">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Ce lien d&apos;activation est expiré ou invalide. Contactez votre administrateur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-[#6CB33F]" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            Mot de passe défini !
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Votre compte est maintenant actif. Vous allez être redirigé vers la page de connexion...
          </p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#6CB33F]" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulaire principal ── */
  return (
    <div className="min-h-screen bg-[#F0FAF0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#6CB33F] shadow-lg mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Activer votre compte
          </h1>
          {fullName && (
            <p className="mt-2 text-gray-600 text-sm">
              Bienvenue, <strong>{fullName}</strong> !
            </p>
          )}
          <p className="mt-1 text-gray-500 text-sm">
            Définissez votre mot de passe pour accéder à la plateforme.
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-3xl bg-white shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* MOT DE PASSE */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-900">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-200 
                    bg-gray-50 py-3 pl-10 pr-12
                    text-sm text-gray-800
                    outline-none focus:border-[#6CB33F] focus:ring-1 focus:ring-[#6CB33F]
                    transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* FORCE DU MOT DE PASSE */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Force : <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* CONFIRMER MOT DE PASSE */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-900">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6CB33F]" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full rounded-xl border py-3 pl-10 pr-12
                    bg-gray-50 text-sm text-gray-800
                    outline-none transition-colors
                    ${confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-300"
                      : "border-gray-200 focus:border-[#6CB33F] focus:ring-1 focus:ring-[#6CB33F]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="mt-1 text-xs text-[#4E8F2F]">✓ Les mots de passe correspondent.</p>
              )}
            </div>

            {/* RÈGLES */}
            <div className="rounded-xl bg-[#F0FAF0] border border-[#D7EBCF] p-4 text-xs text-gray-600 space-y-1">
              <p className={password.length >= 8 ? "text-[#4E8F2F]" : ""}>
                {password.length >= 8 ? "✓" : "○"} Au moins 8 caractères
              </p>
              <p className={/[A-Z]/.test(password) ? "text-[#4E8F2F]" : ""}>
                {/[A-Z]/.test(password) ? "✓" : "○"} Une lettre majuscule
              </p>
              <p className={/[0-9]/.test(password) ? "text-[#4E8F2F]" : ""}>
                {/[0-9]/.test(password) ? "✓" : "○"} Un chiffre
              </p>
              <p className={/[^A-Za-z0-9]/.test(password) ? "text-[#4E8F2F]" : ""}>
                {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Un caractère spécial (!@#$...)
              </p>
            </div>

            {/* ERREUR */}
            {errorMsg && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 8}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6CB33F] 
                py-3.5 text-sm font-semibold text-white
                hover:bg-[#4E8F2F] disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors shadow-md"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Activer mon compte
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Optylab — Plateforme RH Intelligente
        </p>
      </div>
    </div>
  );
}