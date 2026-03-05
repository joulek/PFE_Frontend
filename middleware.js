import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const rawToken = req.cookies.get("token")?.value ?? "";
  const decodedToken = rawToken ? decodeURIComponent(rawToken) : "";
  const token =
    decodedToken &&
    decodedToken !== "null" &&
    decodedToken !== "undefined" &&
    decodedToken.trim() !== ""
      ? decodedToken
      : null;

  const role          = (req.cookies.get("role")?.value || "").trim().toUpperCase();
  const isAdmin       = role === "ADMIN";
  const isAssistanteRH = role === "ASSISTANTE_RH";

  const isRecruiterPath   = pathname.startsWith("/recruiter");
  const isResponsablePath =
    pathname.startsWith("/ResponsableMetier") ||
    pathname.startsWith("/responsableMetier");

  // Pages partagées ADMIN + ASSISTANTE_RH (hors /recruiter)
  const isSharedRHPath =
    pathname.startsWith("/employees") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/utilisateur");
    pathname.startsWith("/calendar");

  const isLoginPage    = pathname.startsWith("/login");
  const isUnauthorized = pathname.startsWith("/unauthorized");
  const isProtected    = isRecruiterPath || isResponsablePath || isSharedRHPath;

  const redirect = (to) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  };

  // 1) Protected + pas connecté => login
  if (isProtected && !token) return redirect("/login");

  // 2) Routing par rôle
  // /recruiter/* → ADMIN uniquement
  if (isRecruiterPath && token && !isAdmin) return redirect("/unauthorized");

  // /ResponsableMetier/* → RESPONSABLE_METIER + ASSISTANTE_RH (pas ADMIN)
  if (isResponsablePath && token && isAdmin) return redirect("/unauthorized");

  // /employees + /roles → ADMIN + ASSISTANTE_RH uniquement (pas RESPONSABLE_METIER)
  if (isSharedRHPath && token && !isAdmin && !isAssistanteRH) return redirect("/unauthorized");

  // 3) Connecté et va /login => redirection selon rôle
  if (isLoginPage && token) {
    if (isAdmin)         return redirect("/recruiter/dashboard");
    if (isAssistanteRH)  return redirect("/employees");
    return redirect("/ResponsableMetier/candidatures");
  }

  // 4) No cache pages sensibles
  if (isProtected || isLoginPage || isUnauthorized) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};