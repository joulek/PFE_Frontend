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

  const role                  = (req.cookies.get("role")?.value || "").trim().toUpperCase();
  const isAdmin               = role === "ADMIN";
  const isAssistanteRH        = role === "ASSISTANTE_RH";
  const isAssistanceDirection = role === "ASSISTANCE_DIRECTION";
  const isResponsableRHOPTYLAB   = role === "RESPONSABLE_RH_OPTYLAB";
  const isResponsableRHNord      = role === "RESPONSABLE_RH_NORD";
  const isResponsableMetier      = role === "RESPONSABLE_METIER";
  const isDGA                    = role === "DGA";

  const isRecruiterPath   = pathname.startsWith("/recruiter");
  const isResponsablePath =
    pathname.startsWith("/ResponsableMetier") ||
    pathname.startsWith("/responsableMetier");

  const isAssistanceDirPath     = pathname.startsWith("/entretiens-confirmes");
  const isDGAPath = pathname.startsWith("/entretiens") && !pathname.startsWith("/entretiens-confirmes");
  const isFichesPath            = pathname.startsWith("/fiche_renseignement");
  const isResponsableRHOPTYLABPath = pathname.startsWith("/RESPONSABLE_RH_OPTYLAB");
  const isResponsableRHNordPath    = pathname.startsWith("/RESPONSABLE_RH_NORD");

  // Pages partagées ADMIN + ASSISTANTE_RH (hors /recruiter)
  const isSharedRHPath =
    pathname.startsWith("/employees") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/utilisateur");

  // /calendar → ADMIN + ASSISTANTE_RH + ASSISTANCE_DIRECTION
  const isCalendarPath = pathname.startsWith("/calendar");

  const isLoginPage    = pathname.startsWith("/login");
  const isUnauthorized = pathname.startsWith("/unauthorized");
  const isProtected    = isRecruiterPath || isResponsablePath || isSharedRHPath || isAssistanceDirPath || isCalendarPath || isResponsableRHOPTYLABPath || isResponsableRHNordPath || isFichesPath;

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

  // /employees + /roles → ADMIN + ASSISTANTE_RH uniquement
  if (isSharedRHPath && token && !isAdmin && !isAssistanteRH) return redirect("/unauthorized");

  // /calendar → ADMIN + ASSISTANTE_RH + ASSISTANCE_DIRECTION + RESPONSABLE_RH_OPTYLAB + DGA
  if (isCalendarPath && token && !isAdmin && !isAssistanteRH && !isAssistanceDirection && !isResponsableRHOPTYLAB && !isResponsableRHNord && !isDGA) return redirect("/unauthorized");

  // /entretiens-confirmes/* → ASSISTANCE_DIRECTION + ADMIN + DGA
  if (isAssistanceDirPath && token && !isAdmin && !isAssistanceDirection ) return redirect("/unauthorized");
 if (isDGAPath && token && !isDGA ) return redirect("/unauthorized");
  // /fiche_renseignement → RESPONSABLE_METIER + RESPONSABLE_RH_NORD + RESPONSABLE_RH_OPTYLAB + ADMIN
  if (isFichesPath && token && !isResponsableMetier && !isResponsableRHNord && !isResponsableRHOPTYLAB && !isAdmin) return redirect("/unauthorized");

  // /RESPONSABLE_RH_OPTYLAB/* → RESPONSABLE_RH_OPTYLAB uniquement
  if (isResponsableRHOPTYLABPath && token && !isResponsableRHOPTYLAB) return redirect("/unauthorized");

  // /RESPONSABLE_RH_NORD/* → RESPONSABLE_RH_NORD uniquement
  if (isResponsableRHNordPath && token && !isResponsableRHNord) return redirect("/unauthorized");

  // 3) Connecté et va /login => redirection selon rôle
 if (isLoginPage && token) {
    if (isAdmin)               return redirect("/recruiter/dashboard");
    if (isAssistanteRH)        return redirect("/employees");
    if (isAssistanceDirection) return redirect("/entretiens-confirmes");
    if (isDGA)                 return redirect("/entretiens"); // ← ajoute ça
    if (isResponsableRHOPTYLAB)   return redirect("/RESPONSABLE_RH_OPTYLAB");
    if (isResponsableRHNord)      return redirect("/RESPONSABLE_RH_NORD");
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